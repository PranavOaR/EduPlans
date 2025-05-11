const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

// Debug endpoint to check user authentication
router.get('/auth-debug', auth, (req, res) => {
    try {
        res.json({
            message: 'Auth is working correctly',
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName
            }
        });
    } catch (error) {
        console.error('Auth debug error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Get current user's profile
router.get('/me', auth, async (req, res) => {
    try {
        console.log('GET /me - User:', req.user._id);
        
        let profile = await Profile.findOne({ user: req.user._id });
        console.log('Found profile:', profile ? 'Yes' : 'No');
        
        if (!profile) {
            console.log('Creating new profile for user:', req.user._id);
            // Create a new profile if one doesn't exist
            profile = new Profile({
                user: req.user._id,
                name: req.user.firstName && req.user.lastName 
                    ? `${req.user.firstName} ${req.user.lastName}` 
                    : req.user.username,
                email: req.user.email
            });
            await profile.save();
            console.log('New profile created:', profile._id);
        }
        
        res.json(profile);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Update current user's profile
router.put('/me', auth, async (req, res) => {
    try {
        console.log('PUT /me - User:', req.user._id);
        console.log('Request body:', req.body);
        
        const { name, email, bio, education, occupation, location, profileImage } = req.body;
        
        // Build profile object
        const profileFields = {};
        if (name) profileFields.name = name;
        if (email) profileFields.email = email;
        if (bio !== undefined) profileFields.bio = bio;
        if (education !== undefined) profileFields.education = education;
        if (occupation !== undefined) profileFields.occupation = occupation;
        if (location !== undefined) profileFields.location = location;
        if (profileImage !== undefined) profileFields.profileImage = profileImage;
        
        console.log('Profile fields to update:', profileFields);
        
        let profile = await Profile.findOne({ user: req.user._id });
        
        if (profile) {
            // Update
            console.log('Updating existing profile');
            profile = await Profile.findOneAndUpdate(
                { user: req.user._id },
                { $set: profileFields },
                { new: true }
            );
        } else {
            // Create
            console.log('Creating new profile');
            profileFields.user = req.user._id;
            profile = new Profile(profileFields);
            await profile.save();
        }
        
        console.log('Profile updated/created:', profile._id);
        res.json(profile);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Legacy routes - kept for backward compatibility but updated to use consistent auth approach

// Get user profile by user ID
router.get('/users/:userId/profile', auth, async (req, res) => {
    try {
        // Ensure the user is getting their own profile data
        if (req.user._id.toString() !== req.params.userId && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Not authorized to access this profile' });
        }
        
        const profile = await Profile.findOne({ user: req.params.userId });
        
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        res.json(profile);
    } catch (error) {
        console.error('Get profile by ID error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Update user profile by user ID
router.put('/users/:userId/profile', auth, async (req, res) => {
    try {
        // Ensure the user is updating their own profile
        if (req.user._id.toString() !== req.params.userId && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Not authorized to update this profile' });
        }
        
        const { name, email, bio, education, occupation, location, profileImage } = req.body;
        
        // Build profile object
        const profileFields = {};
        if (name) profileFields.name = name;
        if (email) profileFields.email = email;
        if (bio !== undefined) profileFields.bio = bio;
        if (education !== undefined) profileFields.education = education;
        if (occupation !== undefined) profileFields.occupation = occupation;
        if (location !== undefined) profileFields.location = location;
        if (profileImage !== undefined) profileFields.profileImage = profileImage;
        
        let profile = await Profile.findOne({ user: req.params.userId });
        
        if (profile) {
            // Update
            profile = await Profile.findOneAndUpdate(
                { user: req.params.userId },
                { $set: profileFields },
                { new: true }
            );
        } else {
            // Create
            profileFields.user = req.params.userId;
            profile = new Profile(profileFields);
            await profile.save();
        }
        
        res.json(profile);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Get user stats
router.get('/users/:userId/stats', auth, async (req, res) => {
    try {
        // Ensure user can only access their own stats
        if (req.user._id.toString() !== req.params.userId && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Not authorized to access these stats' });
        }
        
        const profile = await Profile.findOne({ user: req.params.userId });
        
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        res.json(profile.stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Update user stats
router.put('/users/:userId/stats', auth, async (req, res) => {
    try {
        // Ensure user can only update their own stats
        if (req.user._id.toString() !== req.params.userId && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Not authorized to update these stats' });
        }
        
        const { studyHours, pomodoroCompleted, tasksCompleted, codesCompiled } = req.body;
        
        // Build stats object
        const statsFields = {};
        if (studyHours !== undefined) statsFields['stats.studyHours'] = studyHours;
        if (pomodoroCompleted !== undefined) statsFields['stats.pomodoroCompleted'] = pomodoroCompleted;
        if (tasksCompleted !== undefined) statsFields['stats.tasksCompleted'] = tasksCompleted;
        if (codesCompiled !== undefined) statsFields['stats.codesCompiled'] = codesCompiled;
        
        let profile = await Profile.findOne({ user: req.params.userId });
        
        if (profile) {
            // Update
            profile = await Profile.findOneAndUpdate(
                { user: req.params.userId },
                { $set: statsFields },
                { new: true }
            );
            res.json(profile.stats);
        } else {
            return res.status(404).json({ error: 'Profile not found' });
        }
    } catch (error) {
        console.error('Update stats error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router; 