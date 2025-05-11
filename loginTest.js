// Login test script - can be run in browser console

// Test credentials
const testCredentials = {
    email: 'test@example.com',
    password: 'test123'
};

// Test login function
async function testLogin() {
    console.log('Testing login with:', testCredentials.email);
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testCredentials)
        });
        
        console.log('Login response status:', response.status);
        
        const data = await response.json();
        console.log('Login response data:', data);
        
        if (response.ok) {
            console.log('Login successful!');
            console.log('Token:', data.token);
            
            localStorage.setItem('token', data.token);
            
            const userData = {
                id: data.user?.id || data.user?._id || 'unknown',
                username: data.user?.username || 'User',
                email: data.user?.email || testCredentials.email,
                firstName: data.user?.firstName || '',
                lastName: data.user?.lastName || ''
            };
            
            localStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('username', userData.username);
            
            console.log('User data stored in localStorage:', userData);
            return true;
        } else {
            console.error('Login failed:', data.error);
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

// Create test user
async function createTestUser() {
    console.log('Creating test user...');
    
    const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User'
    };
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });
        
        console.log('Create user response status:', response.status);
        
        const data = await response.json();
        console.log('Create user response data:', data);
        
        if (response.ok) {
            console.log('Test user created successfully!');
            return true;
        } else {
            console.log('Failed to create test user:', data.error);
            return false;
        }
    } catch (error) {
        console.error('Create user error:', error);
        return false;
    }
}

// Verify token
async function verifyToken() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error('No token found in localStorage');
        return false;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/verify-token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Verify token response status:', response.status);
        
        const data = await response.json();
        console.log('Verify token response data:', data);
        
        if (response.ok && data.authenticated) {
            console.log('Token verified successfully!');
            return true;
        } else {
            console.error('Token verification failed!');
            return false;
        }
    } catch (error) {
        console.error('Verify token error:', error);
        return false;
    }
}

// Clear login data
function clearLoginData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('username');
    console.log('Local storage cleared');
}

// Run all tests
async function runAllTests() {
    console.log('=== STARTING LOGIN TESTS ===');
    
    // Clear existing data
    clearLoginData();
    
    // Create test user (may fail if user already exists)
    await createTestUser();
    
    // Test login
    const loginSuccess = await testLogin();
    
    // Verify token if login succeeded
    let verifySuccess = false;
    if (loginSuccess) {
        verifySuccess = await verifyToken();
    }
    
    console.log('=== TEST RESULTS ===');
    console.log('Login successful:', loginSuccess);
    console.log('Token verification:', verifySuccess ? 'Passed' : 'Failed or not attempted');
    
    if (loginSuccess && verifySuccess) {
        console.log('All tests passed! You can now navigate to home.html');
    } else {
        console.log('Tests failed. Check console for errors.');
    }
}

// Export functions to make them available in the console
window.loginTest = {
    testLogin,
    createTestUser,
    verifyToken,
    clearLoginData,
    runAllTests
};

console.log('Login test script loaded. Run loginTest.runAllTests() to start tests.'); 