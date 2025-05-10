document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgotForm');
    const resetBtn = document.querySelector('.reset-btn');
    const emailInput = document.getElementById('email');

    // Add email validation
    emailInput.addEventListener('input', (e) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value);
        resetBtn.disabled = !isValid;
        emailInput.classList.toggle('error', !isValid && e.target.value !== '');
    });

    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show loading state
        resetBtn.classList.add('loading');
        resetBtn.disabled = true;
        const originalText = resetBtn.innerHTML;
        resetBtn.innerHTML = '';

        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: emailInput.value })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess('Reset link sent! Please check your email.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                throw new Error(data.error || 'Failed to send reset link');
            }
        } catch (error) {
            showError(error.message);
            // Reset button state
            resetBtn.classList.remove('loading');
            resetBtn.disabled = false;
            resetBtn.innerHTML = originalText;
        }
    });

    function showMessage(message, type) {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) existingMessage.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        forgotForm.insertBefore(messageDiv, forgotForm.firstChild);
    }

    function showSuccess(message) {
        showMessage(message, 'success');
    }

    function showError(message) {
        showMessage(message, 'error');
    }
});