const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const today = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    this.before('CREATE', 'ServiceTaskSet', (req) => {
        // Auto-set the creation date for the Analytics dashboard if not provided
        if (!req.data.Date) {
            req.data.Date = today();
        }
        
        // Ensure Status is Pending on create
        if (!req.data.Status) {
            req.data.Status = 'Pending';
        }
        
        // Generate UUID if not provided by client
        if (!req.data.Guid) {
            req.data.Guid = cds.utils.uuid();
        }
    });
    
    this.before('UPDATE', 'ServiceTaskSet', async (req) => {
        // Prevent changing status backwards from Completed
        const currentRecord = await cds.tx(req).run(SELECT.one.from('WashWizard.ServiceTask').where({ Guid: req.data.Guid }));
        if (currentRecord && currentRecord.Status === 'Completed' && req.data.Status && req.data.Status !== 'Completed') {
            return req.reject(400, 'Cannot change status of a completed service.');
        }

        // Auto-set CompletedAt date when marked as Completed
        if (req.data.Status === 'Completed' && (!currentRecord || currentRecord.Status !== 'Completed')) {
             req.data.CompletedAt = today();
        }
    });
});
