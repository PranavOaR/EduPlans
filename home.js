document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (!token || !username) {
        window.location.href = 'login.html';
        return;
    }

    // Display username
    const userDisplayName = document.getElementById('userDisplayName');
    if (userDisplayName) {
        userDisplayName.textContent = username;
    }

    // Fade in the content
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.5s ease';

    // Initialize particles
    createParticles();

    // Feature cards click handlers
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', () => {
            const feature = card.dataset.feature;
            navigateToFeature(feature);
        });
    });

    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Add fade out animation to the content
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.5s ease';

            // Clear local storage
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                window.location.href = 'login.html';
            }, 500);
        });
    }

    // Handle home link click
    const homeLink = document.querySelector('a[href="home.html"]');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Add refresh animation
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });
    }
});

function createParticles() {
    const container = document.querySelector('.particle-container');
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
        
        // Random animation delay
        particle.style.animationDelay = `${Math.random() * 3}s`;
        
        container.appendChild(particle);
    }
}

function navigateToFeature(feature) {
    const animations = {
        pomodoro: { icon: '⏰', color: '#4a90e2' },
        planner: { icon: '📝', color: '#00bcd4' },
        calendar: { icon: '📅', color: '#7e57c2' }
    };

    const { icon, color } = animations[feature];
    
    // Create floating icon animation
    const floatingIcon = document.createElement('div');
    floatingIcon.textContent = icon;
    floatingIcon.style.position = 'fixed';
    floatingIcon.style.fontSize = '2rem';
    floatingIcon.style.zIndex = '1000';
    document.body.appendChild(floatingIcon);

    // Animate and redirect
    setTimeout(() => {
        window.location.href = `${feature}.html`;
    }, 500);
}