document.addEventListener('DOMContentLoaded', () => {
    console.log('Home page loaded. Checking authentication...');
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    let userData = null;
    
    try {
        userData = JSON.parse(localStorage.getItem('userData') || "{}");
    } catch (e) {
        console.error('Error parsing userData from localStorage:', e);
    }
    
    const username = userData?.username;

    // Redirect to login if not authenticated
    if (!token || !username) {
        console.warn('Not authenticated, redirecting to login page');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('User authenticated, username:', username);

    // Initialize particles
    createParticles();

    // Display welcome message with typewriter effect
    const welcomeMessage = document.getElementById('welcomeMessage');
    const typingContainer = document.querySelector('.typing-container');
    
    if (welcomeMessage && typingContainer) {
        // Prepare the welcome message with formatted username
        const fullMessage = `Welcome Back, <span class="username">${username}</span>!`;
        
        // First, set the full message for users with JavaScript disabled
        welcomeMessage.innerHTML = fullMessage;
        
        // Then implement typewriter effect
        setTimeout(() => {
            welcomeMessage.innerHTML = '';
            let textParts = [
                { text: 'Welcome Back, ', isHTML: false },
                { text: `<span class="username">${username}</span>`, isHTML: true },
                { text: '!', isHTML: false }
            ];
            
            let currentPart = 0;
            let currentChar = 0;
            let isTyping = true;
            
            const typeChar = () => {
                if (isTyping) {
                    if (currentPart < textParts.length) {
                        const part = textParts[currentPart];
                        
                        if (part.isHTML) {
                            // For HTML parts, add the whole thing at once
                            welcomeMessage.innerHTML += part.text;
                            currentPart++;
                            setTimeout(typeChar, 500); // Pause after adding username
                        } else {
                            // For regular text, type character by character
                            if (currentChar < part.text.length) {
                                welcomeMessage.innerHTML += part.text.charAt(currentChar);
                                currentChar++;
                                setTimeout(typeChar, 100);
                            } else {
                                // Move to next part
                                currentPart++;
                                currentChar = 0;
                                setTimeout(typeChar, 50);
                            }
                        }
                    } else {
                        // All parts typed, update cursor position and add pulse effect
                        typingContainer.style.setProperty('--cursor-right', '0');
                        setTimeout(() => {
                            welcomeMessage.querySelector('.username').style.animation = 'pulse 2s ease-in-out';
                            // Hide the cursor after animation completes
                            setTimeout(() => {
                                typingContainer.style.setProperty('--cursor-display', 'none');
                            }, 2000);
                        }, 500);
                    }
                }
            };
            
            typeChar();
        }, 500);
    }

    // Fade in the content
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.8s ease';

    // Feature cards click handlers
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', () => {
            const feature = card.dataset.feature;
            navigateToFeature(feature);
        });
        
        // Add hover particle effects
        card.addEventListener('mouseenter', () => {
            const rect = card.getBoundingClientRect();
            createParticleEffect(rect.left + rect.width/2, rect.top + rect.height/2, 5);
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
                localStorage.removeItem('userData');
                localStorage.removeItem('username');
                window.location.href = 'login.html';
            }, 500);
        });
    }

    // Add logout handler
    const logoutBtnAlt = document.querySelector('.logout-btn');
    if (logoutBtnAlt) {
        logoutBtnAlt.addEventListener('click', () => {
            // Add fade out animation
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.5s ease';

            setTimeout(() => {
                // Clear local storage
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                localStorage.removeItem('username');
                
                // Redirect to login page
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
    const container = document.querySelector('.particle-system');
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
    
    // Add click effect for dynamic particles
    document.addEventListener('click', createClickParticles);
}

function createClickParticles(e) {
    const x = e.clientX;
    const y = e.clientY;
    
    createParticleEffect(x, y, 8);
}

function createParticleEffect(x, y, count = 10, color = null) {
    // Create particles at specified location
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size between 3 and 6 pixels
        const size = Math.random() * 3 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Position at specified point
        particle.style.position = 'fixed';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Random direction
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 80 + 20;
        
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        // Set custom color if provided
        if (color) {
            particle.style.background = color;
        }
        
        // Add to body
        document.body.appendChild(particle);
        
        // Remove after animation completes
        setTimeout(() => particle.remove(), 2000);
    }
}

function navigateToFeature(feature) {
    const animations = {
        pomodoro: { icon: '⏰', color: '#DC143C' },
        planner: { icon: '📝', color: '#FF4444' },
        calendar: { icon: '📅', color: '#8B0000' }
    };

    const { icon, color } = animations[feature];
    
    // Create particles at the card location
    const card = document.querySelector(`[data-feature="${feature}"]`);
    if (card) {
        const rect = card.getBoundingClientRect();
        createParticleEffect(rect.left + rect.width/2, rect.top + rect.height/2, 15, color);
    }

    // Fade out effect
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';

    // Redirect
    setTimeout(() => {
        window.location.href = `${feature}.html`;
    }, 500);
}