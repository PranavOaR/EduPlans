document.addEventListener('DOMContentLoaded', () => {
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

    // Handle nav link clicks
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Add fade out animation
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.5s ease';
            
            // Redirect after animation
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 500);
        });
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
});

function createParticle(parent) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    parent.appendChild(particle);

    const size = Math.random() * 5 + 1;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const duration = Math.random() * 20 + 10;

    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(74, 144, 226, 0.2);
        border-radius: 50%;
        left: ${posX}%;
        top: ${posY}%;
        animation: float ${duration}s infinite linear;
    `;
}