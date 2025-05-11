/**
 * MongoDB setup script for EduPlans
 * 
 * This script ensures the MongoDB collections and indexes are properly set up.
 * It also creates a test user if none exists.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Create indexes for important collections
async function createIndexes() {
    console.log('Setting up MongoDB indexes...');
    
    try {
        // User collection indexes
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ username: 1 }, { unique: true });
        
        console.log('✅ MongoDB indexes created successfully');
    } catch (error) {
        // If indexes already exist, this is fine
        if (error.code === 85) { // Index already exists error
            console.log('Indexes already exist, skipping creation');
        } else {
            console.error('❌ Error creating MongoDB indexes:', error);
        }
    }
}

// Create a test user if no users exist
async function createTestUserIfNeeded() {
    try {
        const usersCount = await User.countDocuments();
        
        if (usersCount === 0) {
            console.log('No users found, creating test user...');
            
            const hashedPassword = await bcrypt.hash('Password123', 10);
            
            const testUser = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User'
            });
            
            await testUser.save();
            console.log('✅ Test user created successfully');
        } else {
            console.log(`Found ${usersCount} existing users, skipping test user creation`);
        }
    } catch (error) {
        console.error('❌ Error checking/creating test user:', error);
    }
}

// Main setup function
async function setupMongoDB() {
    console.log('Starting MongoDB setup...');
    
    try {
        // Create indexes
        await createIndexes();
        
        // Create test user if needed
        if (process.env.NODE_ENV !== 'production') {
            await createTestUserIfNeeded();
        }
        
        console.log('✅ MongoDB setup completed successfully');
    } catch (error) {
        console.error('❌ MongoDB setup error:', error);
    }
}

module.exports = setupMongoDB; 