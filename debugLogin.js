// Debug script for login page
console.log('==== LOGIN DEBUGGING TOOL ====');

// Add debug event listeners to login form
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.login-btn');
    
    // Add debug button
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.bottom = '20px';
    debugDiv.style.right = '20px';
    debugDiv.style.zIndex = '9999';
    debugDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
    debugDiv.style.padding = '10px';
    debugDiv.style.borderRadius = '5px';
    debugDiv.style.color = 'white';
    debugDiv.style.fontFamily = 'monospace';
    
    const testLoginBtn = document.createElement('button');
    testLoginBtn.innerText = 'Test API Connection';
    testLoginBtn.style.padding = '5px 10px';
    testLoginBtn.style.backgroundColor = '#007bff';
    testLoginBtn.style.color = 'white';
    testLoginBtn.style.border = 'none';
    testLoginBtn.style.borderRadius = '3px';
    testLoginBtn.style.cursor = 'pointer';
    
    testLoginBtn.addEventListener('click', async () => {
        try {
            // Test server health
            console.log('Testing server health endpoint...');
            const healthResponse = await fetch('http://localhost:5000/health');
            
            if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                console.log('Health check response:', healthData);
                alert(`Server is ${healthData.status}, MongoDB is ${healthData.mongodb}`);
            } else {
                console.error('Server health check failed:', healthResponse.status);
                alert(`Server health check failed: ${healthResponse.status}`);
            }
        } catch (error) {
            console.error('Error testing API connection:', error);
            alert(`Error testing API connection: ${error.message}. Check console for details.`);
        }
    });
    
    // Add direct login test button
    const directLoginBtn = document.createElement('button');
    directLoginBtn.innerText = 'Test Direct Login';
    directLoginBtn.style.padding = '5px 10px';
    directLoginBtn.style.backgroundColor = '#28a745';
    directLoginBtn.style.color = 'white';
    directLoginBtn.style.border = 'none';
    directLoginBtn.style.borderRadius = '3px';
    directLoginBtn.style.marginLeft = '10px';
    directLoginBtn.style.cursor = 'pointer';
    
    directLoginBtn.addEventListener('click', async () => {
        try {
            // Default test credentials - you might want to prompt for these instead
            const testEmail = document.getElementById('email').value || 'test@example.com';
            const testPassword = document.getElementById('password').value || 'password123';
            
            console.log('Testing direct login with:', testEmail);
            
            const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: testEmail,
                    password: testPassword
                })
            });
            
            console.log('Login response status:', loginResponse.status);
            
            const loginData = await loginResponse.json();
            console.log('Login response:', loginData);
            
            if (loginResponse.ok) {
                alert(`Login successful! Token received (${loginData.token.length} chars)`);
                
                // Store token and user data
                localStorage.setItem('token', loginData.token);
                localStorage.setItem('userData', JSON.stringify(loginData.user));
                
                // Test the token verification
                const verifyResponse = await fetch('http://localhost:5000/api/auth/verify-token', {
                    headers: {
                        'Authorization': `Bearer ${loginData.token}`
                    }
                });
                
                const verifyData = await verifyResponse.json();
                console.log('Token verification response:', verifyData);
                
                if (verifyResponse.ok && verifyData.authenticated) {
                    if (confirm('Login and token verification successful! Redirect to home page?')) {
                        window.location.replace('home.html');
                    }
                } else {
                    alert('Warning: Login succeeded but token verification failed!');
                }
            } else {
                alert(`Login failed: ${loginData.error}`);
            }
        } catch (error) {
            console.error('Error testing direct login:', error);
            alert(`Error testing direct login: ${error.message}. Check console for details.`);
        }
    });
    
    const clearStorageBtn = document.createElement('button');
    clearStorageBtn.innerText = 'Clear Storage';
    clearStorageBtn.style.padding = '5px 10px';
    clearStorageBtn.style.backgroundColor = '#dc3545';
    clearStorageBtn.style.color = 'white';
    clearStorageBtn.style.border = 'none';
    clearStorageBtn.style.borderRadius = '3px';
    clearStorageBtn.style.marginLeft = '10px';
    clearStorageBtn.style.cursor = 'pointer';
    
    clearStorageBtn.addEventListener('click', () => {
        localStorage.clear();
        console.log('Local storage cleared');
        alert('Local storage cleared');
    });
    
    debugDiv.appendChild(testLoginBtn);
    debugDiv.appendChild(directLoginBtn);
    debugDiv.appendChild(clearStorageBtn);
    document.body.appendChild(debugDiv);
    
    // Monitor form submission
    if (loginForm) {
        // Patch the fetch function for debugging
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            console.log('Fetch request arguments:', args);
            
            try {
                const response = await originalFetch(...args);
                
                // Clone the response so we can log it and still return it to the original caller
                const responseClone = response.clone();
                console.log('Fetch response status:', response.status);
                
                try {
                    const responseBody = await responseClone.json();
                    console.log('Fetch response body:', responseBody);
                } catch (e) {
                    console.log('Fetch response is not JSON');
                }
                
                return response;
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        };
        
        // REMOVED: Do not replace the login form, just add a submit listener
        // const debugLoginForm = loginForm.cloneNode(true);
        // loginForm.parentNode.replaceChild(debugLoginForm, loginForm);
        
        // Add a submit listener instead of replacing the form
        loginForm.addEventListener('submit', function(event) {
            // Do not preventDefault() here - just log the attempt
            console.log('Login form submitted');
            console.log('Email:', emailInput.value);
            console.log('Password:', passwordInput.value);
            // Allow the original event handler to continue
        });
    } else {
        console.error('Login form not found!');
    }
});

console.log('==== LOGIN DEBUG SCRIPT LOADED ===='); 