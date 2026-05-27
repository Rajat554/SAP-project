const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const today = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // ── Auto-set defaults on CREATE ──────────────────────────
    this.before('CREATE', 'ServiceTaskSet', (req) => {
        if (!req.data.ServiceDate) {
            req.data.ServiceDate = today();
        }
        if (!req.data.Status) {
            req.data.Status = 'Pending';
        }
    });

    // ── Guard: prevent status regression from Completed ──────
    this.before('UPDATE', 'ServiceTaskSet', async (req) => {
        if (!req.data.Status) return;

        const current = await SELECT.one.from('WashWizard.ServiceTask')
            .where({ ID: req.data.ID });

        if (current && current.Status === 'Completed' && req.data.Status !== 'Completed') {
            return req.reject(400, 'Cannot change status of a completed service.');
        }

        // Auto-set CompletedAt timestamp
        if (req.data.Status === 'Completed' && (!current || current.Status !== 'Completed')) {
            req.data.CompletedAt = today();
        }
    });

    // ── Bound Action: completeService ────────────────────────
    this.on('completeService', 'ServiceTaskSet', async (req) => {
        const key = req.params[0];
        const ID = typeof key === 'object' ? key.ID : key;

        if (!ID) return req.error(400, 'Service Entry ID is required');

        const entry = await SELECT.one.from('WashWizard.ServiceTask').where({ ID });
        if (!entry) return req.error(404, 'Service Entry not found');
        if (entry.Status === 'Completed') return req.error(400, 'Service is already completed');

        await UPDATE('WashWizard.ServiceTask', ID).with({
            Status     : 'Completed',
            CompletedAt: today()
        });

        return SELECT.one.from('WashWizard.ServiceTask').where({ ID });
    });

    // ── Auto-populate Price from Catalog when ServiceType changes ──
    this.before('PATCH', 'ServiceTaskSet', async (req) => {
        const { ServiceType } = req.data;
        if (ServiceType === undefined) return; // ServiceType wasn't changed

        if (!ServiceType) {
            req.data.Amount = 0;
            return;
        }

        // Look up the price in the ServiceCatalog master table
        const catalogItem = await SELECT.one.from('WashWizard.ServiceCatalog')
            .where({ ServiceName: ServiceType });

        if (catalogItem) {
            req.data.Amount = catalogItem.Price;
        } else {
            req.data.Amount = 0;
        }
    });

    // ── Draft Garbage Collection (State Cleanup) ────────────────
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // Run every hour
    const STALE_DRAFT_RETENTION_DAYS = 30; // Purge drafts older than 30 days

    async function cleanupStaleDrafts() {
        try {
            const thresholdDate = new Date(Date.now() - STALE_DRAFT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
            
            // Delete drafts from DraftAdministrativeData (cascades to all draft tables)
            const deletedCount = await DELETE.from('WashWizardService.DraftAdministrativeData')
                .where({ LastChangeDateTime: { '<': thresholdDate } });
                
            if (deletedCount > 0) {
                console.log(`[Draft Cleanup] Purged ${deletedCount} stale draft records older than ${STALE_DRAFT_RETENTION_DAYS} days.`);
            }
        } catch (err) {
            console.error('[Draft Cleanup] Error cleaning up stale drafts:', err);
        }
    }

    // Run cleanup on startup and then periodically
    cds.spawn({}, async () => {
        await cleanupStaleDrafts();
        setInterval(cleanupStaleDrafts, CLEANUP_INTERVAL);
    });
});
