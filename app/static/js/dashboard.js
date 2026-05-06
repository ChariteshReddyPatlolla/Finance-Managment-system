// Store chart instances globally
        let spendingChart, expenseChart;
    
        // Theme toggle functionality
        const themeToggle = document.querySelector('.theme-toggle');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            themeToggle.querySelector('.light').classList.toggle('active');
            themeToggle.querySelector('.dark').classList.toggle('active');
            
            // Update charts to match theme
            updateChartThemes();
        });
    
        // Sidebar toggle functionality
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.overlay');
    
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    
        // Close sidebar when clicking outside
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    
        // Close sidebar when clicking on a menu item (for mobile)
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        });
    
        // Helper function to convert hex to rgba
        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
    
        // Chart colors
        const chartColors = {
            income: '#4361ee',
            expense: '#f72585',
            background: [
                '#4361ee', '#4895ef', '#4cc9f0', '#f72585', 
                '#ef233c', '#6c757d', '#3a0ca3', '#7209b7'
            ],
            text: '#333333',
            grid: '#e0e0e0'
        };
    
        // Dark theme colors
        const darkChartColors = {
            income: '#4cc9f0',
            expense: '#f72585',
            background: [
                '#4cc9f0', '#4895ef', '#4361ee', '#f72585',
                '#ef233c', '#6c757d', '#3a0ca3', '#7209b7'
            ],
            text: '#ffffff',
            grid: '#424242'
        };
    
        // Update chart themes based on current theme
        function updateChartThemes() {
            const isDark = document.body.classList.contains('dark-theme');
            const colors = isDark ? darkChartColors : chartColors;
    
            if (spendingChart) {
                spendingChart.options.scales.x.grid.color = colors.grid;
                spendingChart.options.scales.y.grid.color = colors.grid;
                spendingChart.options.scales.x.ticks.color = colors.text;
                spendingChart.options.scales.y.ticks.color = colors.text;
                spendingChart.update();
            }
    
            if (expenseChart) {
                expenseChart.options.plugins.legend.labels.color = colors.text;
                expenseChart.update();
            }
        }
    
        // Show loading state for charts
        function showChartLoading(show) {
            document.querySelectorAll('.chart-loading').forEach(el => {
                el.style.display = show ? 'flex' : 'none';
            });
        }
    
        // Initialize charts with data from Flask
        function initializeCharts() {
            try {
                // Parse the data from Flask
                const spendingData = JSON.parse('{{ spending_data | safe }}');
                const expenseDistData = JSON.parse('{{ expense_dist_data | safe }}');
    
                // Initialize spending chart with real data
                const spendingCtx = document.getElementById('spendingChart').getContext('2d');
                spendingChart = new Chart(spendingCtx, {
                    type: 'line',
                    data: {
                        labels: spendingData.labels,
                        datasets: [
                            {
                                label: 'Income',
                                data: spendingData.income,
                                borderColor: chartColors.income,
                                backgroundColor: hexToRgba(chartColors.income, 0.1),
                                borderWidth: 2,
                                tension: 0.4,
                                fill: true
                            },
                            {
                                label: 'Expenses',
                                data: spendingData.expenses,
                                borderColor: chartColors.expense,
                                backgroundColor: hexToRgba(chartColors.expense, 0.1),
                                borderWidth: 2,
                                tension: 0.4,
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
                                    color: chartColors.text
                                }
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    label: function(context) {
                                        return `${context.dataset.label}: ₹${context.raw.toLocaleString()}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: chartColors.grid,
                                    drawBorder: false,
                                },
                                ticks: {
                                    color: chartColors.text,
                                    callback: function(value) {
                                        return '₹' + value.toLocaleString();
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    display: false,
                                    color: chartColors.grid
                                },
                                ticks: {
                                    color: chartColors.text
                                }
                            }
                        }
                    }
                });
    
                // Initialize expense distribution chart with real data
                const expenseCtx = document.getElementById('expenseChart').getContext('2d');
                expenseChart = new Chart(expenseCtx, {
                    type: 'doughnut',
                    data: {
                        labels: expenseDistData.labels,
                        datasets: [{
                            data: expenseDistData.values,
                            backgroundColor: chartColors.background,
                            borderWidth: 0,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    color: chartColors.text,
                                    padding: 20,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        cutout: '70%'
                    }
                });
    
                // Update chart themes based on initial theme
                updateChartThemes();
    
            } catch (error) {
                console.error('Error initializing charts:', error);
                showErrorToast('Failed to load chart data');
            }
        }
    
        // Period buttons functionality with real data updates
        async function setupPeriodButtons() {
            const periodButtons = document.querySelectorAll('.period-btn');
            
            periodButtons.forEach(button => {
                button.addEventListener('click', async () => {
                    try {
                        // Show loading state
                        showChartLoading(true);
                        
                        // Update active button
                        periodButtons.forEach(btn => btn.classList.remove('active'));
                        button.classList.add('active');
                        
                        const period = button.textContent.toLowerCase();
                        
                        // Fetch data for the selected period
                        const response = await fetch(`/api/dashboard/data?period=${period}`);
                        if (!response.ok) throw new Error('Failed to fetch data');
                        
                        const data = await response.json();
                        
                        // Update spending chart
                        spendingChart.data.labels = data.spending.labels;
                        spendingChart.data.datasets[0].data = data.spending.income;
                        spendingChart.data.datasets[1].data = data.spending.expenses;
                        spendingChart.update();
                        
                        // Update expense distribution chart
                        expenseChart.data.labels = data.expense_dist.labels;
                        expenseChart.data.datasets[0].data = data.expense_dist.values;
                        expenseChart.update();
                        
                    } catch (error) {
                        console.error('Error updating charts:', error);
                        showErrorToast('Failed to update chart data');
                    } finally {
                        showChartLoading(false);
                    }
                });
            });
        }
    
        // Show error toast notification
        function showErrorToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast-notification error';
            toast.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 5000);
        }
    
        // Initialize everything when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            initializeCharts();
            setupPeriodButtons();
            
            // Set default active period button
            document.querySelector('.period-btn.active')?.click();
        });
    
        // Responsive adjustments
        window.addEventListener('resize', function() {
            if (spendingChart) spendingChart.resize();
            if (expenseChart) expenseChart.resize();
        });