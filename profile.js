document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        // User is not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }

    // DOM elements
    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveToServerBtn = document.getElementById('saveToServerBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    const profileForm = document.getElementById('profileForm');
    const changeImageBtn = document.getElementById('changeImageBtn');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const profileImageUpload = document.getElementById('profileImageUpload');
    const profileImageContainer = document.querySelector('.profile-image-container');
    const logoutBtn = document.getElementById('logoutBtn');

    // Profile data elements
    const profileNameEl = document.getElementById('profileName');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileBioEl = document.getElementById('profileBio');
    const profileEducationEl = document.getElementById('profileEducation');
    const profileOccupationEl = document.getElementById('profileOccupation');
    const profileLocationEl = document.getElementById('profileLocation');
    const profileImageEl = document.getElementById('profileImage');

    // Edit form elements
    const editNameInput = document.getElementById('editName');
    const editEmailInput = document.getElementById('editEmail');
    const editBioInput = document.getElementById('editBio');
    const editEducationInput = document.getElementById('editEducation');
    const editOccupationInput = document.getElementById('editOccupation');
    const editLocationInput = document.getElementById('editLocation');

    // Stats elements
    const studyHoursEl = document.getElementById('studyHours');
    const pomodoroCompletedEl = document.getElementById('pomodoroCompleted');
    const tasksCompletedEl = document.getElementById('tasksCompleted');
    const codesCompiledEl = document.getElementById('codesCompiled');

    // Default placeholder image URL
    const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/150';

    // MongoDB API endpoint (replace with your actual MongoDB API endpoint)
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // Get user data from login session
    const loginUserData = getLoggedInUserData();
    console.log('Login User Data:', loginUserData); // Debug
    
    // Load user profile data
    loadUserProfile();
    loadUserStats();

    // Create particles for background effect
    createParticles();

    // Event listeners
    editProfileBtn.addEventListener('click', openEditModal);
    saveToServerBtn.addEventListener('click', saveProfileToServer);
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelBtn.addEventListener('click', closeEditModal);
    profileForm.addEventListener('submit', saveProfileChanges);
    changeImageBtn.addEventListener('click', () => profileImageUpload.click());
    removeImageBtn.addEventListener('click', removeProfileImage);
    profileImageContainer.addEventListener('click', () => profileImageUpload.click());
    profileImageUpload.addEventListener('change', handleImageUpload);
    logoutBtn.addEventListener('click', handleLogout);

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === editProfileModal) {
            closeEditModal();
        }
    });
    
    // Get user data from login session
    function getLoggedInUserData() {
        try {
            // Get token and user data
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('userData')) || {};
            
            // Extract data from token
            const tokenData = token ? getUserDataFromToken(token) : null;
            
            // Log what we've found for debugging
            console.log('Token Data:', tokenData);
            console.log('Local Storage User Data:', userData);
            
            // Combine data, prioritizing token data
            return {
                name: tokenData?.username || userData?.username || 'User',
                email: tokenData?.email || userData?.email || 'user@example.com',
                userId: tokenData?.userId || userData?.id || null
            };
        } catch (error) {
            console.error('Error getting logged in user data:', error);
            return { name: 'User', email: 'user@example.com' };
        }
    }
    
    // Helper function to extract user data from token
    function getUserDataFromToken(token) {
        try {
            // Simple JWT token parsing
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            console.log('Decoded Token Payload:', payload); // Debug
            
            return payload;
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }
    }

    // Function to load user profile
    function loadUserProfile() {
        // First try to get data from MongoDB
        fetchProfileFromServer()
            .then(profileData => {
                if (profileData) {
                    console.log('Profile loaded from server:', profileData); // Debug
                    
                    // Merge with login data for username and email
                    if (loginUserData) {
                        profileData.name = profileData.name || loginUserData.name;
                        profileData.email = profileData.email || loginUserData.email;
                    }
                    
                    updateProfileUI(profileData);
                    // Also update localStorage
                    localStorage.setItem('profileData', JSON.stringify(profileData));
                    showNotification('Profile loaded from server', 'info');
                } else {
                    // If not available, use localStorage as fallback
                    loadFromLocalStorage();
                }
            })
            .catch(error => {
                console.error('Failed to fetch profile from server:', error);
                loadFromLocalStorage();
            });
    }
    
    // Function to load profile from localStorage (fallback)
    function loadFromLocalStorage() {
        // Try to get profile data from localStorage
        const profileData = JSON.parse(localStorage.getItem('profileData'));
        
        if (profileData) {
            // Ensure username is up-to-date from login
            if (loginUserData) {
                profileData.name = profileData.name || loginUserData.name;
                profileData.email = profileData.email || loginUserData.email;
                
                // Update localStorage with the merged data
                localStorage.setItem('profileData', JSON.stringify(profileData));
            }
            
            // Update profile display with stored data
            updateProfileUI(profileData);
        } else {
            // If no profile data exists yet, create initial profile with login data
            const initialProfileData = {
                name: loginUserData?.name || 'User Name',
                email: loginUserData?.email || 'user@example.com',
                bio: '',
                education: '',
                occupation: '',
                location: '',
                profileImage: ''
            };
            
            // Save initial profile data
            localStorage.setItem('profileData', JSON.stringify(initialProfileData));
            
            // Update UI
            updateProfileUI(initialProfileData);
        }
    }
    
    // Function to remove profile image
    function removeProfileImage() {
        // Set image back to default
        profileImageEl.src = DEFAULT_PROFILE_IMAGE;
        
        // Update profile data in localStorage
        const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
        profileData.profileImage = '';
        localStorage.setItem('profileData', JSON.stringify(profileData));
        
        // Show notification
        showNotification('Profile picture removed', 'info');
    }
    
    // Function to update UI with profile data
    function updateProfileUI(profileData) {
        profileNameEl.textContent = profileData.name || 'User Name';
        profileEmailEl.innerHTML = `<i class="fas fa-envelope"></i> ${profileData.email || 'user@example.com'}`;
        profileBioEl.textContent = profileData.bio || 'No bio provided yet. Click \'Edit Profile\' to add your bio.';
        profileEducationEl.textContent = profileData.education || 'No education details provided yet.';
        profileOccupationEl.textContent = profileData.occupation || 'No occupation details provided yet.';
        profileLocationEl.textContent = profileData.location || 'No location provided yet.';
        
        // Update profile image if exists
        if (profileData.profileImage) {
            profileImageEl.src = profileData.profileImage;
        } else {
            profileImageEl.src = DEFAULT_PROFILE_IMAGE;
        }
    }
    
    // Function to fetch profile from MongoDB server
    async function fetchProfileFromServer() {
        try {
            console.log('Attempting to fetch profile from server...');
            
            // We'll use the /me endpoint which is more reliable
            const response = await fetch(`${API_BASE_URL}/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Profile fetch status:', response.status); // Debug
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response body:', errorText);
                throw new Error(`Failed to fetch profile data: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Profile data received:', data); // Debug
            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }
    
    // Function to save profile to MongoDB server
    async function saveProfileToServer() {
        try {
            // Show loading state
            saveToServerBtn.disabled = true;
            saveToServerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            // Get profile data from localStorage
            const profileData = JSON.parse(localStorage.getItem('profileData'));
            if (!profileData) {
                showNotification('No profile data to save', 'error');
                return;
            }
            
            console.log('Attempting to save profile data:', profileData); // Debug
            
            // Get token
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Authentication token missing. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            
            // Send to server
            const response = await fetch(`${API_BASE_URL}/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: profileData.name,
                    email: profileData.email,
                    bio: profileData.bio,
                    education: profileData.education,
                    occupation: profileData.occupation,
                    location: profileData.location,
                    profileImage: profileData.profileImage
                })
            });
            
            console.log('Profile save response status:', response.status); // Debug
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response body:', errorText);
                throw new Error(`Server responded with status: ${response.status} - ${errorText}`);
            }
            
            const responseData = await response.json();
            console.log('Profile save response:', responseData); // Debug
            
            // Show success notification
            showNotification('Profile saved to server successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving profile to server:', error);
            
            // Provide more helpful error message based on error type
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                showNotification('MongoDB server connection failed. Please ensure the backend server is running at ' + API_BASE_URL, 'error');
            } else {
                showNotification(error.message, 'error');
            }
        } finally {
            // Reset button state
            saveToServerBtn.disabled = false;
            saveToServerBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Save to Cloud';
        }
    }
    
    // Helper function to extract user ID from token
    function getUserIdFromToken(token) {
        try {
            const decoded = getUserDataFromToken(token);
            return decoded?.userId || decoded?.id || null;
        } catch (error) {
            console.error('Error parsing token for user ID:', error);
            return null;
        }
    }
    
    // Function to load user statistics
    function loadUserStats() {
        // Try to get stats from localStorage first
        const statsData = JSON.parse(localStorage.getItem('userStats'));
        
        if (statsData) {
            updateStatsUI(statsData);
        }
        
        // Try to get stats from server
        fetchStatsFromServer()
            .then(serverStats => {
                if (serverStats) {
                    updateStatsUI(serverStats);
                    // Update localStorage with server data
                    localStorage.setItem('userStats', JSON.stringify(serverStats));
                }
            })
            .catch(error => {
                console.error('Error fetching stats from server:', error);
                // Initialize stats if they don't exist
                if (!statsData) {
                    const initialStats = {
                        studyHours: '0',
                        pomodoroCompleted: '0',
                        tasksCompleted: '0',
                        codesCompiled: '0'
                    };
                    
                    localStorage.setItem('userStats', JSON.stringify(initialStats));
                    updateStatsUI(initialStats);
                }
            });
    }
    
    // Function to update stats UI
    function updateStatsUI(statsData) {
        studyHoursEl.textContent = statsData.studyHours || '0';
        pomodoroCompletedEl.textContent = statsData.pomodoroCompleted || '0';
        tasksCompletedEl.textContent = statsData.tasksCompleted || '0';
        codesCompiledEl.textContent = statsData.codesCompiled || '0';
    }
    
    // Function to fetch stats from server
    async function fetchStatsFromServer() {
        try {
            // Get user ID from token
            const userId = loginUserData.userId || getUserIdFromToken(token);
            if (!userId) return null;
            
            const response = await fetch(`${API_BASE_URL}/users/${userId}/stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch stats data');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            return null;
        }
    }

    // Function to open edit modal
    function openEditModal() {
        // Populate form with current profile data
        const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
        
        // Always use the most up-to-date username from login
        editNameInput.value = loginUserData?.name || profileData.name || '';
        editEmailInput.value = loginUserData?.email || profileData.email || '';
        editBioInput.value = profileData.bio || '';
        editEducationInput.value = profileData.education || '';
        editOccupationInput.value = profileData.occupation || '';
        editLocationInput.value = profileData.location || '';
        
        // Show the modal
        editProfileModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Function to close edit modal
    function closeEditModal() {
        editProfileModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Function to save profile changes
    function saveProfileChanges(event) {
        event.preventDefault();
        
        // Get form values
        const updatedProfile = {
            name: editNameInput.value,
            email: editEmailInput.value,
            bio: editBioInput.value,
            education: editEducationInput.value,
            occupation: editOccupationInput.value,
            location: editLocationInput.value
        };
        
        // Get existing profile data to preserve the image
        const existingProfile = JSON.parse(localStorage.getItem('profileData')) || {};
        const mergedProfile = { ...existingProfile, ...updatedProfile };
        
        // Save to localStorage
        localStorage.setItem('profileData', JSON.stringify(mergedProfile));
        
        // Update display
        updateProfileUI(mergedProfile);
        
        // Close modal
        closeEditModal();
        
        // Show success notification
        showNotification('Profile updated successfully! Click "Save to Cloud" to store on server.', 'success');
    }

    // Function to handle profile image upload
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Update profile image
                profileImageEl.src = e.target.result;
                
                // Save image to profile data
                const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
                profileData.profileImage = e.target.result;
                localStorage.setItem('profileData', JSON.stringify(profileData));
                
                // Show success notification
                showNotification('Profile picture updated! Click "Save to Cloud" to store on server.', 'success');
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    // Create particles for background
    function createParticles() {
        const particleSystem = document.querySelector('.particle-system');
        if (!particleSystem) return;
        
        const numberOfParticles = 20;
        
        for (let i = 0; i < numberOfParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Generate random properties
            const size = Math.random() * 5 + 1;
            const tx = Math.random() * 400 - 200; // Random x translation
            const ty = Math.random() * 400 - 200; // Random y translation
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.animationDuration = `${Math.random() * 20 + 10}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            particle.style.opacity = Math.random() * 0.5;
            particle.style.animation = 'particle 15s linear infinite';
            
            particleSystem.appendChild(particle);
        }
    }
    
    // Function to show notifications
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notification-message');
        const notificationIcon = notification.querySelector('i');
        
        notificationMessage.textContent = message;
        
        if (type === 'success') {
            notification.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
            notificationIcon.className = 'fas fa-check';
        } else if (type === 'error') {
            notification.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
            notificationIcon.className = 'fas fa-times';
        } else if (type === 'info') {
            notification.style.backgroundColor = 'rgba(52, 152, 219, 0.9)';
            notificationIcon.className = 'fas fa-info';
        }
        
        // Remove any existing classes and timeouts
        notification.classList.remove('show');
        clearTimeout(notification.dataset.timeout);
        
        // Force a reflow to ensure animation works
        void notification.offsetWidth;
        
        notification.classList.add('show');
        
        // Set timeout to hide notification
        const timeout = setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
        
        notification.dataset.timeout = timeout;
    }

    // Function to handle logout
    function handleLogout() {
        // Clear user auth data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        // Show notification
        showNotification('Logging out...', 'info');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}); 