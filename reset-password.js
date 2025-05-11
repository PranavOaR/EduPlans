document.addEventListener('DOMContentLoaded', () => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // Get form elements
    const resetForm = document.getElementById('resetForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const resetBtn = document.querySelector('.reset-btn');
    
    // Create particles
    createParticles();
    
    // Redirect to login if no token is provided
    if (!token) {
        showError('Invalid or expired reset link. Please request a new one.');
        resetBtn.disabled = true;
        setTimeout(() => {
            window.location.href = 'forgot.html';
        }, 3000);
        return;
    }
    
    // Validate passwords match
    confirmPasswordInput.addEventListener('input', validatePasswords);
    newPasswordInput.addEventListener('input', validatePasswords);
    
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validatePasswords()) {
            return;
        }
        
        // Show loading state
        resetBtn.classList.add('loading');
        resetBtn.disabled = true;
        const originalText = resetBtn.innerHTML;
        resetBtn.innerHTML = '';
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    newPassword: newPasswordInput.value
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showSuccess('Password reset successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                throw new Error(data.error || 'Failed to reset password');
            }
        } catch (error) {
            showError(error.message);
            // Reset button state
            resetBtn.classList.remove('loading');
            resetBtn.disabled = false;
            resetBtn.innerHTML = originalText;
        }
    });
    
    function validatePasswords() {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Check if passwords match
        if (confirmPassword && newPassword !== confirmPassword) {
            confirmPasswordInput.classList.add('error');
            return false;
        } else {
            confirmPasswordInput.classList.remove('error');
        }
        
        // Check password strength (at least 6 characters)
        if (newPassword && newPassword.length < 6) {
            newPasswordInput.classList.add('error');
            return false;
        } else {
            newPasswordInput.classList.remove('error');
        }
        
        // Enable button if both fields are valid and have values
        resetBtn.disabled = !(newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6);
        
        return !resetBtn.disabled;
    }
    
    function showMessage(message, type) {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) existingMessage.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        resetForm.insertBefore(messageDiv, resetForm.firstChild);
    }
    
    function showSuccess(message) {
        showMessage(message, 'success');
    }
    
    function showError(message) {
        showMessage(message, 'error');
    }
    
    function createParticles() {
        const particleContainer = document.querySelector('.particle-container');
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random size between 3px and 10px
            const size = Math.random() * 7 + 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random position
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // Random animation delay
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            // Set custom properties for animation
            const tx = (Math.random() - 0.5) * 200;
            const ty = (Math.random() - 0.5) * 200;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            particleContainer.appendChild(particle);
        }
    }
}); 