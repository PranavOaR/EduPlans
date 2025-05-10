document.addEventListener('DOMContentLoaded', () => {
    const calendar = {
        currentDate: new Date(),
        selectedDate: null,
        events: JSON.parse(localStorage.getItem('calendarEvents')) || []
    };

    // Add this function to save events
    function saveEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(calendar.events));
    }

    function renderCalendar() {
        const daysContainer = document.getElementById('calendarDays');
        const firstDay = new Date(calendar.currentDate.getFullYear(), calendar.currentDate.getMonth(), 1);
        const lastDay = new Date(calendar.currentDate.getFullYear(), calendar.currentDate.getMonth() + 1, 0);
        
        daysContainer.innerHTML = '';

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            daysContainer.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.innerHTML = `${day}`;

            // Check if it's today
            const today = new Date();
            if (day === today.getDate() && 
                calendar.currentDate.getMonth() === today.getMonth() && 
                calendar.currentDate.getFullYear() === today.getFullYear()) {
                dayElement.classList.add('current');
            }

            // Check if day has events
            const hasEvents = calendar.events.some(event => {
                const eventDate = new Date(event.date);
                return eventDate.getDate() === day && 
                       eventDate.getMonth() === calendar.currentDate.getMonth() &&
                       eventDate.getFullYear() === calendar.currentDate.getFullYear();
            });

            if (hasEvents) {
                const dot = document.createElement('div');
                dot.className = 'event-dot';
                dayElement.appendChild(dot);
            }

            // Add click event
            dayElement.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayElement.classList.add('selected');
                calendar.selectedDate = new Date(calendar.currentDate.getFullYear(), calendar.currentDate.getMonth(), day);
                openModal();
            });

            daysContainer.appendChild(dayElement);
        }

        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('monthDisplay').textContent = 
            `${monthNames[calendar.currentDate.getMonth()]} ${calendar.currentDate.getFullYear()}`;
            
        updateEventsList();
    }

    // Add event handlers
    document.querySelector('.prev-month').addEventListener('click', () => {
        calendar.currentDate.setMonth(calendar.currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.querySelector('.next-month').addEventListener('click', () => {
        calendar.currentDate.setMonth(calendar.currentDate.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('addEventBtn').addEventListener('click', openModal);

    function openModal() {
        const modal = document.getElementById('eventModal');
        document.getElementById('eventDate').valueAsDate = calendar.selectedDate || new Date();
        modal.classList.add('show');
    }

    function closeModal() {
        const modal = document.getElementById('eventModal');
        modal.classList.remove('show');
        document.getElementById('eventForm').reset();
    }

    document.querySelector('.cancel-btn').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
    });

    document.getElementById('eventModal').addEventListener('click', (e) => {
        if (e.target.id === 'eventModal') {
            closeModal();
        }
    });

    document.getElementById('eventForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newEvent = {
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            type: document.getElementById('eventType').value,
            description: document.getElementById('eventDescription').value
        };

        calendar.events.push(newEvent);
        saveEvents(); // Add this line
        closeModal();
        
        // Update both calendar and events list
        renderCalendar();
        updateEventsList(); // Add explicit call to update events list
        
        // Show success notification
        showNotification('Event added successfully!', 'success');
    });

    function deleteEvent(event) {
        const index = calendar.events.indexOf(event);
        if (index > -1) {
            calendar.events.splice(index, 1);
            saveEvents(); // Add this line
            renderCalendar();
            updateEventsList(); // Add explicit call here too
            showNotification('Event deleted successfully!', 'success');
        }
    }

    function updateEventsList() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;

        eventsList.innerHTML = '';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sortedEvents = calendar.events
            .filter(event => new Date(event.date) >= today)
            .sort((a, b) => {
                const dateA = new Date(a.date + 'T' + a.time);
                const dateB = new Date(b.date + 'T' + b.time);
                return dateA - dateB;
            });

        if (sortedEvents.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-events';
            emptyMessage.innerHTML = '<i class="fas fa-calendar-times"></i> No upcoming events';
            eventsList.appendChild(emptyMessage);
            return;
        }

        sortedEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `event-item ${event.type}`;
            
            const eventDate = new Date(event.date);
            const dateFormatted = eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            eventElement.innerHTML = `
                <div class="event-title">
                    <i class="fas fa-${getEventIcon(event.type)}"></i>
                    ${event.title}
                </div>
                <div class="event-info">
                    <div class="event-date">
                        <i class="fas fa-calendar"></i> ${dateFormatted}
                    </div>
                    <div class="event-time">
                        <i class="fas fa-clock"></i> ${formatTime(event.time)}
                    </div>
                </div>
                ${event.description ? `
                    <div class="event-description">
                        <i class="fas fa-align-left"></i> ${event.description}
                    </div>
                ` : ''}
            `;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-event';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = () => deleteEvent(event);

            eventElement.appendChild(deleteBtn);
            eventsList.appendChild(eventElement);
        });
    }

    // Helper function to get icons for different event types
    function getEventIcon(type) {
        const icons = {
            assignment: 'book',
            exam: 'pencil-alt',
            study: 'graduation-cap',
            meeting: 'users'
        };
        return icons[type] || 'calendar';
    }

    // Add helper function to format time
    function formatTime(time) {
        return new Date(`2000/01/01 ${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    // Initialize calendar
    renderCalendar();
});

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}