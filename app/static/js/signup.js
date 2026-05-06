// Toggle password visibility
        const togglePassword = document.getElementById('togglePassword');
        const password = document.getElementById('password');
        const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
        const confirmPassword = document.getElementById('confirmPassword');
    
        togglePassword.addEventListener('click', function() {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
        });
    
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPassword.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
        });
    
        // Form validation
        const signupForm = document.getElementById('signupForm');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const nameError = document.getElementById('nameError');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');
        const confirmPasswordError = document.getElementById('confirmPasswordError');
    
        function validateName(name) {
            return name.trim().length > 0;
        }
    
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(String(email).toLowerCase());
        }
    
        function validatePassword(password) {
            return password.length >= 6;
        }
    
        function validateConfirmPassword(password, confirmPassword) {
            return password === confirmPassword;
        }
    
        // Real-time validation
        nameInput.addEventListener('input', () => {
            nameError.style.display = validateName(nameInput.value) ? 'none' : 'block';
        });
    
        emailInput.addEventListener('input', () => {
            emailError.style.display = validateEmail(emailInput.value) ? 'none' : 'block';
        });
    
        passwordInput.addEventListener('input', () => {
            passwordError.style.display = validatePassword(passwordInput.value) ? 'none' : 'block';
            if (confirmPasswordInput.value) {
                confirmPasswordError.style.display = validateConfirmPassword(passwordInput.value, confirmPasswordInput.value) 
                    ? 'none' : 'block';
            }
        });
    
        confirmPasswordInput.addEventListener('input', () => {
            confirmPasswordError.style.display = validateConfirmPassword(passwordInput.value, confirmPasswordInput.value)
                ? 'none' : 'block';
        });
    
        // Form submission handler
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear previous errors
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
                el.textContent = ''; // Clear previous error messages
            });
    
            const formData = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim().toLowerCase(),
                password: passwordInput.value.trim(),
                confirmPassword: confirmPasswordInput.value.trim()
            };
    
            // Client-side validation
            let isValid = true;
            
            if (!validateName(formData.name)) {
                nameError.textContent = 'Name is required';
                nameError.style.display = 'block';
                isValid = false;
            }
            
            if (!validateEmail(formData.email)) {
                emailError.textContent = 'Invalid email format';
                emailError.style.display = 'block';
                isValid = false;
            }
            
            if (!validatePassword(formData.password)) {
                passwordError.textContent = 'Password must be at least 6 characters';
                passwordError.style.display = 'block';
                isValid = false;
            }
            
            if (!validateConfirmPassword(formData.password, formData.confirmPassword)) {
                confirmPasswordError.textContent = 'Passwords do not match';
                confirmPasswordError.style.display = 'block';
                isValid = false;
            }
            
            if (!isValid) return;
    
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });
    
                const data = await response.json();
    
                if (response.ok) {
                    alert(data.message);
                    window.location.href = '/login'; // Redirect to login page
                } else {
                    // Handle server-side errors
                    switch(response.status) {
                        case 400:
                            if (data.message.includes('email')) {
                                emailError.textContent = data.message;
                                emailError.style.display = 'block';
                            } else if (data.message.includes('Password')) {
                                passwordError.textContent = data.message;
                                passwordError.style.display = 'block';
                            } else {
                                alert(data.message);
                            }
                            break;
                        case 409:
                            emailError.textContent = data.message;
                            emailError.style.display = 'block';
                            break;
                        default:
                            alert(data.message || 'Registration failed');
                    }
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    
        // Remove localStorage check (since we're using session-based auth)