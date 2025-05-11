document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        // User is not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }

    const taskForm = document.getElementById('task-form');
    const tasksList = document.getElementById('tasks-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('task-search');
    const emptyState = document.getElementById('empty-state');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    // Stats counters
    const totalCount = document.getElementById('total-count');
    const pendingCount = document.getElementById('pending-count');
    const completedCount = document.getElementById('completed-count');

    // Override main.js navigation behavior
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        // Clone and replace each navigation link to remove event listeners
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });

    // Load tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Create particles effect for animations
    function createParticles(x, y, color = '#2ecc71') {
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Make particles use the theme color
            particle.style.background = color;
            
            const angle = (i / 8) * 360;
            const velocity = 60 + Math.random() * 40;
            const tx = Math.cos(angle * Math.PI / 180) * velocity;
            const ty = Math.sin(angle * Math.PI / 180) * velocity;
            
            particle.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                background: ${color};
                width: 8px;
                height: 8px;
                --tx: ${tx}px;
                --ty: ${ty}px;
            `;
            
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 800);
        }
    }

    // Create background particles
    function createBackgroundParticles() {
        const container = document.querySelector('.particle-system');
        if (!container) return;
        
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 3 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            particle.style.left = `${Math.random() * 100}vw`;
            particle.style.top = `${Math.random() * 100}vh`;
            
            const tx = (Math.random() - 0.5) * 300;
            const ty = (Math.random() - 0.5) * 300;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            const duration = Math.random() * 4 + 3;
            const delay = Math.random() * 2;
            particle.style.animation = `particle ${duration}s ${delay}s infinite`;
            
            container.appendChild(particle);
        }
    }

    // Show notification
    function showNotification(message) {
        notificationMessage.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Update task statistics
    function updateTaskStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        
        totalCount.textContent = totalTasks;
        pendingCount.textContent = pendingTasks;
        completedCount.textContent = completedTasks;
        
        // Show or hide empty state
        if (totalTasks === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }

    // Render tasks list
    function renderTasks(filterType = 'all', searchQuery = '') {
        tasksList.innerHTML = '';
        
        // Apply filters
        let filteredTasks = filterType === 'all' 
            ? tasks
            : tasks.filter(task => 
                filterType === 'completed' ? task.completed : !task.completed
            );
            
        // Apply search if query exists
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(query) || 
                task.description.toLowerCase().includes(query)
            );
        }

        if (filteredTasks.length === 0) {
            // Show empty state with custom message based on filter
            emptyState.style.display = 'block';
            if (searchQuery) {
                emptyState.querySelector('p').textContent = `No tasks found matching "${searchQuery}".`;
            } else if (filterType === 'completed') {
                emptyState.querySelector('p').textContent = 'No completed tasks found.';
            } else if (filterType === 'pending') {
                emptyState.querySelector('p').textContent = 'No pending tasks found.';
            } else {
                emptyState.querySelector('p').textContent = 'No tasks found. Add a new task to get started!';
            }
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Sort tasks by due date (closest first)
        filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            // Format due date
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            let dueDateText = task.dueDate;
            let dueDateClass = '';
            
            // Check if due date is today, tomorrow, or overdue
            if (dueDate.toDateString() === today.toDateString()) {
                dueDateText = 'Today';
                dueDateClass = 'today';
            } else if (dueDate.toDateString() === tomorrow.toDateString()) {
                dueDateText = 'Tomorrow';
                dueDateClass = 'tomorrow';
            } else if (dueDate < today) {
                dueDateClass = 'overdue';
            }
            
            // Format date for display
            const formattedDate = dueDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            taskElement.innerHTML = `
                <div class="task-content">
                    <h3>${task.title}</h3>
                    <p>${task.description}</p>
                    <div class="task-meta">
                        <span class="task-subject">${task.subject}</span>
                        <span class="priority ${task.priority}">${task.priority}</span>
                        <span class="due-date ${dueDateClass}">
                            <i class="fas fa-calendar-alt"></i> 
                            ${dueDateText === 'Today' || dueDateText === 'Tomorrow' ? dueDateText : formattedDate}
                        </span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" data-id="${task.id}" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="complete-btn" data-id="${task.id}" title="${task.completed ? 'Mark as Pending' : 'Mark as Completed'}">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="delete-btn" data-id="${task.id}" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            tasksList.appendChild(taskElement);
        });
    }

    // Event handler for form submission (add new task)
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('task-title').value.trim();
        const subject = document.getElementById('task-subject').value;
        const dueDate = document.getElementById('task-due-date').value;
        const priority = document.getElementById('task-priority').value;
        const description = document.getElementById('task-description').value.trim();
        
        if (!title || !subject || !dueDate || !priority) {
            showNotification('Please fill in all required fields.');
            return;
        }
        
        const task = {
            id: Date.now(),
            title,
            subject,
            description,
            dueDate,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        taskForm.reset();
        
        // Show a success notification
        showNotification('Task added successfully!');
        
        // Update stats and render tasks
        updateTaskStats();
        renderTasks(document.querySelector('.filter-btn.active').dataset.filter, searchInput.value);
    });

    // Event delegation for task actions (complete, delete, edit)
    tasksList.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const taskId = parseInt(btn.dataset.id);
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) return;
        
        const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
        const searchQuery = searchInput.value;
        
        // Get position for particle effect
        const rect = btn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        if (btn.classList.contains('complete-btn')) {
            const taskElement = btn.closest('.task-item');
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            
            if (tasks[taskIndex].completed) {
                // Show completion animation
                createParticles(x, y, '#2ecc71');
                taskElement.style.animation = 'completeTask 0.5s ease forwards';
                showNotification('Task marked as completed!');
            } else {
                showNotification('Task marked as pending');
            }
            
            localStorage.setItem('tasks', JSON.stringify(tasks));
            updateTaskStats();
            
            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 600));
            renderTasks(currentFilter, searchQuery);
            
        } else if (btn.classList.contains('delete-btn')) {
            // Show delete animation
            createParticles(x, y, '#ff4444');
            const taskElement = btn.closest('.task-item');
            taskElement.style.animation = 'slideOut 0.5s ease forwards';
            
            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Remove the task
            tasks.splice(taskIndex, 1);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            updateTaskStats();
            renderTasks(currentFilter, searchQuery);
            showNotification('Task deleted successfully');
            
        } else if (btn.classList.contains('edit-btn')) {
            // Functionality for editing tasks would go here
            // This is a placeholder for future implementation
            alert('Edit functionality coming soon!');
        }
    });

    // Filter buttons event listeners
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks(btn.dataset.filter, searchInput.value);
        });
    });
    
    // Search input event listener
    searchInput.addEventListener('input', () => {
        const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
        renderTasks(currentFilter, searchInput.value);
    });

    // Initialize
    createBackgroundParticles();
    updateTaskStats();
    renderTasks();
});