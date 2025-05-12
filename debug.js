// Debug Script for Login/Signup Pages
console.log('Debug script loaded');

// Function to check if elements exist without adding event listeners
function checkElements() {
    console.log('Checking page elements...');
    
    // Check login page elements
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('✅ Login form found');
        
        // Check inputs
        const emailInput = document.getElementById('email');
        if (emailInput) {
            console.log('✅ Email input found');
        } else {
            console.error('❌ Email input not found');
        }
        
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            console.log('✅ Password input found');
        } else {
            console.error('❌ Password input not found');
        }
        
        // Check login button
        const loginBtn = document.getElementById('loginSubmitBtn');
        if (loginBtn) {
            console.log('✅ Login button found');
        } else {
            console.error('❌ Login button not found');
        }
        
        // Check Google button
        const googleBtn = document.getElementById('customGoogleBtn');
        if (googleBtn) {
            console.log('✅ Google button found');
        } else {
            console.error('❌ Google button not found');
        }
        
        // Check footer links
        const forgotLink = document.querySelector('.forgot-link');
        if (forgotLink) {
            console.log('✅ Forgot Password link found');
        } else {
            console.error('❌ Forgot Password link not found');
        }
        
        const signupLink = document.querySelector('.signup-link');
        if (signupLink) {
            console.log('✅ Create Account link found');
        } else {
            console.error('❌ Create Account link not found');
        }
        
        // Check if Google Sign-In is initialized
        const googleSignIn = document.querySelector('.g_id_signin');
        if (googleSignIn) {
            console.log('✅ Google Sign-In element found');
        } else {
            console.error('❌ Google Sign-In element not found');
        }
        
        console.log('Login page check complete');
        return;
    }
    
    // Check signup page elements
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        console.log('✅ Signup form found');
        
        // Check inputs
        const firstNameInput = document.getElementById('firstName');
        if (firstNameInput) {
            console.log('✅ First name input found');
        } else {
            console.error('❌ First name input not found');
        }
        
        // Check signup button
        const signupBtn = document.querySelector('.signup-btn');
        if (signupBtn) {
            console.log('✅ Signup button found');
        } else {
            console.error('❌ Signup button not found');
        }
        
        // Check Google button
        const googleBtn = document.getElementById('customGoogleBtn');
        if (googleBtn) {
            console.log('✅ Google button found');
        } else {
            console.error('❌ Google button not found');
        }
        
        console.log('Signup page check complete');
        return;
    }
    
    console.error('❌ Neither login nor signup form found');
}

// Function to check if the Google Sign-In API is loaded
function checkGoogleAPI() {
    if (typeof google !== 'undefined' && google.accounts) {
        console.log('✅ Google API loaded');
    } else {
        console.error('❌ Google API not loaded');
    }
}

// Function to check JavaScript console errors
function checkConsoleErrors() {
    const originalConsoleError = console.error;
    console.error = function() {
        originalConsoleError.apply(console, arguments);
        // Display errors in console only, don't modify the page
    };
}

// Run all checks when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkElements();
    
    // Check Google API after a delay to ensure it's loaded
    setTimeout(checkGoogleAPI, 2000);
    
    // Monitor console errors
    checkConsoleErrors();
    
    console.log('Debug checks complete');
});

// Make debug functions available globally
window.debugTools = {
    checkElements,
    checkGoogleAPI
};

console.log('Debug tools available: window.debugTools'); 