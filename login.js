document.addEventListener('DOMContentLoaded', () => {
    console.log('Login script loaded. Version 1.0.3');
    
    // Create particles
    createParticles();

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
                    lastName: data.user?.lastName || ''
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
        
        setTimeout(() => errorDiv.remove(), 3000);
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
});