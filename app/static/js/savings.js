// Sample data - in a real app, this would come from your backend API
        // let goals = [
        //     {
        //         id: 1,
        //         name: "Emergency Fund",
        //         targetAmount: 100000,
        //         currentAmount: 45000,
        //         deadline: "2024-12-31",
        //         priority: "high",
        //         description: "For unexpected expenses",
        //         createdAt: "2023-01-15"
        //     },
        //     {
        //         id: 2,
        //         name: "Vacation to Bali",
        //         targetAmount: 150000,
        //         currentAmount: 75000,
        //         deadline: "2024-06-15",
        //         priority: "medium",
        //         description: "Dream vacation with family",
        //         createdAt: "2023-03-10"
        //     },
        //     {
        //         id: 3,
        //         name: "New Laptop",
        //         targetAmount: 80000,
        //         currentAmount: 80000,
        //         deadline: "2023-11-30",
        //         priority: "low",
        //         description: "MacBook Pro for work",
        //         createdAt: "2023-05-20",
        //         completed: true
        //     },
        //     {
        //         id: 4,
        //         name: "Car Down Payment",
        //         targetAmount: 200000,
        //         currentAmount: 50000,
        //         deadline: "2024-09-01",
        //         priority: "high",
        //         description: "For new electric car",
        //         createdAt: "2023-06-05"
        //     },
        //     {
        //         id: 5,
        //         name: "Wedding Savings",
        //         targetAmount: 500000,
        //         currentAmount: 100000,
        //         deadline: "2025-05-20",
        //         priority: "medium",
        //         description: "For wedding expenses",
        //         createdAt: "2023-02-28"
        //     }
        // ];
        
        // let transactions = [
        //     {
        //         id: 1,
        //         goalId: 1,
        //         amount: 10000,
        //         type: "deposit",
        //         date: "2023-07-01",
        //         notes: "Monthly savings"
        //     },
        //     {
        //         id: 2,
        //         goalId: 2,
        //         amount: 25000,
        //         type: "deposit",
        //         date: "2023-07-05",
        //         notes: "Bonus from work"
        //     },
        //     {
        //         id: 3,
        //         goalId: 3,
        //         amount: 80000,
        //         type: "deposit",
        //         date: "2023-07-10",
        //         notes: "Sold old laptop"
        //     },
        //     {
        //         id: 4,
        //         goalId: 4,
        //         amount: 20000,
        //         type: "deposit",
        //         date: "2023-07-15",
        //         notes: "Side project income"
        //     },
        //     {
        //         id: 5,
        //         goalId: 1,
        //         amount: 5000,
        //         type: "deposit",
        //         date: "2023-07-20",
        //         notes: "Extra savings"
        //     }
        // ];
        
        // DOM Elements
        const goalsContainer = document.getElementById('goals-container');
        const transactionsList = document.getElementById('transactions-list');
        const goalModal = document.getElementById('goal-modal');
        const depositModal = document.getElementById('deposit-modal');
        const goalForm = document.getElementById('goal-form');
        const depositForm = document.getElementById('deposit-form');
        const addGoalBtn = document.getElementById('add-goal-btn');
        const closeModalBtns = document.querySelectorAll('.modal-close');
        const cancelBtns = document.querySelectorAll('[id^="cancel-"]');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const goalSearch = document.getElementById('goal-search');
      
        // Current filter state
        let currentFilter = 'all';
        let currentSearch = '';
        let goals = [];
        let transactions = [];
        

        // Initialize the app
        async function init() {
            renderGoals();
            renderTransactions();
            updateStats();
            setupEventListeners();
            await fetchGoals();
            await fetchTransactions();
            updateStats();
            setupEventListeners();
        }
        // Fetch goals from backend
        async function fetchGoals() {
            try {
                const response = await fetch('/api/savings-goals');
                if (!response.ok) throw new Error('Failed to fetch goals');
                goals = await response.json();
                renderGoals();
            } catch (error) {
                console.error('Error fetching goals:', error);
                showToast('Failed to load goals', 'error');
            }
        }

        // Fetch transactions from backend
        async function fetchTransactions() {
            try {
                const response = await fetch('/api/savings-transactions'); // You'll need to create this endpoint
                if (!response.ok) throw new Error('Failed to fetch transactions');
                transactions = await response.json();
                renderTransactions();
            } catch (error) {
                console.error('Error fetching transactions:', error);
                showToast('Failed to load transactions', 'error');
            }
        }
                
        
        // Render goals based on current filter and search
        function renderGoals() {
            goalsContainer.innerHTML = '';
            
            const filteredGoals = goals.filter(goal => {
                // Apply filter
                if (currentFilter === 'active' && goal.completed) return false;
                if (currentFilter === 'completed' && !goal.completed) return false;
                if (currentFilter === 'high' && goal.priority !== 'high') return false;
                
                // Apply search
                if (currentSearch && !goal.name.toLowerCase().includes(currentSearch.toLowerCase())) {
                    return false;
                }
                
                return true;
            });
            
            if (filteredGoals.length === 0) {
                goalsContainer.innerHTML = `
                    <div class="no-goals" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                        <i class="fas fa-piggy-bank" style="font-size: 3rem; color: #adb5bd; margin-bottom: 1rem;"></i>
                        <h3>No goals found</h3>
                        <p>Create your first savings goal to get started!</p>
                    </div>`
                ;
                return;
            }
            
            filteredGoals.forEach(goal => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const daysLeft = calculateDaysLeft(goal.deadline);
                
                let daysLeftClass = '';
                let daysLeftText = '';
                
                if (goal.completed) {
                    daysLeftText = 'Completed';
                } else if (daysLeft <= 0) {
                    daysLeftText = 'Deadline passed';
                    daysLeftClass = 'danger';
                } else if (daysLeft <= 30) {
                    daysLeftText = `${daysLeft} days left`;
                    daysLeftClass = 'warning';
                } else {
                    daysLeftText = `${daysLeft} days left`;
                }
                
                const goalCard = document.createElement('div');
                goalCard.className = `goal-card ${goal.priority}-priority`;
                goalCard.innerHTML = `
                    <div class="goal-header">
                        <div class="goal-icon">
                            <i class="fas ${getGoalIcon(goal.name)}"></i>
                        </div>
                        <div class="goal-title">
                            <h3>${goal.name}</h3>
                            <p>${goal.description || 'No description'}</p>
                        </div>
                        <div class="goal-actions">
                            <button class="action-btn edit-goal" data-id="${goal.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-goal" data-id="${goal.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="goal-progress">
                        <div class="progress-info">
                            <span>₹${formatNumber(goal.currentAmount)} / ₹${formatNumber(goal.targetAmount)}</span>
                            <span>${Math.min(100, Math.round(progress))}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="goal-details">
                        <div class="detail-item">
                            <h4>Target</h4>
                            <p>₹${formatNumber(goal.targetAmount)}</p>
                        </div>
                        <div class="detail-item">
                            <h4>Saved</h4>
                            <p>₹${formatNumber(goal.currentAmount)}</p>
                        </div>
                        <div class="detail-item">
                            <h4>Remaining</h4>
                            <p>₹${formatNumber(goal.targetAmount - goal.currentAmount)}</p>
                        </div>
                    </div>
                    <div class="goal-footer">
                        <div class="days-left ${daysLeftClass}">${daysLeftText}</div>
                        <button class="deposit-btn" data-id="${goal.id}">
                            ${goal.completed ? 'Completed' : 'Add Money'}
                        </button>
                    </div>
                `;
                
                goalsContainer.appendChild(goalCard);
            });
            
            // Add event listeners to the newly created buttons
            document.querySelectorAll('.deposit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if (e.target.textContent !== 'Completed') {
                        openDepositModal(parseInt(e.target.dataset.id));
                    }
                });
            });
            
            document.querySelectorAll('.edit-goal').forEach(btn => {
                btn.addEventListener('click', () => {
                    openEditModal(parseInt(btn.dataset.id));
                });
            });
            
            document.querySelectorAll('.delete-goal').forEach(btn => {
                btn.addEventListener('click', () => {
                    deleteGoal(parseInt(btn.dataset.id));
                });
            });
        }
        
        // Render recent transactions
        function renderTransactions() {
            transactionsList.innerHTML = '';
            
            // Get the 5 most recent transactions
            const recentTransactions = [...transactions]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
            
            if (recentTransactions.length === 0) {
                transactionsList.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 2rem;">
                            <i class="fas fa-exchange-alt" style="font-size: 2rem; color: #adb5bd; margin-bottom: 1rem;"></i>
                            <p>No transactions yet</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            recentTransactions.forEach(transaction => {
                const goal = goals.find(g => g.id === transaction.goalId);
                const transactionRow = document.createElement('tr');
                
                transactionRow.innerHTML = `
                    <td>${formatDate(transaction.date)}</td>
                    <td class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'deposit' ? '+' : '-'}₹${formatNumber(transaction.amount)}
                    </td>
                    <td>
                        <div class="transaction-goal">
                            <div class="transaction-goal-icon ${goal?.priority}-priority">
                                <i class="fas ${getGoalIcon(goal?.name)}"></i>
                            </div>
                            ${goal?.name || 'Goal deleted'}
                        </div>
                    </td>
                    <td>${transaction.notes || '-'}</td>
                `;
                
                transactionsList.appendChild(transactionRow);
            });
        }
        
        // Update stats in the header
        function updateStats() {
            const totalGoals = goals.length;
            const completedGoals = goals.filter(goal => goal.completed).length;
            const activeGoals = totalGoals - completedGoals;
            
            const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
            const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
            const totalProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
            
            // Find the goal with the closest deadline
            const now = new Date();
            const upcomingGoals = goals
                .filter(goal => !goal.completed && new Date(goal.deadline) > now)
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
            
            const closestGoal = upcomingGoals[0];
            let closestGoalText = 'No active goals';
            let closestGoalClass = '';
            
            if (closestGoal) {
                const daysLeft = calculateDaysLeft(closestGoal.deadline);
                closestGoalText = `${closestGoal.name}`;
                closestGoalClass = daysLeft <= 30 ? 'warning' : '';
            }
            
            document.getElementById('total-goals').textContent = totalGoals;
            document.getElementById('total-saved').textContent = `₹${formatNumber(totalSaved)}`;
            
            // Update the stats card with closest deadline
            const closestGoalCard = document.querySelector('.savings-stats .stat-card:last-child p');
            const closestGoalProgress = document.querySelector('.savings-stats .stat-card:last-child .progress-text');
            
            if (closestGoal) {
                closestGoalCard.textContent = closestGoal.name;
                const daysLeft = calculateDaysLeft(closestGoal.deadline);
                closestGoalProgress.textContent = `${daysLeft} days left`;
                closestGoalProgress.className = `progress-text ${daysLeft <= 30 ? 'warning' : ''}`;
            } else {
                closestGoalCard.textContent = 'No active goals';
                closestGoalProgress.textContent = '';
            }
        }
        
        // Open modal to add a new goal
        function openAddModal() {
            document.getElementById('modal-title').textContent = 'Add New Savings Goal';
            document.getElementById('goal-id').value = '';
            document.getElementById('goal-name').value = '';
            document.getElementById('target-amount').value = '';
            document.getElementById('current-amount').value = '0';
            document.getElementById('deadline').value = '';
            document.getElementById('priority').value = '';
            document.getElementById('description').value = '';
            
            // Set default deadline to 3 months from now
            const defaultDeadline = new Date();
            defaultDeadline.setMonth(defaultDeadline.getMonth() + 3);
            document.getElementById('deadline').valueAsDate = defaultDeadline;
            
            goalModal.style.display = 'flex';
        }
        
        // Open modal to edit an existing goal
        function openEditModal(goalId) {
            const goal = goals.find(g => g.id === goalId);
            if (!goal) return;
            
            document.getElementById('modal-title').textContent = 'Edit Savings Goal';
            document.getElementById('goal-id').value = goal.id;
            document.getElementById('goal-name').value = goal.name;
            document.getElementById('target-amount').value = goal.targetAmount;
            document.getElementById('current-amount').value = goal.currentAmount;
            document.getElementById('deadline').value = goal.deadline;
            document.getElementById('priority').value = goal.priority;
            document.getElementById('description').value = goal.description || '';
            
            goalModal.style.display = 'flex';
        }
        
        // Open modal to add a deposit/withdrawal
        function openDepositModal(goalId) {
            const goal = goals.find(g => g.id === goalId);
            if (!goal) return;
            
            document.getElementById('deposit-goal-id').value = goal.id;
            document.getElementById('transaction-type').value = 'deposit';
            document.getElementById('transaction-amount').value = '';
            document.getElementById('transaction-date').valueAsDate = new Date();
            document.getElementById('transaction-notes').value = '';
            
            depositModal.style.display = 'flex';
        }
        
        // Close all modals
        function closeModals() {
            goalModal.style.display = 'none';
            depositModal.style.display = 'none';
        }
        
     // Save a new or updated goal
    async function saveGoal(e) {
        e.preventDefault();
        
        const goalId = document.getElementById('goal-id').value;
        const formData = {
            name: document.getElementById('goal-name').value,
            targetAmount: parseFloat(document.getElementById('target-amount').value),
            currentAmount: parseFloat(document.getElementById('current-amount').value) || 0,
            deadline: document.getElementById('deadline').value,
            priority: document.getElementById('priority').value,
            description: document.getElementById('description').value
        };

        try {
            const url = goalId ? `/api/savings-goals/${goalId}` : '/api/savings-goals';
            const method = goalId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save goal');
            }

            const result = await response.json();
            showToast(result.message, 'success');
            closeModals();
            await fetchGoals();
            updateStats();
            
            if (result.goal.completed) {
                showConfetti();
            }
        } catch (error) {
            console.error('Error saving goal:', error);
            showToast(error.message || 'Failed to save goal', 'error');
        }
    }
        
        // Save a deposit/withdrawal transaction
       
        // Save a transaction
        async function saveTransaction(e) {
            e.preventDefault();
            
            const goalId = parseInt(document.getElementById('deposit-goal-id').value);
            const formData = {
                amount: parseFloat(document.getElementById('transaction-amount').value),
                type: document.getElementById('transaction-type').value,
                date: document.getElementById('transaction-date').value,
                notes: document.getElementById('transaction-notes').value
            };

            try {
                const response = await fetch(`/api/savings-goals/${goalId}/transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to save transaction');
                }

                const result = await response.json();
                showToast(result.message, 'success');
                closeModals();
                await fetchGoals();
                await fetchTransactions();
                updateStats();
                
                // Check if goal was completed
                const goal = goals.find(g => g.id === goalId);
                if (goal && goal.completed) {
                    showConfetti();
                }
            } catch (error) {
                console.error('Error saving transaction:', error);
                showToast(error.message || 'Failed to save transaction', 'error');
            }
        }
        
        // Delete a goal
        async function deleteGoal(goalId) {
            if (!confirm('Are you sure you want to delete this goal?')) return;

            try {
                const response = await fetch(`/api/savings-goals/${goalId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete goal');
                }

                const result = await response.json();
                showToast(result.message, 'success');
                await fetchGoals();
                await fetchTransactions();
                updateStats();
            } catch (error) {
                console.error('Error deleting goal:', error);
                showToast(error.message || 'Failed to delete goal', 'error');
            }
        }
        function showToast(message, type = 'success') {
            // Implement a toast notification system or use alert for now
            alert(`${type.toUpperCase()}: ${message}`);
        }
        
        // Show confetti animation
        function showConfetti() {
            const colors = ['#4361ee', '#3f37c9', '#4895ef', '#4cc9f0', '#f72585', '#b5179e', '#7209b7'];
            
            for (let i = 0; i < 100; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = `${Math.random() * 100}vw`;
                confetti.style.width = `${Math.random() * 10 + 5}px`;
                confetti.style.height = `${Math.random() * 10 + 5}px`;
                confetti.style.animationDelay = `${Math.random() * 0.5}s`;
                
                document.body.appendChild(confetti);
                
                // Remove confetti after animation completes
                setTimeout(() => {
                    confetti.remove();
                }, 3000);
            }
        }
        
        // Helper functions
        function formatNumber(num) {
            return num.toLocaleString('en-IN');
        }
        
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        
        function calculateDaysLeft(deadline) {
            const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            const today = new Date();
            const deadlineDate = new Date(deadline);
            
            // Reset time parts to compare only dates
            today.setHours(0, 0, 0, 0);
            deadlineDate.setHours(0, 0, 0, 0);
            
            return Math.round((deadlineDate - today) / oneDay);
        }
        
        function getGoalIcon(goalName) {
            if (!goalName) return 'fa-bullseye';
            
            const name = goalName.toLowerCase();
            
            if (name.includes('emergency')) return 'fa-first-aid';
            if (name.includes('vacation') || name.includes('holiday') || name.includes('trip')) return 'fa-umbrella-beach';
            if (name.includes('car') || name.includes('vehicle')) return 'fa-car';
            if (name.includes('house') || name.includes('home')) return 'fa-home';
            if (name.includes('wedding')) return 'fa-ring';
            if (name.includes('education') || name.includes('school') || name.includes('college')) return 'fa-graduation-cap';
            if (name.includes('retirement')) return 'fa-piggy-bank';
            if (name.includes('laptop') || name.includes('computer') || name.includes('phone')) return 'fa-laptop';
            
            return 'fa-bullseye';
        }
        
        // Set up event listeners
        function setupEventListeners() {
            // Modal buttons
            addGoalBtn.addEventListener('click', openAddModal);
            
            closeModalBtns.forEach(btn => {
                btn.addEventListener('click', closeModals);
            });
            
            cancelBtns.forEach(btn => {
                btn.addEventListener('click', closeModals);
            });
            
            // Forms
            goalForm.addEventListener('submit', saveGoal);
            depositForm.addEventListener('submit', saveTransaction);
            
            // Filter buttons
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentFilter = btn.dataset.filter;
                    renderGoals();
                });
            });
            
            // Search input
            goalSearch.addEventListener('input', (e) => {
                currentSearch = e.target.value;
                renderGoals();
            });
            
            // View all transactions button
            document.getElementById('view-all-transactions').addEventListener('click', () => {
                alert('In a real app, this would show all transactions in a separate view or modal.');
            });
            
            // Close modals when clicking outside
            window.addEventListener('click', (e) => {
                if (e.target === goalModal || e.target === depositModal) {
                    closeModals();
                }
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
        }
        
        // Initialize the app
        document.addEventListener('DOMContentLoaded', init);