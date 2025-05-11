const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const setupMongoDB = require('./setup/setupMongoDB');

const app = express();

// Middleware
app.use(cors({
    // Configure CORS for production
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL || 'https://eduplans.onrender.com'] 
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Test route
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'Server is running',
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// MongoDB Connection with error handling
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected successfully');
        
        // Run setup script
        await setupMongoDB();
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1); // Exit if cannot connect to database
    });

// Monitor MongoDB connection
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `The requested endpoint ${req.method} ${req.url} does not exist`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Application error:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: 'An unexpected error occurred on the server',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
    console.log('Received shutdown signal, closing connections...');
    mongoose.connection.close()
        .then(() => {
            console.log('MongoDB connection closed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Error closing MongoDB connection:', err);
            process.exit(1);
        });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});