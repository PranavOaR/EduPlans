let timeLeft;
let timerId = null;
let isWorkSession = true;
let sessionCount = 1;

const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');
const workTimeInput = document.getElementById('workTime');
const breakTimeInput = document.getElementById('breakTime');
const sessionType = document.getElementById('session-type');
const sessionCountDisplay = document.getElementById('session-count');

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
}

function startTimer() {
    if (timerId === null) {
        if (!timeLeft) {
            timeLeft = workTimeInput.value * 60;
        }
        timerId = setInterval(() => {
            timeLeft--;
            updateDisplay();
            if (timeLeft === 0) {
                clearInterval(timerId);
                timerId = null;
                switchSession();
            }
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
    timeLeft = workTimeInput.value * 60;
    updateDisplay();
    startButton.style.display = 'inline-block';
    pauseButton.style.display = 'none';
    sessionType.textContent = 'Work Session';
    sessionCountDisplay.textContent = `Session #${sessionCount}`;
    document.querySelector('.timer-display').classList.remove('timer-active');
}

function switchSession() {
    if (isWorkSession) {
        timeLeft = breakTimeInput.value * 60;
        sessionType.textContent = 'Break Time!';
        isWorkSession = false;
    } else {
        timeLeft = workTimeInput.value * 60;
        sessionCount++;
        sessionType.textContent = 'Work Session';
        sessionCountDisplay.textContent = `Session #${sessionCount}`;
        isWorkSession = true;
    }
    updateDisplay();
    startTimer();
}

// Event Listeners
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);

// Initial Setup
pauseButton.style.display = 'none';
timeLeft = workTimeInput.value * 60;
updateDisplay();