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

        // Backup option selection
        const backupCards = document.querySelectorAll('.backup-card');
        backupCards.forEach(card => {
            card.addEventListener('click', () => {
                backupCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
        });

        // Dark mode toggle simulation
        const darkModeToggle = document.querySelector('#display-tab .toggle-switch input');
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                console.log('Dark mode enabled');
            } else {
                console.log('Dark mode disabled');
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

        // Initialize with first tab active
        document.getElementById('account-tab').classList.add('active');