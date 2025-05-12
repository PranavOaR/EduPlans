const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');  // Add this line
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/emailService');

router.post('/signup', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username, 
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(400).json({ 
            error: error.code === 11000 ? 'Email or username already exists' : error.message 
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        console.log('[LOGIN] Attempt with email:', req.body.email);
        
        // Validate input
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('[LOGIN] Missing email or password');
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            console.log('[LOGIN] User not found with email:', email);
            return res.status(400).json({ error: 'Invalid login credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('[LOGIN] Password mismatch for user:', email);
            return res.status(400).json({ error: 'Invalid login credentials' });
        }

        console.log('[LOGIN] Successful login for user:', email, 'ID:', user._id);
        
        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user._id.toString(), 
                username: user.username, 
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('[LOGIN] Token generated of length:', token.length);

        // Return success response with token and user data
        res.json({
            token,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('[LOGIN] Error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error('No account found with this email');
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Store reset token and expiry in user document
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create reset link - use the frontend URL with the token
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password.html?token=${resetToken}`;
        
        // Send email with reset link
        await sendPasswordResetEmail(user.email, resetLink);

        // For testing purposes, log the reset link
        console.log(`Password reset link: ${resetLink}`);

        res.json({ 
            message: 'Password reset link sent successfully'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ 
            _id: decoded.userId,
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            throw new Error('Invalid or expired reset token');
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Test authentication endpoint
router.get('/verify-token', async (req, res) => {
    try {
        const authHeader = req.header('Authorization');
        console.log('[VERIFY] Request received with auth header:', authHeader ? 'Present' : 'Missing');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                authenticated: false, 
                error: 'No token provided' 
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        try {
            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find the user
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                return res.status(401).json({ 
                    authenticated: false, 
                    error: 'User not found' 
                });
            }
            
            // Return success
            return res.json({
                authenticated: true,
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    email: user.email
                }
            });
            
        } catch (tokenError) {
            console.error('[VERIFY] Token error:', tokenError.message);
            return res.status(401).json({ 
                authenticated: false, 
                error: tokenError.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
            });
        }
    } catch (error) {
        console.error('[VERIFY] Error:', error);
        res.status(500).json({ 
            authenticated: false, 
            error: 'Server error' 
        });
    }
});

// Google Authentication route
router.post('/google', async (req, res) => {
    try {
        const { googleId, email, firstName, lastName, profilePicture } = req.body;
        
        if (!googleId || !email) {
            return res.status(400).json({ error: 'Google ID and email are required' });
        }

        console.log('[GOOGLE AUTH] Attempt with email:', email);
        
        // Check if user already exists by googleId
        let user = await User.findOne({ googleId });
        
        // If not found by googleId, check by email
        if (!user) {
            user = await User.findOne({ email });
            
            if (user) {
                // User exists but hasn't logged in with Google before
                if (!user.googleId) {
                    // Link the Google account to existing user
                    user.googleId = googleId;
                    user.profilePicture = profilePicture || user.profilePicture;
                    await user.save();
                    console.log('[GOOGLE AUTH] Linked Google account to existing user:', email);
                }
            } else {
                // This is a new user - we need them to complete registration
                // Return a special response that will redirect to signup form
                console.log('[GOOGLE AUTH] New user needs to complete registration:', email);
                return res.json({
                    status: 'incomplete_registration',
                    message: 'Please complete your registration',
                    userData: {
                        googleId,
                        email,
                        firstName,
                        lastName,
                        profilePicture
                    }
                });
            }
        }
        
        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user._id.toString(), 
                username: user.username, 
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Return success response
        res.json({
            token,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('[GOOGLE AUTH] Error:', error);
        res.status(500).json({ error: 'An error occurred during Google authentication' });
    }
});

module.exports = router;