document.addEventListener('DOMContentLoaded', () => {
    // Check if user has arrived from Google Auth flow
    checkGoogleAuthPending();
    
    // Configure Google Sign-In button
    initGoogleSignIn();
    
    // Create advanced particle effect
    createParticles();
    
    // Set up custom Google button click handler
    const customGoogleBtn = document.getElementById('customGoogleBtn');
    if (customGoogleBtn) {
        customGoogleBtn.addEventListener('click', function() {
            // Trigger the hidden Google Sign-In button
            const googleSignInButton = document.querySelector('.g_id_signin div[role="button"]');
            if (googleSignInButton) {
                googleSignInButton.click();
            } else {
                console.error('Google Sign-In button not found');
                showError('Could not initialize Google Sign-In. Please try again or use email signup.');
            }
        });
    }
    
    const signupForm = document.getElementById('signupForm');
    const signupBtn = signupForm.querySelector('.signup-btn');
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        signupBtn.disabled = true;
        signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            mobile: document.getElementById('mobile').value,
            password: document.getElementById('password').value
        };
        
        // If we have Google Auth data, include it
        const googleAuthData = localStorage.getItem('googleAuthData');
        if (googleAuthData) {
            try {
                const parsedData = JSON.parse(googleAuthData);
                formData.googleId = parsedData.googleId;
                formData.profilePicture = parsedData.profilePicture;
            } catch (err) {
                console.error('Error parsing Google Auth data:', err);
            }
        }
        
        try {
            // Get the API URL from config
            const apiUrl = window.apiConfig ? 
                window.apiConfig.getUrl(window.apiConfig.endpoints.auth.signup) : 
                'http://localhost:5000/api/auth/signup';
            
            console.log('Using API URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Clear any stored Google Auth data as it's no longer needed
                localStorage.removeItem('googleAuthData');
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.user.username);
                // Also store full user data
                localStorage.setItem('userData', JSON.stringify(data.user));
                showSuccess('Account created successfully!');
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
            } else {
                showError(data.error || 'Registration failed');
                // Reset button state
                signupBtn.disabled = false;
                signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            }
        } catch (error) {
            showError('Server error. Please try again.');
            // Reset button state
            signupBtn.disabled = false;
            signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    });

    // Function to check if we have pending Google Auth data to pre-fill form
    function checkGoogleAuthPending() {
        // Check URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('google') === 'pending') {
            // Get the stored Google Auth data
            const googleAuthData = localStorage.getItem('googleAuthData');
            if (googleAuthData) {
                try {
                    const parsedData = JSON.parse(googleAuthData);
                    
                    // Pre-fill the form with Google data
                    if (parsedData.firstName) document.getElementById('firstName').value = parsedData.firstName;
                    if (parsedData.lastName) document.getElementById('lastName').value = parsedData.lastName;
                    if (parsedData.email) document.getElementById('email').value = parsedData.email;
                    
                    // Generate a username suggestion
                    const usernameField = document.getElementById('username');
                    if (parsedData.email && !usernameField.value) {
                        const suggestedUsername = parsedData.email.split('@')[0];
                        usernameField.value = suggestedUsername;
                    }
                    
                    showInfo('Please complete your registration to continue. We\'ve pre-filled some information from your Google account.');
                } catch (err) {
                    console.error('Error parsing Google Auth data:', err);
                }
            }
        }
    }

    // Initialize Google Sign-In
    function initGoogleSignIn() {
        try {
            // Set the correct client ID from config if not already set in HTML
            if (window.apiConfig && window.apiConfig.googleAuth && window.apiConfig.googleAuth.clientId) {
                const clientIdElement = document.getElementById('g_id_onload');
                if (clientIdElement) {
                    // Only set if it's still the placeholder
                    const currentClientId = clientIdElement.getAttribute('data-client_id');
                    const configClientId = window.apiConfig.googleAuth.clientId;
                    
                    if (currentClientId === 'YOUR_GOOGLE_CLIENT_ID' || !currentClientId) {
                        clientIdElement.setAttribute('data-client_id', configClientId);
                        console.log('Google Sign-In configured with client ID from config');
                    }
                }
            }
        } catch (error) {
            console.error('Error initializing Google Sign-In:', error);
        }
    }

    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const existingMessage = document.querySelector('.success-message, .error-message, .info-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        signupForm.insertBefore(successDiv, signupForm.firstChild);
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const existingMessage = document.querySelector('.success-message, .error-message, .info-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        signupForm.insertBefore(errorDiv, signupForm.firstChild);
    }
    
    function showInfo(message) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'info-message';
        infoDiv.textContent = message;
        
        const existingMessage = document.querySelector('.success-message, .error-message, .info-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        signupForm.insertBefore(infoDiv, signupForm.firstChild);
    }
});

