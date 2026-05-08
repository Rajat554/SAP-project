const cds = require('@sap/cds');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Basic ')) {
        const b64auth = authHeader.split(' ')[1];
        const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');

        if (cds.db) {
            // Query user from local SQLite table
            cds.db.read('WashWizard.Users').where({ Username: username, Password: password })
                .then(userResult => {
                    if (userResult && userResult.length > 0) {
                        const role = userResult[0].Role;
                        req.user = new cds.User({
                            id: username,
                            roles: [role, 'authenticated-user']
                        });
                    } else {
                        // Invalid user
                        req.user = new cds.User({ id: 'anonymous', roles: [] });
                    }
                    next();
                })
                .catch(err => {
                    console.error("Auth DB Error", err);
                    next();
                });
            return; // Wait for DB query to resolve
        }
    }
    
    // Default to anonymous if no auth provided or DB not ready
    req.user = new cds.User({ id: 'anonymous', roles: [] });
    next();
};
