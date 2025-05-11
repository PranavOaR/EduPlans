const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        console.log('[AUTH] Request received with auth header:', authHeader ? 'Present' : 'Missing');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[AUTH] Error: No valid authorization header');
            return res.status(401).json({ error: 'Not authorized, no token' });
        }
        
        const token = authHeader.replace('Bearer ', '');
        console.log('[AUTH] Token received of length:', token.length);
        
        try {
            // Verify the JWT against our secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('[AUTH] Token decoded successfully:', decoded);
            
            // Find matching user in database
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                console.log('[AUTH] Error: User not found with ID:', decoded.userId);
                return res.status(401).json({ error: 'User not found' });
            }
            
            console.log('[AUTH] User authenticated:', user._id, 'Email:', user.email);
            
            // Add user and token to request object for use in route handlers
            req.user = user;
            req.token = token;
            next();
        } catch (e) {
            console.error('[AUTH] Token verification error:', e.name, e.message);
            
            // Provide specific error messages based on the JWT error type
            if (e.name === 'JsonWebTokenError') {
                console.log('[AUTH] Invalid token signature or structure');
                return res.status(401).json({ error: 'Invalid token' });
            } else if (e.name === 'TokenExpiredError') {
                console.log('[AUTH] Token is expired');
                return res.status(401).json({ error: 'Token expired' });
            } else {
                console.log('[AUTH] Other token error');
                return res.status(401).json({ error: 'Token is not valid' });
            }
        }
    } catch (error) {
        console.error('[AUTH] Middleware error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

module.exports = auth; 