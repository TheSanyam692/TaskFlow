// ============================================
// CALENDAR UI MODULE - Calendar Interface
// ============================================

const CalendarUI = {
    currentDate: new Date(),
    selectedDate: null,
    editingEventId: null,

    /**
     * Initialize calendar UI
     */
    init() {
        this.setupEventListeners();
        this.render();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add event buttons
        document.getElementById('btn-add-event')?.addEventListener('click', () => this.openEventModal());
        document.getElementById('btn-add-event-empty')?.addEventListener('click', () => this.openEventModal());

        // Calendar navigation
        document.getElementById('btn-prev-month')?.addEventListener('click', () => this.previousMonth());
        document.getElementById('btn-next-month')?.addEventListener('click', () => this.nextMonth());
        document.getElementById('btn-today')?.addEventListener('click', () => this.goToToday());

        // Modal controls
        document.getElementById('close-event-modal')?.addEventListener('click', () => this.closeEventModal());
        document.getElementById('cancel-event')?.addEventListener('click', () => this.closeEventModal());
        document.getElementById('save-event')?.addEventListener('click', () => this.saveEvent());

        // Close modal on overlay click
        document.getElementById('event-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'event-modal') {
                this.closeEventModal();
            }
        });
    },

    /**
     * Render calendar and events
     */
    render() {
        this.renderCalendar();
        this.renderEventsList();
    },

    /**
     * Render calendar grid
     */
    renderCalendar() {
        const monthYearEl = document.getElementById('calendar-month-year');
        const calendarDays = document.getElementById('calendar-days');

        if (!calendarDays) return;

        // Update month/year display
        const monthName = Utils.getMonthName(this.currentDate.getMonth());
        const year = this.currentDate.getFullYear();
        if (monthYearEl) {
            monthYearEl.textContent = `${monthName} ${year}`;
        }

        // Get month data
        const monthData = Utils.getMonthData(year, this.currentDate.getMonth());
        const { daysInMonth, startingDayOfWeek } = monthData;

        // Get previous month's last days
        const prevMonth = new Date(year, this.currentDate.getMonth(), 0);
        const prevMonthDays = prevMonth.getDate();
        const prevMonthStart = prevMonthDays - startingDayOfWeek + 1;

        // Calculate total cells (6 rows)
        const totalCells = 42;
        const days = [];

        // Previous month days
        for (let i = 0; i < startingDayOfWeek; i++) {
            const day = prevMonthStart + i;
            const date = new Date(year, this.currentDate.getMonth() - 1, day);
            days.push({
                date,
                day,
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, this.currentDate.getMonth(), day);
            days.push({
                date,
                day,
                isCurrentMonth: true
            });
        }

        // Next month days
        const remainingCells = totalCells - days.length;
        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(year, this.currentDate.getMonth() + 1, day);
            days.push({
                date,
                day,
                isCurrentMonth: false
            });
        }

        // Render calendar days
        calendarDays.innerHTML = days.map(({ date, day, isCurrentMonth }) => {
            const isToday = Utils.isToday(date);
            const isSelected = this.selectedDate &&
                date.toDateString() === this.selectedDate.toDateString();

            // Get events for this day
            const dayEvents = EventScheduler.getEventsForDate(date);

            const classes = [
                'calendar-day',
                !isCurrentMonth && 'other-month',
                isToday && 'today',
                isSelected && 'selected'
            ].filter(Boolean).join(' ');

            return `
        <div class="${classes}" data-date="${date.toISOString()}">
          <div class="calendar-day-number">${day}</div>
          ${dayEvents.length > 0 ? `
            <div class="calendar-day-events">
              ${dayEvents.slice(0, 3).map(event => `
                <span class="event-dot" style="background: ${event.color};"></span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
        }).join('');

        // Add click listeners to calendar days
        calendarDays.querySelectorAll('.calendar-day').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const dateStr = dayEl.dataset.date;
                this.selectDate(new Date(dateStr));
            });
        });
    },

    /**
     * Render events list
     */
    renderEventsList() {
        const eventsList = document.getElementById('events-list');
        const emptyState = document.getElementById('events-empty');

        if (!eventsList || !emptyState) return;

        // Get upcoming events
        const events = EventScheduler.getUpcomingEvents(30);

        if (events.length === 0) {
            eventsList.style.display = 'none';
            emptyState.classList.remove('hidden');
        } else {
            eventsList.style.display = 'block';
            emptyState.classList.add('hidden');

            eventsList.innerHTML = events.map(event => this.createEventCard(event)).join('');

            // Add event listeners
            this.attachEventEventListeners();
        }
    },

    /**
     * Create event card HTML
     * @param {object} event - Event object
     * @returns {string} HTML string
     */
    createEventCard(event) {
        const dateStr = Utils.formatDate(event.date);
        const timeStr = event.startTime && event.endTime
            ? `${Utils.formatTime(event.startTime)} - ${Utils.formatTime(event.endTime)}`
            : event.startTime
                ? Utils.formatTime(event.startTime)
                : 'All day';

        return `
      <div class="event-card" data-event-id="${event.id}" style="border-left-color: ${event.color};">
        <div class="event-header">
          <div>
            <h3 class="event-title">${Utils.sanitizeHTML(event.title)}</h3>
            <div class="event-time">📅 ${dateStr} • 🕐 ${timeStr}</div>
          </div>
        </div>
        
        ${event.description ? `
          <p class="event-description">${Utils.sanitizeHTML(event.description)}</p>
        ` : ''}
        
        ${event.location ? `
          <div class="event-location">
            📍 ${Utils.sanitizeHTML(event.location)}
          </div>
        ` : ''}
        
        <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-md);">
          <button class="btn-icon" data-action="edit-event" data-event-id="${event.id}" title="Edit event">
            ✎
          </button>
          <button class="btn-icon" data-action="delete-event" data-event-id="${event.id}" title="Delete event">
            🗑
          </button>
        </div>
      </div>
    `;
    },

    /**
     * Attach event listeners to event cards
     */
    attachEventEventListeners() {
        document.querySelectorAll('[data-action^="edit-event"]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = button.dataset.eventId;
                this.openEventModal(eventId);
            });
        });

        document.querySelectorAll('[data-action^="delete-event"]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = button.dataset.eventId;
                this.deleteEvent(eventId);
            });
        });
    },

    /**
     * Select a date
     * @param {Date} date - Date to select
     */
    selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar();
    },

    /**
     * Go to previous month
     */
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    },

    /**
     * Go to next month
     */
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    },

    /**
     * Go to today
     */
    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.render();
    },

    /**
     * Open event modal
     * @param {string} eventId - Optional event ID for editing
     */
    openEventModal(eventId = null) {
        const modal = document.getElementById('event-modal');
        const modalTitle = document.getElementById('event-modal-title');
        const form = document.getElementById('event-form');

        if (!modal || !modalTitle || !form) return;

        this.editingEventId = eventId;

        // Set modal title
        modalTitle.textContent = eventId ? 'Edit Event' : 'Add New Event';

        // Reset or populate form
        if (eventId) {
            const event = EventScheduler.getEventById(eventId);
            if (event) {
                document.getElementById('event-title').value = event.title;
                document.getElementById('event-description').value = event.description;
                document.getElementById('event-date').value = event.date;
                document.getElementById('event-start-time').value = event.startTime;
                document.getElementById('event-end-time').value = event.endTime;
                document.getElementById('event-location').value = event.location;
                document.getElementById('event-color').value = event.color;
                document.getElementById('event-reminder').value = event.reminder;
            }
        } else {
            form.reset();
            // Pre-fill date if one is selected
            if (this.selectedDate) {
                const dateStr = this.selectedDate.toISOString().split('T')[0];
                document.getElementById('event-date').value = dateStr;
            }
        }

        // Show modal
        modal.classList.remove('hidden');
        document.getElementById('event-title')?.focus();
    },

    /**
     * Close event modal
     */
    closeEventModal() {
        const modal = document.getElementById('event-modal');
        const form = document.getElementById('event-form');

        if (modal) modal.classList.add('hidden');
        if (form) form.reset();

        this.editingEventId = null;
    },

    /**
     * Save event
     */
    saveEvent() {
        const eventData = {
            title: document.getElementById('event-title')?.value || '',
            description: document.getElementById('event-description')?.value || '',
            date: document.getElementById('event-date')?.value || '',
            startTime: document.getElementById('event-start-time')?.value || '',
            endTime: document.getElementById('event-end-time')?.value || '',
            location: document.getElementById('event-location')?.value || '',
            color: document.getElementById('event-color')?.value || 'hsl(260, 70%, 55%)',
            reminder: document.getElementById('event-reminder')?.value || 'none'
        };

        try {
            // Validate times
            if (eventData.startTime && eventData.endTime && eventData.startTime >= eventData.endTime) {
                throw new Error('End time must be after start time');
            }

            // Check for conflicts
            if (eventData.startTime && eventData.endTime) {
                const conflicts = EventScheduler.checkConflicts(
                    eventData.date,
                    eventData.startTime,
                    eventData.endTime,
                    this.editingEventId
                );

                if (conflicts.length > 0) {
                    const conflictTitles = conflicts.map(e => e.title).join(', ');
                    if (!confirm(`This event conflicts with: ${conflictTitles}. Continue anyway?`)) {
                        return;
                    }
                }
            }

            if (this.editingEventId) {
                // Update existing event
                EventScheduler.updateEvent(this.editingEventId, eventData);
                Notifications.success('Event updated successfully');
            } else {
                // Create new event
                EventScheduler.createEvent(eventData);
                Notifications.success('Event created successfully');
            }

            this.closeEventModal();
            this.render();
        } catch (error) {
            Notifications.error('Failed to save event', error.message);
        }
    },

    /**
     * Delete event with confirmation
     * @param {string} eventId - Event ID
     */
    deleteEvent(eventId) {
        const event = EventScheduler.getEventById(eventId);
        if (!event) return;

        if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
            try {
                EventScheduler.deleteEvent(eventId);
                Notifications.success('Event deleted');
                this.render();
            } catch (error) {
                Notifications.error('Failed to delete event', error.message);
            }
        }
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CalendarUI.init());
} else {
    CalendarUI.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarUI;
}
