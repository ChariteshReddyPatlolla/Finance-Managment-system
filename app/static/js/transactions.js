// Global chart variables
        let categoryChart = null;
        let trendsChart = null;
        const addTransactionBtn = document.getElementById('add-transaction');
        const modal = document.getElementById('transaction-modal');
        const closeModalBtn = document.getElementById('close-modal');
        const overlay = document.querySelector('.overlay');
        const typeSelect = document.getElementById('type');
        const categorySelect = document.getElementById('categoryId');
        const methodSelect = document.getElementById('methodId');
    
        // Modal handling
        addTransactionBtn.addEventListener('click', () => {
            modal.classList.add('active');
            overlay.classList.add('active');
            resetForm();
        });
    
        function closeModal() {
            modal.classList.remove('active');
            overlay.classList.remove('active');
        }
    
        closeModalBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    
        function resetForm() {
            document.getElementById('transaction-form').reset();
            typeSelect.value = '';
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            methodSelect.innerHTML = '<option value="">Select Payment Method</option>';
        }
    
        // Static options data
        const categoryOptions = {
            income: [
                { value: 'salary', text: 'Salary' },
                { value: 'bonus', text: 'Bonus' },
                { value: 'investment', text: 'Investment' },
                { value: 'gift', text: 'Gift' },
                { value: 'other_income', text: 'Other Income' }
            ],
            expense: [
                { value: 'food', text: 'Food' },
                { value: 'travel', text: 'Travel' },
                { value: 'utilities', text: 'Utilities' },
                { value: 'entertainment', text: 'Entertainment' },
                { value: 'health', text: 'Health' },
                { value: 'education', text: 'Education' },
                { value: 'others', text: 'Others' }
            ],
            transfer: [
                { value: 'bank_transfer', text: 'Bank Transfer' },
                { value: 'wallet_transfer', text: 'Wallet Transfer' },
                { value: 'cash_transfer', text: 'Cash Transfer' }
            ]
        };
    
        const paymentOptions = {
            income: [
                { value: 'bank', text: 'Bank Deposit' },
                { value: 'cheque', text: 'Cheque' },
                { value: 'cash', text: 'Cash' },
                { value: 'other', text: 'Other' }
            ],
            expense: [
                { value: 'cash', text: 'Cash' },
                { value: 'credit_card', text: 'Credit Card' },
                { value: 'debit_card', text: 'Debit Card' },
                { value: 'net_banking', text: 'Net Banking' },
                { value: 'upi', text: 'UPI' },
                { value: 'wallet', text: 'Digital Wallet' },
                { value: 'other', text: 'Other' }
            ],
            transfer: [
                { value: 'bank', text: 'Bank Account' },
                { value: 'wallet', text: 'Wallet' },
                { value: 'cash', text: 'Cash' }
            ]
        };
    
        function populateSelect(selectElement, options) {
            selectElement.innerHTML = '<option value="">Select Option</option>';
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                selectElement.appendChild(option);
            });
        }
    
        // Handle type selection changes
        typeSelect.addEventListener('change', () => {
            const selectedType = typeSelect.value;
            populateSelect(categorySelect, categoryOptions[selectedType] || []);
            populateSelect(methodSelect, paymentOptions[selectedType] || []);
        });
    
        // Form submission
        document.getElementById('transaction-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                amount: parseFloat(document.getElementById('amount').value),
                type: typeSelect.value,
                description: document.getElementById('description').value,
                date: document.getElementById('date').value,
                category: categorySelect.value,
                payment_method: methodSelect.value,
                status: 'completed'
            };
            
    
            // Validation
            if (!formData.amount || !formData.type || !formData.date || 
                !formData.category || !formData.payment_method) {
                alert('Please fill all required fields');
                return;
            }
            if(typeSelect.value=='income'){
                const formData2 = {
                        source:  categorySelect.value,
                        amount: parseFloat(document.getElementById('amount').value),
                        date:  document.getElementById('date').value,
                        payment_method: methodSelect.value,
                    };

                    fetch('/api/income/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData2)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message === 'Income added successfully') {
                            window.location.reload();
                        } else {
                            alert('Error: ' + data.message);
                        }
                    })
                    .catch(error => console.error('Error:', error));
                }
            try {
                fetch('/api/transactions')
                    .then(response => {
                        if (!response.ok) {
                        throw new Error("Server error or unauthorized access");
                        }
                        return response.json();
                    })
                    .then(data => {
                        // handle data
                    })
                    .catch(err => {
                        console.error("Fetch error:", err.message);
                    });
                const response = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                    credentials: 'include'
                });
    
                const result = await response.json();
                
                if (!response.ok) throw new Error(result.message || 'Transaction failed');
    
                alert('Transaction added successfully');
                closeModal();
                window.location.reload();
            } catch (error) {
                console.error('Error:', error);
                alert(error.message || 'Error creating transaction');
            }
        });
        document.addEventListener('click', function(e) {
            if (e.target.closest('.delete-btn')) {
                const transactionId = e.target.closest('.delete-btn').dataset.id;
                if (confirm('Are you sure you want to delete this transaction?')) {
                    fetch(`/transactions/${transactionId}`, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message === 'transaction deleted successfully') {
                            window.location.reload();
                        } else {
                            alert('Error: ' + data.message);
                        }
                    })
                    .catch(error => console.error('Error:', error));
                }
            }
        });

        document.querySelectorAll('.export-chart').forEach(btn => {
            btn.addEventListener('click', function() {
                const chartType = this.dataset.chart;
                const chart = chartType === 'category' ? categoryChart : trendsChart;
                const link = document.createElement('a');
                link.href = chart.toBase64Image();
                link.download = `${chartType}-chart.png`;
                link.click();
            });
        });
        
           // Colors for charts
           const categoryColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#8AC24A', '#F06292'
        ];
        
        // Initialize charts when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            loadSpendingByCategory();
            loadMonthlyTrends();
        });
        
        // Spending by Category Pie Chart
        async function loadSpendingByCategory() {
    try {
        const response = await fetch('/api/transactions/spending-by-category');
        const result = await response.json();
        
        console.log('Spending by category data:', result); // Debug log
        
        if (!result.success || !result.data || result.data.length === 0) {
            console.log('No spending data available');
            document.querySelector('.chart-card:nth-child(1) .chart-placeholder').innerHTML = 
                '<p class="no-data">No spending data available</p>';
            return;
        }
        
        const data = result.data;
        const ctx = document.createElement('canvas');
        const container = document.querySelector('.chart-card:nth-child(1) .chart-placeholder');
        container.innerHTML = '';
        container.appendChild(ctx);
        
        // Destroy previous chart if exists
        if (categoryChart) {
            categoryChart.destroy();
        }
        
        // Updated colors with blue for income-related categories
        const categoryColors = [
            '#4361ee', // Blue for primary income
            '#4895ef', // Lighter blue
            '#4cc9f0', // Teal
            '#3a0ca3', // Dark blue
            '#7209b7', // Purple
            '#f72585', // Pink for contrast
            '#b5179e'  // Magenta
        ];
        
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.category),
                datasets: [{
                    data: data.map(item => item.amount),
                    backgroundColor: categoryColors.slice(0, data.length),
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%',
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    } catch (error) {
        console.error('Error loading spending by category:', error);
        document.querySelector('.chart-card:nth-child(1) .chart-placeholder').innerHTML = 
            '<p class="error-message">Failed to load spending data</p>';
    }
}
        
        // Monthly Trends Line Chart
        async function loadMonthlyTrends() {
            try {
                const response = await fetch('/api/transactions/monthly-trends');
                const result = await response.json();
                
                console.log('Monthly trends data:', result); // Debug log
                
                if (!result.success || !result.data || result.data.length === 0) {
                    console.log('No trends data available');
                    document.querySelector('.chart-placeholder:nth-child(2)').innerHTML = 
                        '<p class="no-data">No trends data available</p>';
                    return;
                }
                
                const data = result.data;
                const ctx = document.createElement('canvas');
                const container = document.querySelector('.chart-card:nth-child(2) .chart-placeholder');
                container.innerHTML = '';
                container.appendChild(ctx);
                
                // Destroy previous chart if exists
                if (trendsChart) {
                    trendsChart.destroy();
                }
                
                trendsChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.map(item => item.month),
                        datasets: [
                            {
                                label: 'Income',
                                data: data.map(item => item.income),
                                borderColor: '#4361ee', // Using your primary color
                                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                                borderWidth: 2,
                                tension: 0.3,
                                fill: true
                            },
                            {
                                label: 'Expenses',
                                data: data.map(item => item.expense),
                                borderColor: '#f72585', // Using your warning color
                                backgroundColor: 'rgba(247, 37, 133, 0.1)',
                                borderWidth: 2,
                                tension: 0.3,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    usePointStyle: true,
                                    padding: 20
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.dataset.label}: ₹${context.raw.toFixed(2)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '₹' + value;
                                    }
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error loading monthly trends:', error);
                document.querySelector('.chart-card:nth-child(2) .chart-placeholder').innerHTML = 
                    '<p class="error-message">Failed to load trends data</p>';
            }
        }