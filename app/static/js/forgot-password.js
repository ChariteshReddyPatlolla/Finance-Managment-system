// Form validation
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        const emailInput = document.getElementById('email');
        const emailError = document.getElementById('emailError');
        const successMessage = document.getElementById('successMessage');

        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(String(email).toLowerCase());
        }

        emailInput.addEventListener('input', () => {
            if (!validateEmail(emailInput.value)) {
                emailError.style.display = 'block';
            } else {
                emailError.style.display = 'none';
            }
        });

        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value;
            
            if (!validateEmail(email)) {
                emailError.style.display = 'block';
                return;
            }
            
            try {
                // Replace with actual API endpoint
                const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    forgotPasswordForm.style.display = 'none';
                    successMessage.style.display = 'block';
                } else {
                    alert(data.message || 'Failed to send reset link');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while sending reset link');
            }
        });

        // Check if user is already logged in
        document.addEventListener('DOMContentLoaded', () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                window.location.href = 'dashboard.html';
            }
        });