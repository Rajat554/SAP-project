const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = new cds.User({
                id: decoded.username,
                roles: [decoded.role, 'authenticated-user']
            });
            return next();
        } catch (err) {
            console.error("JWT Verification Error:", err.message);
            // Fall through to anonymous
        }
    }
    
    // No auth header or invalid token
    req.user = new cds.User({ id: 'anonymous', roles: [] });
    next();
};
