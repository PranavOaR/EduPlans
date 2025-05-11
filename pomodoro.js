let timeLeft;
let totalTime;
let timerId = null;
let isWorkSession = true;
let sessionCount = 1;
let longBreakInterval = 4; // After how many sessions a long break occurs
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// Override main.js navigation behavior
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        // User is not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // Remove the click event listeners that were added by main.js
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        // Clone and replace each navigation link to remove event listeners
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });
    
    // Initialize Pomodoro application
    initPomodoro();
});

// DOM elements
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');
const workTimeInput = document.getElementById('workTime');
const breakTimeInput = document.getElementById('breakTime');
const longBreakTimeInput = document.getElementById('longBreakTime');
const sessionType = document.getElementById('session-type');
const sessionCountDisplay = document.getElementById('session-count');
const progressRing = document.querySelector('.progress-ring-circle');
const todoInput = document.getElementById('todo-input');
const addTodoButton = document.getElementById('add-todo');
const todoList = document.getElementById('todo-list');
const tasksCompletedCounter = document.getElementById('tasks-completed');
const tasksTotalCounter = document.getElementById('tasks-total');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');

let progressRingCircumference;

// Calculate the circumference based on the viewport width
function calculateCircumference() {
    if (window.innerWidth <= 768) {
        // Mobile view - r = 90
        progressRingCircumference = 2 * Math.PI * 90;
    } else {
        // Desktop view - r = 110
        progressRingCircumference = 2 * Math.PI * 110;
    }
    
    // Set the circle's dash array
    progressRing.style.strokeDasharray = `${progressRingCircumference}`;
    progressRing.style.strokeDashoffset = `${progressRingCircumference}`;
}

// Initial calculation
calculateCircumference();

// Recalculate on resize
window.addEventListener('resize', calculateCircumference);

// Timer functions
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    
    // Update the progress ring
    if (totalTime > 0) { // Prevent division by zero
        // Recalculate circumference in case window was resized
        calculateCircumference();
        
        const progress = 1 - (timeLeft / totalTime);
        const dashoffset = progressRingCircumference * (1 - progress);
        progressRing.style.strokeDashoffset = dashoffset;
    }
}

function startTimer() {
    if (timerId === null) {
        if (!timeLeft) {
            timeLeft = parseInt(workTimeInput.value) * 60;
            totalTime = timeLeft;
        }
        timerId = setInterval(() => {
            timeLeft--;
            // Check if time has reached 0
            if (timeLeft <= 0) {
                timeLeft = 0;
                updateDisplay();
                clearInterval(timerId);
                timerId = null;
                playNotificationSound();
                showNotification();
                switchSession();
                return;
            }
            updateDisplay();
        }, 1000);
        startButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
        document.querySelector('.timer-display').classList.add('timer-active');
    }
}

function pauseTimer() {
    clearInterval(timerId);
    timerId = null;
    startButton.style.display = 'inline-block';
    pauseButton.style.display = 'none';
    document.querySelector('.timer-display').classList.remove('timer-active');
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    isWorkSession = true;
    sessionCount = 1;
    timeLeft = parseInt(workTimeInput.value) * 60;
    totalTime = timeLeft;
    updateDisplay();
    startButton.style.display = 'inline-block';
    pauseButton.style.display = 'none';
    sessionType.textContent = 'Work Session';
    sessionCountDisplay.textContent = `Session #${sessionCount} of ${longBreakInterval}`;
    document.querySelector('.timer-display').classList.remove('timer-active');
}

function switchSession() {
    if (isWorkSession) {
        // Check if it's time for a long break
        if (sessionCount % longBreakInterval === 0) {
            timeLeft = parseInt(longBreakTimeInput.value) * 60;
            sessionType.textContent = 'Long Break!';
            notificationMessage.textContent = 'Long break time! Take a good rest.';
        } else {
            timeLeft = parseInt(breakTimeInput.value) * 60;
            sessionType.textContent = 'Break Time!';
            notificationMessage.textContent = 'Break time! Take a short rest.';
        }
        isWorkSession = false;
    } else {
        timeLeft = parseInt(workTimeInput.value) * 60;
        sessionCount++;
        sessionType.textContent = 'Work Session';
        sessionCountDisplay.textContent = `Session #${sessionCount} of ${longBreakInterval}`;
        notificationMessage.textContent = 'Work session started! Stay focused.';
        isWorkSession = true;
    }
    totalTime = timeLeft;
    updateDisplay();
    startTimer();
}

