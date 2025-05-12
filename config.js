/**
 * EduPlans API Configuration
 * 
 * This file contains the configuration for the API endpoints.
 * It automatically detects the environment and sets the appropriate API URL.
 */

const config = {
    // API base URL
    apiUrl: getApiUrl(),
    
    // API endpoints
    endpoints: {
        auth: {
            login: '/api/auth/login',
            signup: '/api/auth/signup',
            googleAuth: '/api/auth/google',
            forgotPassword: '/api/auth/forgot-password',
            resetPassword: '/api/auth/reset-password',
            verifyToken: '/api/auth/verify-token'
        },
        profile: {
            me: '/api/me'
        }
    },
    
    // Google Authentication
    googleAuth: {
        clientId: '883150394413-83e6lkhanhs72j87cps4p6f5tlvk7a63.apps.googleusercontent.com',
    }
};

/**
 * Determine the API URL based on the environment
 * @returns {string} The base API URL
 */
function getApiUrl() {
    // Check if we're in a production environment
    if (window.location.hostname !== 'localhost' && 
        !window.location.hostname.startsWith('127.0.0.1') &&
        !window.location.hostname.startsWith('192.168.')) {
        
        // For Render deployment, get the URL from the rendered site domain
        // This assumes the backend is deployed at <n>-api.onrender.com
        // and the frontend is at <n>.onrender.com
        const frontendDomain = window.location.hostname;
        if (frontendDomain.includes('.onrender.com')) {
            const projectName = frontendDomain.split('.')[0];
            return `https://${projectName}-api.onrender.com`;
        }
        
        // Fallback if we can't detect automatically
        return 'https://eduplans-api.onrender.com';
    }
    
    // Development environment
    return 'http://localhost:5000';
}

/**
 * Get a full API URL for a specified endpoint
 * @param {string} endpoint - The endpoint path
 * @returns {string} The full API URL
 */
config.getUrl = function(endpoint) {
    return this.apiUrl + endpoint;
};

// Export the configuration
window.apiConfig = config; 