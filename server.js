require('dotenv').config();
const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcrypt');

require('./db/init'); // Seed default users if DB is empty

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Create a .env file.');
}

cds.on('bootstrap', (app) => {
    // Enable JSON body parsing for our custom endpoints
    app.use(express.json());

    // Custom Login Endpoint
    app.post('/api/login', async (req, res) => {
        // Input sanitization
        const username = (req.body.username || '').trim().substring(0, 50);
        const password = (req.body.password || '').substring(0, 100);
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        try {
            // Fetch user by username ONLY
            const userResult = await cds.db.read('WashWizard.Users').where({ Username: username });
            
            if (userResult && userResult.length > 0) {
                const user = userResult[0];
                // Compare hashed password
                const passwordMatch = await bcrypt.compare(password, user.Password);
                
                if (passwordMatch) {
                    const token = jwt.sign(
                        { username: user.Username, role: user.Role }, 
                        JWT_SECRET, 
                        { expiresIn: '12h' }
                    );
                    
                    // Make log on server
                    console.log(`[AUTH LOG] User ${user.Username} logged in successfully at ${new Date().toISOString()}`);
                    
                    res.json({ token, role: user.Role, username: user.Username });
                } else {
                    console.log(`[AUTH LOG] Failed login attempt for user: ${username} at ${new Date().toISOString()} (wrong password)`);
                    res.status(401).json({ error: 'Invalid credentials' });
                }
            } else {
                console.log(`[AUTH LOG] Failed login attempt for user: ${username} at ${new Date().toISOString()} (user not found)`);
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (err) {
            console.error("Login DB Error", err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Custom Logout Endpoint (mostly for logging as JWT is stateless)
    app.post('/api/logout', (req, res) => {
        const authHeader = req.headers.authorization;
        let username = 'Unknown';
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                username = decoded.username;
            } catch (e) {
                // Ignore error if token is invalid during logout
            }
        }
        
        // Make log on server
        console.log(`[AUTH LOG] User ${username} logged out at ${new Date().toISOString()}`);
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = cds.server;
