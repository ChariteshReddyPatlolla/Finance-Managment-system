// Tab functionality
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.settings-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });

        // Toggle password visibility
        const togglePasswordIcons = document.querySelectorAll('.toggle-password');
        togglePasswordIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                const input = e.target.parentElement.querySelector('input');
                if (input.type === 'password') {
                    input.type = 'text';
                    e.target.classList.remove('fa-eye');
                    e.target.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    e.target.classList.remove('fa-eye-slash');
                    e.target.classList.add('fa-eye');
                }
            });
        });

        // Photo modal functionality
        const editPhotoBtn = document.getElementById('editPhotoBtn');
        const photoModal = document.getElementById('photoModal');
        const closePhotoModal = document.getElementById('closePhotoModal');
        const cancelPhotoBtn = document.getElementById('cancelPhotoBtn');
        const photoUpload = document.getElementById('photoUpload');
        const photoPreview = document.getElementById('photoPreview');

        editPhotoBtn.addEventListener('click', () => {
            photoModal.style.display = 'flex';
        });

        closePhotoModal.addEventListener('click', () => {
            photoModal.style.display = 'none';
        });

        cancelPhotoBtn.addEventListener('click', () => {
            photoModal.style.display = 'none';
        });

        photoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    photoPreview.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Delete account modal functionality
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        const deleteModal = document.getElementById('deleteModal');
        const closeDeleteModal = document.getElementById('closeDeleteModal');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

        deleteAccountBtn.addEventListener('click', () => {
            deleteModal.style.display = 'flex';
        });

        closeDeleteModal.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });

        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });

        // Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout from all devices?')) {
                window.location.href = '/';
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === photoModal) {
                photoModal.style.display = 'none';
            }
            if (e.target === deleteModal) {
                deleteModal.style.display = 'none';
            }
        });
        // Profile Form Submission
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                phone: document.getElementById('phone').value.trim(),
                street: document.getElementById('street').value,
                city: document.getElementById('city').value,
                zipCode: document.getElementById('zipCode').value,
                country: document.getElementById('country').value
            };
            if (!formData.firstName || !formData.phone || !formData.street || 
                        !formData.city || !formData.zipCode||!formData.country) {
                        alert('Please fill all required fields');
                        return;
                    }
            const phoneRegex =/^[6-9]\d{9}$/;

            if(!phoneRegex.test(formData.phone)){
                alert('please enter valid phone number');
                return;
            }
            try {
                const response = await fetch('/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('Profile updated successfully!');
                    // Optionally refresh the page or update UI elements
                    location.reload();
                } else {
                    alert('Error updating profile');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while saving');
            }
        });
        document.getElementById('passwordChangeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                current_password: document.querySelector('[name="current_password"]').value,
                new_password: document.querySelector('[name="new_password"]').value,
                confirm_password: document.querySelector('[name="confirm_password"]').value
            };

            // Basic validation
            if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
                alert('Please fill in all password fields');
                return;
            }

            if (formData.new_password !== formData.confirm_password) {
                alert('New passwords do not match!');
                return;
            }

            // Optional password strength validation

            try {
                const response = await fetch('/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();
                
                if (result.success) {
                    alert('Password changed successfully!');
                    document.getElementById('passwordChangeForm').reset();
                } else {
                    alert(`Error: ${result.message}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to change password. Please try again.');
            }
        });
        document.getElementById('deletemyaccount').addEventListener('click', function(e) {
            e.preventDefault();
            const password = document.getElementById('passwordConfirm').value;

            if (!password) {
                alert('Please enter your password to confirm deletion');
                return;
            }

            if (confirm('Are you absolutely sure? This will permanently erase all your data!')) {
                fetch('/delete-account', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ password: password })
                })
                .then(response => {
                    if (response.ok) {
                        window.location.href = '/login';  // Redirect to login page
                    } else {
                        return response.json().then(err => { throw err; });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert(error.message || 'Account deletion failed. Please check your password.');
                });
            }
        });