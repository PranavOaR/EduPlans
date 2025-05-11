// Debug script for profile issues
console.log('==== PROFILE DEBUGGING TOOL ====');

// Check if token exists
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
if (token) {
    console.log('Token length:', token.length);
    
    // Parse token (JWT)
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('Invalid token format - not a JWT');
        } else {
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            
            console.log('Token header:', header);
            console.log('Token payload:', payload);
            console.log('User ID from token:', payload.userId);
        }
    } catch (e) {
        console.error('Failed to parse token:', e);
    }
}

// Check userData in localStorage
const userData = localStorage.getItem('userData');
console.log('User data exists:', !!userData);
if (userData) {
    try {
        const parsedUserData = JSON.parse(userData);
        console.log('User data:', parsedUserData);
    } catch (e) {
        console.error('Failed to parse user data:', e);
    }
}

// Check profile data in localStorage
const profileData = localStorage.getItem('profileData');
console.log('Profile data exists:', !!profileData);
if (profileData) {
    try {
        const parsedProfileData = JSON.parse(profileData);
        console.log('Profile data:', parsedProfileData);
    } catch (e) {
        console.error('Failed to parse profile data:', e);
    }
}

// Test API endpoints
async function testEndpoints() {
    const API_BASE_URL = 'http://localhost:5000/api';
    
    if (!token) {
        console.error('Cannot test API endpoints: No token found');
        return;
    }
    
    try {
        // Test auth status
        console.log('Testing auth-debug endpoint...');
        const authResponse = await fetch(`${API_BASE_URL}/auth-debug`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Auth debug status:', authResponse.status);
        if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log('Auth debug response:', authData);
        } else {
            const authError = await authResponse.text();
            console.error('Auth debug error:', authError);
        }
        
        // Test profile endpoint
        console.log('Testing /me profile endpoint...');
        const profileResponse = await fetch(`${API_BASE_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Profile endpoint status:', profileResponse.status);
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('Profile response:', profileData);
        } else {
            const profileError = await profileResponse.text();
            console.error('Profile endpoint error:', profileError);
        }
        
    } catch (e) {
        console.error('API test error:', e);
    }
}

// Run API tests
testEndpoints();

// Add button to page to clear localStorage and log out
function addDebugControls() {
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
    
    const clearBtn = document.createElement('button');
    clearBtn.innerText = 'Clear Storage & Logout';
    clearBtn.style.padding = '5px 10px';
    clearBtn.style.backgroundColor = '#dc3545';
    clearBtn.style.color = 'white';
    clearBtn.style.border = 'none';
    clearBtn.style.borderRadius = '3px';
    clearBtn.style.cursor = 'pointer';
    
    clearBtn.addEventListener('click', () => {
        localStorage.clear();
        console.log('Local storage cleared');
        alert('Local storage cleared. Redirecting to login...');
        window.location.href = 'login.html';
    });
    
    const refreshBtn = document.createElement('button');
    refreshBtn.innerText = 'Refresh Profile Data';
    refreshBtn.style.padding = '5px 10px';
    refreshBtn.style.backgroundColor = '#007bff';
    refreshBtn.style.color = 'white';
    refreshBtn.style.border = 'none';
    refreshBtn.style.borderRadius = '3px';
    refreshBtn.style.marginLeft = '10px';
    refreshBtn.style.cursor = 'pointer';
    
    refreshBtn.addEventListener('click', () => {
        localStorage.removeItem('profileData');
        console.log('Profile data cleared');
        alert('Profile data cleared. Refreshing page...');
        window.location.reload();
    });
    
    debugDiv.appendChild(clearBtn);
    debugDiv.appendChild(refreshBtn);
    document.body.appendChild(debugDiv);
}

// Add debug controls after a short delay
setTimeout(addDebugControls, 1000);

console.log('==== DEBUG SCRIPT COMPLETE ===='); 