// Google Sign-In callback function (must be global)
function handleGoogleSignIn(response) {
    console.log('Google Sign-In response received');
    
    try {
        // Decode the JWT token
        const payload = parseJwt(response.credential);
        console.log('Google user info:', payload.name);
        
        // Extract user data from Google response
        const userData = {
            googleId: payload.sub,
            email: payload.email,
            firstName: payload.given_name || payload.name.split(' ')[0],
            lastName: payload.family_name || payload.name.split(' ').slice(1).join(' '),
            profilePicture: payload.picture
        };
        
        // Process Google Sign-In
        processGoogleSignIn(userData);
    } catch (error) {
        console.error('Error processing Google Sign-In:', error);
        showError('Failed to process Google Sign-In. Please try again.');
    }
}

async function processGoogleSignIn(userData) {
    try {
        // Get the API URL from config
        const apiUrl = window.apiConfig ? 
            window.apiConfig.getUrl(window.apiConfig.endpoints.auth.googleAuth) : 
            'http://localhost:5000/api/auth/google';
        
        console.log('Using Google Auth API URL:', apiUrl);
        
        // Show loading state on custom Google button
        const googleBtn = document.getElementById('customGoogleBtn');
        if (googleBtn) {
            googleBtn.disabled = true;
            const btnText = googleBtn.querySelector('span');
            if (btnText) {
                btnText.textContent = 'Authenticating...';
            }
            googleBtn.style.opacity = '0.7';
        }
        
        // Make the API call to the backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        // Parse the response data
        const data = await response.json();
        
        if (response.ok) {
            console.log('Google authentication successful');
            
            if (data.status === 'incomplete_registration') {
                // Store Google data for form pre-fill
                localStorage.setItem('googleAuthData', JSON.stringify(userData));
                
                // Pre-fill the form with Google data
                if (userData.firstName) document.getElementById('firstName').value = userData.firstName;
                if (userData.lastName) document.getElementById('lastName').value = userData.lastName;
                if (userData.email) document.getElementById('email').value = userData.email;
                
                // Generate a username suggestion
                const usernameField = document.getElementById('username');
                if (userData.email && (!usernameField.value || usernameField.value.trim() === '')) {
                    const suggestedUsername = userData.email.split('@')[0];
                    usernameField.value = suggestedUsername;
                }
                
                // Show info message
                showInfo('Please complete your registration to continue.');
                
                // Reset Google button
                if (googleBtn) {
                    googleBtn.disabled = false;
                    googleBtn.style.opacity = '1';
                    googleBtn.style.background = 'white';
                    const btnText = googleBtn.querySelector('span');
                    if (btnText) {
                        btnText.textContent = 'Sign up with Google';
                        btnText.style.color = '#3c4043';
                    }
                }
            } else {
                // CHANGED: Instead of storing credentials and redirecting to home, 
                // we now show a success message and redirect to login page
                
                // Update Google button to show success
                if (googleBtn) {
                    googleBtn.style.background = 'linear-gradient(145deg, #28a745, #20c997)';
                    googleBtn.style.opacity = '1';
                    const btnText = googleBtn.querySelector('span');
                    if (btnText) {
                        btnText.textContent = 'Success!';
                        btnText.style.color = 'white';
                    }
                }
                
                // Show success message
                showSuccess('Account created successfully! Please log in using Google.');
                
                // Store a flag in localStorage to indicate Google sign-up success
                console.log('Setting Google signup success flags in localStorage');
                localStorage.setItem('googleSignupSuccess', 'true');
                localStorage.setItem('googleSignupEmail', userData.email);
                console.log('Flags set:', localStorage.getItem('googleSignupSuccess'), localStorage.getItem('googleSignupEmail'));
                
                // Redirect to login page after a short delay
                setTimeout(() => {
                    console.log('Starting redirect to login page');
                    document.body.style.opacity = '0';
                    setTimeout(() => {
                        console.log('Navigating to login page with source parameter');
                        window.location.href = 'login.html?source=google_signup';
                    }, 500);
                }, 2000);
            }
        } else {
            throw new Error(data.error || 'Failed to create account with Google');
        }
    } catch (error) {
        console.error('Google authentication error:', error);
        showError(error.message || 'Failed to authenticate with Google');
        
        // Reset button state
        const googleBtn = document.getElementById('customGoogleBtn');
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.style.opacity = '1';
            googleBtn.style.background = 'white';
            const btnText = googleBtn.querySelector('span');
            if (btnText) {
                btnText.textContent = 'Sign up with Google';
                btnText.style.color = '#3c4043';
            }
        }
    }
}

// Helper function to parse JWT
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        throw new Error('Invalid token format');
    }
}

function createParticles() {
    const container = document.querySelector('.particle-container');
    if (!container) return;
    
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size between 2-6px
        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Set up for animation
        const tx = (Math.random() - 0.5) * 300;
        const ty = (Math.random() - 0.5) * 300;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        // Random animation duration and delay
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        
        container.appendChild(particle);
    }
}