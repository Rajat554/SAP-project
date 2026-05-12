const cds = require('@sap/cds');
const bcrypt = require('bcrypt');

cds.once('served', async () => {
    try {
        const existing = await cds.db.read('WashWizard.Users');
        if (existing && existing.length > 0) return; // DB already has data — skip seeding

        const SALT_ROUNDS = 12;

        await cds.db.run(INSERT.into('WashWizard.Users').entries([
            {
                Username: 'admin',
                Password: await bcrypt.hash('admin123', SALT_ROUNDS),
                Role:     'Admin'
            },
            {
                Username: 'staff',
                Password: await bcrypt.hash('staff123', SALT_ROUNDS),
                Role:     'Staff'
            }
        ]));

        console.log('[INIT] Default users seeded with hashed passwords.');
    } catch (err) {
        console.log('[INIT] Waiting for table deployment...', err.message);
    }
});
