document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const tasksList = document.getElementById('tasks-list');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function createParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const angle = (i / 8) * 360;
            const velocity = 100;
            const tx = Math.cos(angle * Math.PI / 180) * velocity;
            const ty = Math.sin(angle * Math.PI / 180) * velocity;
            
            particle.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                width: 8px;
                height: 8px;
                --tx: ${tx}px;
                --ty: ${ty}px;
            `;
            
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 800);
        }
    }

    function renderTasks(filterType = 'all') {
        tasksList.innerHTML = '';
        const filteredTasks = filterType === 'all' 
            ? tasks
            : tasks.filter(task => 
                filterType === 'completed' ? task.completed : !task.completed
            );

        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskElement.innerHTML = `
                <div class="task-content">
                    <h3>${task.title}</h3>
                    <p>${task.description}</p>
                    <span class="due-date">Due: ${task.dueDate}</span>
                    <span class="priority ${task.priority}">${task.priority}</span>
                </div>
                <div class="task-actions">
                    <button class="complete-btn" data-id="${task.id}">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="delete-btn" data-id="${task.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            tasksList.appendChild(taskElement);
        });
    }

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const task = {
            id: Date.now(),
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            dueDate: document.getElementById('task-due-date').value,
            priority: document.getElementById('task-priority').value,
            completed: false
        };

        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        taskForm.reset();
        renderTasks();
    });

    tasksList.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const taskId = parseInt(btn.dataset.id);
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;

        if (btn.classList.contains('complete-btn')) {
            const taskElement = btn.closest('.task-item');
            
            if (!tasks[taskIndex].completed) {
                const rect = btn.getBoundingClientRect();
                createParticles(rect.left, rect.top);
                
                if (currentFilter === 'pending') {
                    taskElement.style.animation = 'slideOut 0.5s ease forwards';
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks(currentFilter);
        } else if (btn.classList.contains('delete-btn')) {
            tasks.splice(taskIndex, 1);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks(currentFilter);
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks(btn.dataset.filter);
        });
    });

    renderTasks();
});