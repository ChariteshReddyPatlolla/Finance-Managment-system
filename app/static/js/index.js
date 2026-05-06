// Toggle password visibility
        const togglePassword = document.getElementById('togglePassword');
        const password = document.getElementById('password');
    
        togglePassword.addEventListener('click', function() {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
        });
    
        // Form validation
        const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');
    
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(String(email).toLowerCase());
        }
    
        function validatePassword(password) {
            return password.length >= 6;
        }
    
        // Real-time validation
        emailInput.addEventListener('input', () => {
            emailError.style.display = validateEmail(emailInput.value) ? 'none' : 'block';
        });
    
        passwordInput.addEventListener('input', () => {
            passwordError.style.display = validatePassword(passwordInput.value) ? 'none' : 'block';
        });
    
        // Form submission
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            // Validate inputs before submission
            let isValid = true;
            
            if (!validateEmail(email)) {
                emailError.style.display = 'block';
                isValid = false;
            }
            
            if (!validatePassword(password)) {
                passwordError.style.display = 'block';
                isValid = false;
            }
            
            if (!isValid) return;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // Required for session cookies
                    body: JSON.stringify({ email, password }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Redirect to dashboard using the URL from the response
                    window.location.href = data.redirect || '/dashboard';
                } else {
                    // Show error message from server
                    alert(data.message || 'Login failed. Please check your credentials and try again.');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again later.');
            }
        });
    
        // Check if user is already logged in (optional)
        document.addEventListener('DOMContentLoaded', () => {
            // You could add a check here to see if the user is already authenticated
            // by making a request to a protected endpoint
        });