document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status and update nav links
    const isAuthenticated = localStorage.getItem('token') !== null;
    
    if (!isAuthenticated) {
        // If not authenticated, redirect all nav links to login page
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function(e) {
                // Allow the following links to work normally
                if (this.getAttribute('href') === 'login.html' || 
                    this.getAttribute('href') === 'signup.html' ||
                    this.getAttribute('href') === '#features' ||
                    this.getAttribute('href').startsWith('#')) {
                    return;
                }
                
                e.preventDefault();
                window.location.href = 'login.html';
            });
        });
        
        // Also modify feature card links to redirect to login
        document.querySelectorAll('.feature-btn').forEach(btn => {
            if (btn.getAttribute('href') !== 'login.html') {
                btn.setAttribute('href', 'login.html');
            }
        });
    }

    // Animate feature cards on scroll
    const cards = document.querySelectorAll('.feature-card');
    
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });

    // Add hover effect to nav links
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('mouseover', (e) => {
            link.style.transform = 'translateY(-2px)';
        });
        
        link.addEventListener('mouseout', (e) => {
            link.style.transform = 'translateY(0)';
        });
    });

    // Add particle effect to hero section
    const hero = document.querySelector('.hero');
    for (let i = 0; i < 50; i++) {
        createParticle(hero);
    }

    // Handle smooth scroll for explore features button
    document.querySelector('a[href="#features"]').addEventListener('click', (e) => {
        e.preventDefault();
        const featuresSection = document.getElementById('features');
        const offset = 80; // Adjust this value to account for fixed navbar height
        
        const targetPosition = featuresSection.getBoundingClientRect().top + window.pageYOffset - offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        // Add highlight animation to features section
        featuresSection.style.animation = 'none';
        featuresSection.offsetHeight; // Trigger reflow
        featuresSection.style.animation = 'highlightSection 1s ease-out';
    });

    createParticles();

    // Handle CTA button
    const ctaButton = document.getElementById('ctaButton');
    if (ctaButton && !isAuthenticated) {
        ctaButton.setAttribute('href', 'login.html');
    }
});

function createParticles() {
    const container = document.querySelector('.particle-system');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 3 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        
        const tx = (Math.random() - 0.5) * 300;
        const ty = (Math.random() - 0.5) * 300;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        const duration = Math.random() * 4 + 3;
        const delay = Math.random() * 2;
        particle.style.animation = `particle ${duration}s ${delay}s infinite`;
        
        container.appendChild(particle);
    }
}