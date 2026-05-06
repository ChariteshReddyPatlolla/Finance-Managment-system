// Global chart variables
        let incomeTrendChart = null;
        let incomeSourcesChart = null;
    
        // Initialize sidebar toggle and charts
        document.addEventListener('DOMContentLoaded', function() {
            // Sidebar toggle
            const menuToggle = document.querySelector('.menu-toggle');
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.overlay');
            
            menuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
            
            overlay.addEventListener('click', function() {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
            
            // Initialize filter buttons
            document.querySelectorAll('.trend-filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    // Update active state
                    document.querySelectorAll('.trend-filter-btn').forEach(b => {
                        b.classList.remove('btn-primary');
                        b.classList.add('btn-outline');
                    });
                    this.classList.remove('btn-outline');
                    this.classList.add('btn-primary');
                    
                    // Load chart with new filter
                    const filter = this.dataset.filter;
                    loadIncomeTrendChart(filter);
                });
            });
    
            // Load charts
            loadIncomeTrendChart('yearly');
            loadIncomeSourcesChart();
        });
    
        // Load income trend chart
        async function loadIncomeTrendChart(filter = 'yearly') {
            try {
                const response = await fetch(`/api/income/trend?filter=${filter}`);
                const result = await response.json();
                
                if (!result.success) {
                    console.error('Failed to load trend data:', result);
                    return;
                }
    
                const data = result.data;
                console.log('Trend data:', data); // Debug log
                
                // Prepare canvas
                const chartContainer = document.getElementById('income-trend-chart');
                chartContainer.innerHTML = '<canvas id="incomeTrendCanvas"></canvas>';
                const ctx = document.getElementById('incomeTrendCanvas');
                
                // Destroy previous chart if exists
                if (incomeTrendChart) {
                    incomeTrendChart.destroy();
                }
                
                // Determine chart title based on filter
                let yAxisTitle = '';
                let xAxisTitle = '';
                if (filter === 'monthly') {
                    yAxisTitle = 'Daily Income';
                    xAxisTitle = 'Day';
                } else if (filter === 'quarterly') {
                    yAxisTitle = 'Weekly Income';
                    xAxisTitle = 'Week';
                } else {
                    yAxisTitle = 'Monthly Income';
                    xAxisTitle = 'Month';
                }
                
                // Create new chart
                incomeTrendChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.map(item => item.date), // Changed from item.month to item.date
                        datasets: [{
                            label: yAxisTitle,
                            data: data.map(item => item.amount),
                            backgroundColor: 'rgba(67, 97, 238, 0.1)',
                            borderColor: '#4361ee',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${yAxisTitle}: ₹${context.raw.toFixed(2)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Amount (₹)'
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return '₹' + value;
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                title: {
                                    display: true,
                                    text: xAxisTitle
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error loading income trend chart:', error);
                const chartContainer = document.getElementById('income-trend-chart');
                chartContainer.innerHTML = '<p class="error-message">Failed to load income trend data</p>';
            }
        }
        
        // load income soure chart
        async function loadIncomeSourcesChart() {
            try {
                const response = await fetch('/api/income/sources');
                const result = await response.json();
                
                if (!result.success || !result.data) {
                    console.error('Failed to load sources data:', result);
                    const chartContainer = document.getElementById('income-sources-chart');
                    chartContainer.innerHTML = '<p class="error-message">No income sources data available</p>';
                    return;
                }

                const data = result.data;
                console.log('Sources data:', data); // Debug log
                
                // Prepare canvas
                const chartContainer = document.getElementById('income-sources-chart');
                chartContainer.innerHTML = '<canvas id="incomeSourcesCanvas"></canvas>';
                const ctx = document.getElementById('incomeSourcesCanvas');
                
                // Destroy previous chart if exists
                if (incomeSourcesChart) {
                    incomeSourcesChart.destroy();
                }
                
                // Generate colors - make sure you have enough colors for all categories
                const backgroundColors = [
                    '#4cc9f0', // salary
                    '#f72585', // freelance
                    '#7209b7', // investment
                    '#3a0ca3', // business
                    '#4361ee', // other
                    '#4895ef', // additional colors if needed
                    '#3f37c9',
                    '#4ad66d',
                    '#ff9e00'
                ];
                
                // Create new chart
                incomeSourcesChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: data.map(item => item.name),
                        datasets: [{
                            data: data.map(item => item.value),
                            backgroundColor: backgroundColors.slice(0, data.length),
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    usePointStyle: true,
                                    padding: 20,
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
                console.error('Error loading income sources chart:', error);
                const chartContainer = document.getElementById('income-sources-chart');
                chartContainer.innerHTML = '<p class="error-message">Failed to load income sources data</p>';
            }
        }
    
        // Delete Income
        document.addEventListener('click', function(e) {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const transactionID = deleteBtn.dataset.transactionId;
                if (confirm('Are you sure you want to delete this income?')) {
                    fetch(`/transactions/${transactionID}`, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        window.location.reload();
                    })
                    .catch(error => console.error('Error:', error));
                }
            }
        });