function showNotification() {
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function playNotificationSound() {
    const audio = new Audio('https://raw.githubusercontent.com/freeCodeCamp/cdn/master/build/testable-projects-fcc/audio/BeepSound.wav');
    audio.play().catch(error => console.log('Audio play error:', error));
}

// Timer number input controls
function setupNumberInputControls() {
    const numberInputs = document.querySelectorAll('.number-input');
    
    numberInputs.forEach(container => {
        const input = container.querySelector('input');
        const increment = container.querySelector('.increment');
        const decrement = container.querySelector('.decrement');
        
        increment.addEventListener('click', () => {
            const currentValue = parseInt(input.value);
            const max = parseInt(input.getAttribute('max'));
            if (currentValue < max) {
                input.value = currentValue + 1;
                
                // Reset timer if it's not running
                if (timerId === null && !isWorkSession) {
                    resetTimer();
                }
            }
        });
        
        decrement.addEventListener('click', () => {
            const currentValue = parseInt(input.value);
            const min = parseInt(input.getAttribute('min'));
            if (currentValue > min) {
                input.value = currentValue - 1;
                
                // Reset timer if it's not running
                if (timerId === null && !isWorkSession) {
                    resetTimer();
                }
            }
        });
    });
}

// Todo list functions
function renderTodos() {
    todoList.innerHTML = '';
    let completedCount = 0;
    
    todos.forEach((todo, index) => {
        const todoItem = document.createElement('div');
        todoItem.classList.add('todo-item');
        if (todo.completed) {
            todoItem.classList.add('completed');
            completedCount++;
        }
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('todo-checkbox');
        checkbox.checked = todo.completed;
        
        const todoText = document.createElement('span');
        todoText.classList.add('todo-text');
        todoText.textContent = todo.text;
        if (todo.completed) {
            todoText.classList.add('completed');
        }
        
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('todo-delete');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        
        todoItem.appendChild(checkbox);
        todoItem.appendChild(todoText);
        todoItem.appendChild(deleteButton);
        
        todoList.appendChild(todoItem);
        
        // Make the text area also toggle the todo completion
        todoText.addEventListener('click', () => {
            toggleTodoComplete(index);
        });
        
        // Event listeners for todo items
        checkbox.addEventListener('change', () => {
            toggleTodoComplete(index);
        });
        
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent toggling when clicking delete
            deleteTodo(index);
        });
        
        // Optional: Make entire todo item clickable except for delete button
        todoItem.addEventListener('click', (e) => {
            // Only toggle if not clicking checkbox or delete button
            if (e.target !== checkbox && e.target !== deleteButton && !deleteButton.contains(e.target)) {
                toggleTodoComplete(index);
            }
        });
    });
    
    // Update counter
    tasksCompletedCounter.textContent = completedCount;
    tasksTotalCounter.textContent = todos.length;
}

function addTodo() {
    const text = todoInput.value.trim();
    if (text) {
        todos.push({ text, completed: false });
        saveTodos();
        todoInput.value = '';
        renderTodos();
    }
}

function toggleTodoComplete(index) {
    todos[index].completed = !todos[index].completed;
    saveTodos();
    renderTodos();
}

function deleteTodo(index) {
    todos.splice(index, 1);
    saveTodos();
    renderTodos();
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Create particles for background effect
function createParticles() {
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

// Initial Setup
function initPomodoro() {
    pauseButton.style.display = 'none';
    timeLeft = parseInt(workTimeInput.value) * 60;
    totalTime = timeLeft;
    updateDisplay();
    setupNumberInputControls();
    renderTodos();
    sessionCountDisplay.textContent = `Session #${sessionCount} of ${longBreakInterval}`;
    createParticles();
    
    // Add event listeners
    startButton.addEventListener('click', startTimer);
    pauseButton.addEventListener('click', pauseTimer);
    resetButton.addEventListener('click', resetTimer);
    addTodoButton.addEventListener('click', addTodo);
    
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
}