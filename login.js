document.addEventListener('DOMContentLoaded', () => {
    console.log('Login script loaded. Version 1.0.9');
    
    // Add debug function to window for testing
    window.testSuccessMessage = function() {
        console.log('Manual test: Showing success message');
        localStorage.setItem('googleSignupSuccess', 'true');
        localStorage.setItem('googleSignupEmail', 'test@example.com');
        checkGoogleSignupRedirect();
    };
    
    // Configure Google Sign-In button
    initGoogleSignIn();
    
    // Create particles
    createParticles();
    
    // Use a slight delay to ensure DOM is fully ready before checking for redirect
    setTimeout(() => {
        console.log('Checking for Google signup redirect after DOM is ready');
        checkGoogleSignupRedirect();
    }, 300);

    // Get form elements
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error('Login form not found!');
        return; // Exit if form not found
    }
    
    const loginBtn = document.getElementById('loginSubmitBtn');
    if (!loginBtn) {
        console.error('Login button not found!');
    }
    
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
                showError('Could not initialize Google Sign-In. Please try again or use email login.');
            }
        });
    }
    
    console.log('Login form found, adding event listeners');
    
    // Add animation to input focus
    document.querySelectorAll('.input-group input').forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.querySelector('i').style.transform = 'translateY(-50%) scale(1.1)';
        });

        input.addEventListener('blur', () => {
            input.parentElement.querySelector('i').style.transform = 'translateY(-50%) scale(1)';
        });
    });

    // Add direct click event on the login button
    loginBtn.addEventListener('click', function(event) {
        // Prevent multiple submissions
        if (loginBtn.disabled) {
            console.log('Login button is already disabled, preventing double-click');
            event.preventDefault();
            return;
        }
        
        console.log('Login button clicked, form will submit');
    });
    
    // Add the main submit event listener
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission
        console.log('Form submit handler triggered');
        handleLogin();
    });
    
    // Function to handle the login process
    async function handleLogin() {
        // Show loading state
        loginBtn.disabled = true;
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        
        // Get form values
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        console.log(`Attempting login for: ${email}`);
        
        try {
            // Get the API URL from config
            const apiUrl = window.apiConfig ? 
                window.apiConfig.getUrl(window.apiConfig.endpoints.auth.login) : 
                'http://localhost:5000/api/auth/login';
            
            console.log('Using API URL:', apiUrl);
            
            // Make the API call
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Login response status:', response.status);
            
            // Parse the response data
            let data;
            try {
                data = await response.json();
                console.log('Login response data received');
            } catch (jsonError) {
                console.error('Error parsing JSON response:', jsonError);
                throw new Error('Invalid server response');
            }

            if (response.ok) {
                // Add success animation
                loginBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
                loginBtn.style.background = 'linear-gradient(145deg, #28a745, #20c997)';
                
                // Ensure we have a valid token
                if (!data.token) {
                    throw new Error('No authentication token received');
                }
                
                // Store token in localStorage
                localStorage.setItem('token', data.token);
                console.log('Token stored in localStorage:', data.token.substring(0, 20) + '...');
                
                // Store user data as a JSON object with proper error handling
                const userData = {
                    id: data.user?.id || data.user?._id || 'unknown',
                    username: data.user?.username || 'User',
                    email: data.user?.email || email,
                    firstName: data.user?.firstName || '',
                    lastName: data.user?.lastName || '',
                    profilePicture: data.user?.profilePicture || ''
                };
                
                localStorage.setItem('userData', JSON.stringify(userData));
                // Also store username separately for backward compatibility
                localStorage.setItem('username', userData.username);
                console.log('User data stored in localStorage');

                // Fade out effect before redirect
                setTimeout(() => {
                    document.body.style.opacity = '0';
                    setTimeout(() => {
                        console.log('Redirecting to home page...');
                        // Use window.location directly for simplicity
                        window.location.href = 'home.html';
                    }, 500);
                }, 1000);
            } else {
                // Handle specific error cases
                const errorMessage = data.error || 'Login failed. Please check your credentials.';
                console.error('Login error:', errorMessage);
                showError(errorMessage);
                
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        } catch (error) {
            console.error('Login exception:', error);
            showError('Server error. Please check if the backend is running.');
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    function showError(message) {
        console.error('Login error:', message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        loginForm.insertBefore(errorDiv, loginForm.firstChild);
        
        // Add shake animation to the login card
        document.querySelector('.login-card').classList.add('shake');
        setTimeout(() => {
            document.querySelector('.login-card').classList.remove('shake');
        }, 500);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    }

    function createParticles() {
        const container = document.querySelector('.particle-system');
        if (!container) return;
        
        const particleCount = 50; // Increased count for better effect

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Smaller particles for better aesthetic
            const size = Math.random() * 3 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Full viewport coverage
            particle.style.left = `${Math.random() * 100}vw`;
            particle.style.top = `${Math.random() * 100}vh`;
            
            // Enhanced movement
            const tx = (Math.random() - 0.5) * 300;
            const ty = (Math.random() - 0.5) * 300;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            // Longer duration for smoother effect
            const duration = Math.random() * 4 + 3;
            const delay = Math.random() * 2;
            particle.style.animation = `particle ${duration}s ${delay}s infinite`;
            
            container.appendChild(particle);
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

    // Function to check if user was redirected after successful Google signup
    function checkGoogleSignupRedirect() {
        const urlParams = new URLSearchParams(window.location.search);
        const googleSignupSuccess = localStorage.getItem('googleSignupSuccess');
        const googleSignupEmail = localStorage.getItem('googleSignupEmail');
        
        console.log('Checking Google signup redirect:');
        console.log('URL source param:', urlParams.get('source'));
        console.log('localStorage googleSignupSuccess:', googleSignupSuccess);
        console.log('localStorage googleSignupEmail:', googleSignupEmail);
        
        if ((urlParams.get('source') === 'google_signup' || googleSignupSuccess === 'true') && googleSignupEmail) {
            console.log('Google signup redirect detected');
            
            // Force a slight delay to ensure DOM is ready
            setTimeout(() => {
                // Show a success message with instructions
                const successMessage = `Account created successfully with ${googleSignupEmail}. Please sign in with Google.`;
                
                console.log('Showing success message:', successMessage);
                showSuccess(successMessage);
                
                // Highlight the Google Sign-In button to draw attention to it
                const googleBtn = document.getElementById('customGoogleBtn');
                if (googleBtn) {
                    googleBtn.style.boxShadow = '0 0 15px rgba(66, 133, 244, 0.6)';
                    googleBtn.style.animation = 'pulse 2s infinite';
                    
                    // Add a pulse animation style if it doesn't exist
                    if (!document.getElementById('google-btn-pulse')) {
                        const style = document.createElement('style');
                        style.id = 'google-btn-pulse';
                        style.textContent = `
                            @keyframes pulse {
                                0% { transform: scale(1); box-shadow: 0 0 15px rgba(66, 133, 244, 0.6); }
                                50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(66, 133, 244, 0.8); }
                                100% { transform: scale(1); box-shadow: 0 0 15px rgba(66, 133, 244, 0.6); }
                            }
                        `;
                        document.head.appendChild(style);
                    }
                }
                
                // Keep the flags for debugging purposes for now
                // We'll remove them later after confirming everything works
                // localStorage.removeItem('googleSignupSuccess');
                // localStorage.removeItem('googleSignupEmail');
            }, 100);
        } else {
            console.log('No Google signup redirect detected');
        }
    }
    
    function showSuccess(message) {
        console.log('In showSuccess function with message:', message);
        
        // Get the login form
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) {
            console.error('Login form not found in showSuccess');
            return;
        }
        
        // Remove any existing messages first
        const existingMessage = document.querySelector('.success-message, .error-message');
        if (existingMessage) {
            console.log('Removing existing message');
            existingMessage.remove();
        }
        
        // Create a visible container for the message to ensure proper positioning
        const messageContainer = document.createElement('div');
        messageContainer.style.position = 'relative';
        messageContainer.style.width = '100%';
        messageContainer.style.marginBottom = '20px';
        messageContainer.style.zIndex = '100';
        
        // Create the success message element with enhanced visibility
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        successDiv.style.opacity = '1';
        successDiv.style.visibility = 'visible';
        
        // Add the message to the container
        messageContainer.appendChild(successDiv);
        
        // Insert at the beginning of the form
        loginForm.insertBefore(messageContainer, loginForm.firstChild);
        console.log('Success message added to DOM in container');
        
        // Make sure message doesn't disappear automatically
        // (We'll let it stay visible unless explicitly removed)
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
            
            // If this is a new user that needs to complete registration
            if (data.status === 'incomplete_registration') {
                console.log('New user needs to complete registration');
                
                // Store temporary user data for the signup page
                localStorage.setItem('googleAuthData', JSON.stringify(userData));
                
                // Show success message but redirect to signup page
                if (googleBtn) {
                    googleBtn.style.background = 'linear-gradient(145deg, #ffc107, #ff9800)';
                    googleBtn.style.opacity = '1';
                    const btnText = googleBtn.querySelector('span');
                    if (btnText) {
                        btnText.textContent = 'Redirecting to complete signup...';
                        btnText.style.color = 'white';
                    }
                }
                
                // Redirect to signup page to complete registration
                setTimeout(() => {
                    document.body.style.opacity = '0';
                    setTimeout(() => {
                        window.location.href = 'signup.html?google=pending';
                    }, 500);
                }, 1000);
                
                return;
            }
            
            // Normal successful authentication - store token and user data
            localStorage.setItem('token', data.token);
            
            const userDataToStore = {
                id: data.user?.id || 'unknown',
                username: data.user?.username || 'User',
                email: data.user?.email || userData.email,
                firstName: data.user?.firstName || userData.firstName,
                lastName: data.user?.lastName || userData.lastName,
                profilePicture: data.user?.profilePicture || userData.profilePicture
            };
            
            localStorage.setItem('userData', JSON.stringify(userDataToStore));
            localStorage.setItem('username', userDataToStore.username);
            
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
            
            // Redirect to home page
            setTimeout(() => {
                document.body.style.opacity = '0';
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 500);
            }, 1000);
        } else {
            throw new Error(data.error || 'Failed to authenticate with Google');
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
                btnText.textContent = 'Sign in with Google';
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

// Global error display function for Google Sign-In
function showError(message) {
    console.error('Auth error:', message);
    
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    loginForm.insertBefore(errorDiv, loginForm.firstChild);
    
    // Add shake animation to the login card
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.classList.add('shake');
        setTimeout(() => {
            loginCard.classList.remove('shake');
        }, 500);
    }
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 3000);
}