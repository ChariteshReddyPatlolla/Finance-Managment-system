// Store chart instances globally
        let incomeExpenseChart, categoryChart, netWorthChart, cashFlowChart;
    
        async function updateCharts() {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            
            if (!startDate || !endDate) return;
            
            try {
                // Show loading state
                document.querySelectorAll('.chart-container').forEach(c => {
                    c.style.opacity = '0.5';
                    c.style.pointerEvents = 'none';
                });
                
                // Fetch new data
                const response = await fetch(`/api/reports/data?start_date=${startDate}&end_date=${endDate}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                
                console.log("Fetched data:", data); // Debugging
                
                // Update all charts
                updateAllChartData(data);
                
                // Update summary cards
                updateSummaryCards(data);
                
            } catch (error) {
                console.error('Error updating charts:', error);
                showErrorToast("Failed to update charts. Please try again.");
            } finally {
                document.querySelectorAll('.chart-container').forEach(c => {
                    c.style.opacity = '1';
                    c.style.pointerEvents = 'auto';
                });
            }
        }
    
        function updateAllChartData(data) {
            // 1. Income vs Expenses Chart
            if (incomeExpenseChart) {
                incomeExpenseChart.data.labels = data.monthly_data.labels;
                incomeExpenseChart.data.datasets[0].data = data.monthly_data.income;
                incomeExpenseChart.data.datasets[1].data = data.monthly_data.expenses;
                incomeExpenseChart.update();
            }
            
            // 2. Category Spending Chart
            if (categoryChart) {
                categoryChart.data.labels = data.category_data.labels;
                categoryChart.data.datasets[0].data = data.category_data.amounts;
                categoryChart.data.datasets[0].backgroundColor = data.category_data.colors;
                categoryChart.update();
            }
            
            // 3. Net Worth Chart
            if (netWorthChart) {
                netWorthChart.data.labels = data.net_worth_data.labels;
                netWorthChart.data.datasets[0].data = data.net_worth_data.values;
                netWorthChart.update();
            }
            
            // 4. Cash Flow Chart
            if (cashFlowChart) {
                cashFlowChart.data.labels = data.cash_flow_data.labels;
                cashFlowChart.data.datasets[0].data = data.cash_flow_data.income;
                cashFlowChart.data.datasets[1].data = data.cash_flow_data.expenses;
                cashFlowChart.update();
            }
        }
    
        function updateSummaryCards(data) {
            // Update summary cards with new data
            document.querySelector('.card:nth-child(1) .value').textContent = `₹${data.totals.income.toLocaleString()}`;
            document.querySelector('.card:nth-child(2) .value').textContent = `₹${data.totals.expenses.toLocaleString()}`;
            document.querySelector('.card:nth-child(3) .value').textContent = `₹${data.totals.savings.toLocaleString()}`;
            
            // Calculate percentage changes (simplified example)
            const savingsChange = document.querySelector('.card:nth-child(3) .change');
            const netWorthChange = document.querySelector('.card:nth-child(4) .change');
            
            if (data.totals.savings > 0) {
                savingsChange.innerHTML = '<span>↑ 8%</span> <span>vs last month</span>';
                savingsChange.className = 'change positive';
            } else {
                savingsChange.innerHTML = '<span>↓ 5%</span> <span>vs last month</span>';
                savingsChange.className = 'change negative';
            }
            
            if (data.net_worth_data.values.length > 1) {
                const current = data.net_worth_data.values.slice(-1)[0];
                const previous = data.net_worth_data.values.slice(-2)[0];
                const change = ((current - previous) / previous * 100).toFixed(1);
                
                if (change >= 0) {
                    netWorthChange.innerHTML = `<span>↑ ${change}%</span> <span>vs last period</span>`;
                    netWorthChange.className = 'change positive';
                } else {
                    netWorthChange.innerHTML = `<span>↓ ${Math.abs(change)}%</span> <span>vs last period</span>`;
                    netWorthChange.className = 'change negative';
                }
            }
        }
    
        function showErrorToast(message) {
            // Simple toast notification
            const toast = document.createElement('div');
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            toast.style.backgroundColor = '#ef233c';
            toast.style.color = 'white';
            toast.style.padding = '12px 24px';
            toast.style.borderRadius = '4px';
            toast.style.zIndex = '1000';
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 5000);
        }
    
        // Initialize all charts when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            try {
                // Parse the JSON data from Flask
                const monthlyData = JSON.parse('{{ monthly_data | safe }}');
                const categoryData = JSON.parse('{{ category_data | safe }}');
                const netWorthData = JSON.parse('{{ net_worth_data | safe }}');
                const cashFlowData = JSON.parse('{{ cash_flow_data | safe }}');
    
                console.log("Initial chart data:", {
                    monthlyData,
                    categoryData,
                    netWorthData,
                    cashFlowData
                });

                const commonChartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 10,
                            right: 15,
                            bottom: 20,
                            left: 15
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                padding: 20,
                                boxWidth: 12,
                                usePointStyle: true
                            }
                        }
                    }
                };
                    
                // 1. Income vs Expenses Chart
                const incomeExpenseCtx = document.getElementById('incomeExpenseChart')?.getContext('2d');
                if (incomeExpenseCtx) {
                    incomeExpenseChart = new Chart(incomeExpenseCtx, {
                        type: 'bar',
                        data: {
                            labels: monthlyData.labels,
                            datasets: [
                                {
                                    label: 'Income',
                                    data: monthlyData.income,
                                    backgroundColor: '#4cc9f0',
                                    borderRadius: 6
                                },
                                {
                                    label: 'Expenses',
                                    data: monthlyData.expenses,
                                    backgroundColor: '#f72585',
                                    borderRadius: 6
                                }
                            ]
                        },
                        options: {
                            commonChartOptions,
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false,
                                },
                                zoom: {
                                    zoom: {
                                        wheel: {
                                            enabled: true,
                                        },
                                        pinch: {
                                            enabled: true
                                        },
                                        mode: 'xy',
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    grid: {
                                        display: false
                                    },
                                    ticks: {
                                        maxRotation: 45,
                                        minRotation: 45,
                                        padding: 10,
                                        autoSkip: true,
                                        maxTicksLimit: 12
                                    }
                                },
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        borderDash: [5, 5]
                                    },
                                    ticks: {
                                        padding: 10,
                                        callback: function(value) {
                                            return '₹' + value.toLocaleString();
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
    
                // 2. Category Spending Chart
                const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
                if (categoryCtx) {
                    categoryChart = new Chart(categoryCtx, {
                        type: 'doughnut',
                        data: {
                            labels: categoryData.labels,
                            datasets: [{
                                data: categoryData.amounts,
                                backgroundColor: categoryData.colors,
                                borderWidth: 0
                            }]
                        },
                        options: {
                            commonChartOptions,
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'right',
                                    align: 'center',
                                    labels: {
                                        padding: 10,
                                        boxWidth: 12,
                                        font: {
                                            size: 12
                                        }}
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = context.raw || 0;
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = Math.round((value / total) * 100);
                                            return `${label}: ₹${value} (${percentage}%)`;
                                        }
                                    }
                                }
                            },
                            cutout: '70%'
                        }

                    });
                }
    
                // 3. Net Worth Chart
                const netWorthCtx = document.getElementById('netWorthChart')?.getContext('2d');
                if (netWorthCtx) {
                    netWorthChart = new Chart(netWorthCtx, {
                        type: 'line',
                        data: {
                            labels: netWorthData.labels,
                            datasets: [{
                                label: 'Net Worth',
                                data: netWorthData.values,
                                borderColor: '#4361ee',
                                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                                borderWidth: 3,
                                fill: true,
                                tension: 0.3
                            }]
                        },
                        options: {
                            commonChartOptions,
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return `Net Worth: ₹${context.raw.toLocaleString()}`;
                                        }
                                    }
                                },
                                zoom: {
                                    zoom: {
                                        wheel: {
                                            enabled: true,
                                        },
                                        pinch: {
                                            enabled: true
                                        },
                                        mode: 'xy',
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    grid: {
                                        display: false
                                    }
                                },
                                y: {
                                    beginAtZero: false,
                                    grid: {
                                        borderDash: [5, 5]
                                    },
                                    ticks: {
                                        callback: function(value) {
                                            return '₹' + value.toLocaleString();
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
    
                // 4. Cash Flow Chart
                const cashFlowCtx = document.getElementById('cashFlowChart')?.getContext('2d');
                if (cashFlowCtx) {
                    cashFlowChart = new Chart(cashFlowCtx, {
                        type: 'bar',
                        data: {
                            labels: cashFlowData.labels,
                            datasets: [
                                {
                                    label: 'Income',
                                    data: cashFlowData.income,
                                    backgroundColor: '#4cc9f0',
                                    borderRadius: 6
                                },
                                {
                                    label: 'Expenses',
                                    data: cashFlowData.expenses,
                                    backgroundColor: '#f72585',
                                    borderRadius: 6
                                }
                            ]
                        },
                        options: {
                            commonChartOptions,
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false,
                                }
                            },
                            scales: {
                                x: {
                                    grid: {
                                        display: false
                                    },
                                    ticks: {
                                        padding: 10
                                    }
                                },
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        borderDash: [5, 5]
                                    }
                                }
                            }
                        }
                    });
                }
    
                // Set default date range (last 3 months)
                const end = new Date();
                const start = new Date();
                start.setMonth(end.getMonth() - 3);
                
                document.getElementById('start-date').valueAsDate = start;
                document.getElementById('end-date').valueAsDate = end;
                
                // Add event listeners
                document.getElementById('start-date').addEventListener('change', updateCharts);
                document.getElementById('end-date').addEventListener('change', updateCharts);
                
                // Also update when filter buttons are clicked
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        // Calculate dates based on filter
                        const end = new Date();
                        const start = new Date();
                        
                        if (this.textContent === 'This Month') {
                            start.setDate(1);
                        } else if (this.textContent === 'Last Quarter') {
                            start.setMonth(end.getMonth() - 3);
                        } else if (this.textContent === 'This Year') {
                            start.setMonth(0);
                            start.setDate(1);
                        }
                        
                        document.getElementById('start-date').valueAsDate = start;
                        document.getElementById('end-date').valueAsDate = end;
                        
                        updateCharts();
                    });
                });
    
            } catch (error) {
                console.error("Error initializing charts:", error);
                showErrorToast("Failed to initialize charts. Please check console for details.");
            }
        });