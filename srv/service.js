const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    this.before('CREATE', 'ServiceTaskSet', (req) => {
        // Auto-set the creation date for the Analytics dashboard if not provided
        if (!req.data.Date) {
            const today = new Date();
            req.data.Date = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
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
    
    this.before('UPDATE', 'ServiceTaskSet', (req) => {
        // Auto-set CompletedAt date when marked as Completed
        if (req.data.Status === 'Completed') {
             const today = new Date();
             req.data.CompletedAt = today.toISOString().split('T')[0];
        }
    });
});
