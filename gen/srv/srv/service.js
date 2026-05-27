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
});
