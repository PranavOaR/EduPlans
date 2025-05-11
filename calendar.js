document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        // User is not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // Check for reset command in URL (for debugging)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reset')) {
        console.log('Resetting calendar data due to URL parameter');
        localStorage.removeItem('calendarEvents');
    }
    
    // Initialize calendar with proper loading from localStorage
    const calendar = {
        currentDate: new Date(),
        selectedDate: null,
        events: []
    };
    
    // Load events from localStorage immediately
    try {
        const savedEvents = localStorage.getItem('calendarEvents');
        if (savedEvents) {
            calendar.events = JSON.parse(savedEvents) || [];
            console.log('Loaded events from localStorage:', calendar.events.length);
        }
    } catch (error) {
        console.error('Error loading events from localStorage:', error);
        calendar.events = [];
        localStorage.setItem('calendarEvents', JSON.stringify([]));
    }

    // Add this function to save events
    function saveEvents() {
        try {
            localStorage.setItem('calendarEvents', JSON.stringify(calendar.events));
            console.log('Events saved successfully. Count:', calendar.events.length);
        } catch (error) {
            console.error('Error saving events to localStorage:', error);
            
            // In case of quota exceeded or other storage issues
            if (error.name === 'QuotaExceededError') {
                showNotification('Storage limit exceeded. Try removing some events.');
            }
        }
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

            // Create a date object for the current day in the loop
            const currentDate = new Date(
                calendar.currentDate.getFullYear(), 
                calendar.currentDate.getMonth(), 
                day
            );
            
            // Format the current date in 'YYYY-MM-DD' format for comparison
            const formattedCurrentDate = currentDate.toISOString().split('T')[0];
            
            // Check if day has events by comparing the formatted dates
            const dayEvents = calendar.events.filter(event => event.date === formattedCurrentDate);
            
            if (dayEvents.length > 0) {
                console.log(`Day ${day} has ${dayEvents.length} events`);
                
                // Create and add event dot
                const dot = document.createElement('div');
                dot.className = 'event-dot';
                
                // If there are multiple events, make the dot more prominent
                if (dayEvents.length > 1) {
                    dot.style.transform = 'scale(1.2)';
                    dot.style.opacity = '0.9';
                }
                
                dayElement.appendChild(dot);
            }

            // Check if this date is selected
            if (calendar.selectedDate && 
                day === calendar.selectedDate.getDate() &&
                calendar.currentDate.getMonth() === calendar.selectedDate.getMonth() &&
                calendar.currentDate.getFullYear() === calendar.selectedDate.getFullYear()) {
                dayElement.classList.add('selected');
            }

            // Add click event
            dayElement.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayElement.classList.add('selected');
                calendar.selectedDate = new Date(calendar.currentDate.getFullYear(), calendar.currentDate.getMonth(), day);
                
                // Set the date in the modal form
                document.getElementById('eventDate').valueAsDate = calendar.selectedDate;
                
                // Add particle effect on click
                const rect = dayElement.getBoundingClientRect();
                createParticles(rect.left + rect.width/2, rect.top + rect.height/2, 8);
                
                openModal();
            });

            daysContainer.appendChild(dayElement);
        }

        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('monthDisplay').textContent = 
            `${monthNames[calendar.currentDate.getMonth()]} ${calendar.currentDate.getFullYear()}`;
            
        // Update events list after rendering calendar
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

    document.getElementById('addEventBtn').addEventListener('click', () => {
        if (!calendar.selectedDate) {
            calendar.selectedDate = new Date();
        }
        openModal();
    });

    function openModal() {
        const modal = document.getElementById('eventModal');
        
        // Format the selected date for the date input
        if (calendar.selectedDate) {
            const year = calendar.selectedDate.getFullYear();
            const month = String(calendar.selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(calendar.selectedDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            document.getElementById('eventDate').value = formattedDate;
        } else {
            // If no date selected, default to today
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            document.getElementById('eventDate').value = formattedDate;
            calendar.selectedDate = today;
        }
        
        // Set default time if not already set
        if (!document.getElementById('eventTime').value) {
            document.getElementById('eventTime').value = '09:00';
        }
        
        // Show the modal
        modal.classList.add('show');
        
        // Initialize the event type select with dark theme styles
        styleEventTypeSelect();
        
        // Focus on the title field
        setTimeout(() => {
            document.getElementById('eventTitle').focus();
        }, 300);
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

    document.getElementById('eventForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        try {
            // Get form values
            const title = document.getElementById('eventTitle').value.trim();
            const date = document.getElementById('eventDate').value;
            const time = document.getElementById('eventTime').value;
            const type = document.getElementById('eventType').value;
            const description = document.getElementById('eventDescription').value.trim();
    
            // Validate inputs
            if (!title || !date) {
                showNotification('Title and date are required!');
                return;
            }
    
            // Create the new event object
            const newEvent = {
                id: Date.now().toString(), // Use string ID for consistency
                title,
                date,
                time,
                type,
                description
            };
    
            console.log('Adding new event:', newEvent);
    
            // Add to calendar events array
            calendar.events.push(newEvent);
            
            // Save to localStorage
            saveEvents();
            
            // Close the modal and reset form
            closeModal();
            
            // Log the total events after adding
            console.log('Total events after adding:', calendar.events.length);
    
            // Force a complete rerender of the calendar and event list
            setTimeout(() => {
                renderCalendar();
                updateEventsList();
                showNotification('Event added successfully!');
            }, 100);
        } catch (error) {
            console.error('Error adding event:', error);
            showNotification('Error adding event. Please try again.');
        }
    });

    function deleteEvent(event, element) {
        // Add delete animation
        if (element) {
            element.style.animation = 'fadeInUp 0.3s ease reverse';
        }
        
        console.log('Attempting to delete event:', event);
        
        // Wait for animation to complete
        setTimeout(() => {
            try {
                // First try to find by ID
                let index = -1;
                
                if (event.id) {
                    index = calendar.events.findIndex(e => e.id === event.id);
                }
                
                // If ID search fails, try matching all properties
                if (index === -1) {
                    index = calendar.events.findIndex(e => 
                        e.title === event.title &&
                        e.date === event.date &&
                        e.time === event.time &&
                        e.type === event.type
                    );
                }
                
                if (index > -1) {
                    console.log('Found event to delete at index:', index, 'with title:', calendar.events[index].title);
                    
                    // Remove from array
                    calendar.events.splice(index, 1);
                    
                    // Save to localStorage
                    saveEvents();
                    
                    // Remove the element from DOM if it exists
                    if (element && element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                    
                    // Update the UI completely
                    renderCalendar();
                    updateEventsList();
                    
                    showNotification('Event deleted');
                } else {
                    console.error('Event not found for deletion:', event);
                    showNotification('Could not find event to delete');
                }
            } catch (error) {
                console.error('Error deleting event:', error);
                showNotification('Error deleting event');
            }
        }, 300);
    }

    function updateEventsList() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) {
            console.error('Event list element not found');
            return;
        }

        // Clear the events list first
        eventsList.innerHTML = '';
        
        // Do a direct check on the calendar events array
        console.log('Updating events list. Current events:', calendar.events);
        
        if (!Array.isArray(calendar.events) || calendar.events.length === 0) {
            console.log('No events to display');
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-events';
            emptyMessage.innerHTML = '<i class="fas fa-calendar-times"></i><p>No upcoming events</p>';
            eventsList.appendChild(emptyMessage);
            return;
        }
        
        // Get today's date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Sort events by date: closest first
        const sortedEvents = [...calendar.events].filter(event => {
            if (!event || !event.date) {
                console.log('Skipping invalid event:', event);
                return false;
            }
            
            try {
                // Parse the event date and compare with today
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= today;
            } catch (error) {
                console.error('Error parsing date for event:', event, error);
                return false;
            }
        }).sort((a, b) => {
            try {
                const dateA = new Date(a.date + 'T' + (a.time || '00:00:00'));
                const dateB = new Date(b.date + 'T' + (b.time || '00:00:00'));
                return dateA - dateB;
            } catch (error) {
                console.error('Error sorting events:', error);
                return 0;
            }
        });

        // Debug - display how many events are being processed
        console.log('Upcoming events found:', sortedEvents.length);
        
        // If no upcoming events, show empty state
        if (sortedEvents.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-events';
            emptyMessage.innerHTML = '<i class="fas fa-calendar-times"></i><p>No upcoming events</p>';
            eventsList.appendChild(emptyMessage);
            return;
        }

        // Create and append each event
        sortedEvents.forEach((event, index) => {
            try {
                console.log(`Creating event element ${index+1}:`, event.title);
                
                const eventElement = document.createElement('div');
                eventElement.className = `event-item ${event.type || 'default'}`;
                eventElement.style.animationDelay = `${index * 0.1}s`;
                
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
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteEvent(event, eventElement);
                });
    
                eventElement.appendChild(deleteBtn);
                eventsList.appendChild(eventElement);
            } catch (error) {
                console.error('Error creating event element for:', event, error);
            }
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
        if (!time) return 'All day';
        return new Date(`2000/01/01 ${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    // Create particles for calendar effects
    function createParticles(x, y, count = 10, color = 'var(--accent-red)') {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random size between 3 and 6 pixels
            const size = Math.random() * 3 + 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Position at the center of the clicked element
            particle.style.position = 'fixed';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 80 + 20;
            
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            // Set background color
            particle.style.background = color;
            
            // Add particle to body
            document.body.appendChild(particle);
            
            // Remove after animation completes
            setTimeout(() => particle.remove(), 2000);
        }
    }
    
    // Create background particles
    function createBackgroundParticles() {
        const particleSystem = document.querySelector('.particle-system');
        const numberOfParticles = 30;

        for (let i = 0; i < numberOfParticles; i++) {
            const size = Math.random() * 3 + 1;
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            const tx = (Math.random() - 0.5) * 300;
            const ty = (Math.random() - 0.5) * 300;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            const duration = Math.random() * 10 + 10;
            const delay = Math.random() * 5;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;
            
            particleSystem.appendChild(particle);
        }
    }

    // Show notification
    function showNotification(message) {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notification-message');
        
        notificationMessage.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Style the event type select to work with the dark theme
    function styleEventTypeSelect() {
        const select = document.getElementById('eventType');
        if (!select) return;
        
        // Apply styles directly to the select element
        select.style.backgroundColor = 'var(--card-bg)';
        select.style.color = 'var(--text-primary)';
        select.style.border = '1px solid rgba(220, 20, 60, 0.1)';
        
        // Style the options
        Array.from(select.options).forEach(option => {
            option.style.backgroundColor = 'var(--card-bg)';
            option.style.color = 'var(--text-primary)';
            option.style.padding = '10px';
        });
    }

    // Debug and fix events storage issues
    function debugEventsStorage() {
        console.log('DEBUG: Checking event storage');
        
        try {
            // Check what's in localStorage
            const rawEvents = localStorage.getItem('calendarEvents');
            console.log('Raw localStorage data:', rawEvents);
            
            // Clear any invalid data
            if (rawEvents === 'undefined' || rawEvents === 'null') {
                console.log('Clearing invalid events data');
                localStorage.removeItem('calendarEvents');
                calendar.events = [];
                return;
            }
            
            // Parse events and validate
            if (rawEvents) {
                const parsedEvents = JSON.parse(rawEvents);
                console.log('Parsed events:', parsedEvents);
                
                if (Array.isArray(parsedEvents)) {
                    calendar.events = parsedEvents;
                    console.log('Successfully loaded', parsedEvents.length, 'events');
                } else {
                    console.log('Events data is not an array, resetting');
                    localStorage.setItem('calendarEvents', JSON.stringify([]));
                    calendar.events = [];
                }
            } else {
                console.log('No events data found');
                localStorage.setItem('calendarEvents', JSON.stringify([]));
                calendar.events = [];
            }
        } catch (error) {
            console.error('Error in debugEventsStorage:', error);
            localStorage.setItem('calendarEvents', JSON.stringify([]));
            calendar.events = [];
        }
    }

    // Initialize calendar and background effects
    createBackgroundParticles();
    debugEventsStorage(); // Debug and fix storage issues
    renderCalendar();
});