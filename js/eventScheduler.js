// ============================================
// EVENT SCHEDULER MODULE - Event Data & Logic
// ============================================

const EventScheduler = {
    events: [],

    /**
     * Initialize event scheduler
     */
    init() {
        this.loadEvents();
    },

    /**
     * Load events from storage
     */
    loadEvents() {
        const storedEvents = Storage.get(Storage.KEYS.EVENTS);
        this.events = storedEvents || [];
        return this.events;
    },

    /**
     * Save events to storage
     */
    saveEvents() {
        return Storage.set(Storage.KEYS.EVENTS, this.events);
    },

    /**
     * Get all events
     * @returns {Array} All events
     */
    getAllEvents() {
        return this.events;
    },

    /**
     * Get event by ID
     * @param {string} id - Event ID
     * @returns {object|null} Event object or null
     */
    getEventById(id) {
        return this.events.find(event => event.id === id) || null;
    },

    /**
     * Create a new event
     * @param {object} eventData - Event data
     * @returns {object} Created event
     */
    createEvent(eventData) {
        // Validate required fields
        if (!eventData.title || eventData.title.trim() === '') {
            throw new Error('Event title is required');
        }

        if (!eventData.date) {
            throw new Error('Event date is required');
        }

        const now = new Date().toISOString();
        const event = {
            id: Utils.generateId(),
            title: eventData.title.trim(),
            description: eventData.description?.trim() || '',
            date: eventData.date,
            startTime: eventData.startTime || '',
            endTime: eventData.endTime || '',
            location: eventData.location?.trim() || '',
            color: eventData.color || 'hsl(260, 70%, 55%)',
            reminder: eventData.reminder || 'none',
            createdAt: now,
            updatedAt: now
        };

        this.events.push(event);
        this.saveEvents();

        return event;
    },

    /**
     * Update an event
     * @param {string} id - Event ID
     * @param {object} updates - Fields to update
     * @returns {object|null} Updated event or null
     */
    updateEvent(id, updates) {
        const eventIndex = this.events.findIndex(event => event.id === id);

        if (eventIndex === -1) {
            throw new Error('Event not found');
        }

        // Validate title if being updated
        if (updates.title !== undefined && updates.title.trim() === '') {
            throw new Error('Event title cannot be empty');
        }

        const event = this.events[eventIndex];

        // Update fields
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                event[key] = updates[key];
            }
        });

        event.updatedAt = new Date().toISOString();

        this.saveEvents();
        return event;
    },

    /**
     * Delete an event
     * @param {string} id - Event ID
     * @returns {boolean} Success status
     */
    deleteEvent(id) {
        const initialLength = this.events.length;
        this.events = this.events.filter(event => event.id !== id);

        if (this.events.length === initialLength) {
            throw new Error('Event not found');
        }

        this.saveEvents();
        return true;
    },

    /**
     * Get events for a specific date
     * @param {Date|string} date - Date to check
     * @returns {Array} Events on that date
     */
    getEventsForDate(date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === targetDate.getTime();
        });
    },

    /**
     * Get events in date range
     * @param {Date|string} startDate - Start date
     * @param {Date|string} endDate - End date
     * @returns {Array} Events in range
     */
    getEventsInRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= start && eventDate <= end;
        });
    },

    /**
     * Get upcoming events
     * @param {number} days - Number of days to look ahead
     * @returns {Array} Upcoming events
     */
    getUpcomingEvents(days = 30) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const future = new Date();
        future.setDate(future.getDate() + days);
        future.setHours(23, 59, 59, 999);

        return this.events
            .filter(event => {
                const eventDate = new Date(event.date);
                return eventDate >= now && eventDate <= future;
            })
            .sort((a, b) => {
                const dateCompare = new Date(a.date) - new Date(b.date);
                if (dateCompare !== 0) return dateCompare;

                // If same date, sort by start time
                if (a.startTime && b.startTime) {
                    return a.startTime.localeCompare(b.startTime);
                }
                return 0;
            });
    },

    /**
     * Get today's events
     * @returns {Array} Today's events
     */
    getTodayEvents() {
        return this.getEventsForDate(new Date());
    },

    /**
     * Check for event conflicts
     * @param {string} date - Event date
     * @param {string} startTime - Start time
     * @param {string} endTime - End time
     * @param {string} excludeId - Event ID to exclude (for updates)
     * @returns {Array} Conflicting events
     */
    checkConflicts(date, startTime, endTime, excludeId = null) {
        if (!startTime || !endTime) return [];

        const dayEvents = this.getEventsForDate(date)
            .filter(event => event.id !== excludeId && event.startTime && event.endTime);

        return dayEvents.filter(event => {
            const newStart = startTime;
            const newEnd = endTime;
            const existingStart = event.startTime;
            const existingEnd = event.endTime;

            // Check for overlap
            return (newStart < existingEnd && newEnd > existingStart);
        });
    },

    /**
     * Get event statistics
     * @returns {object} Event statistics
     */
    getStats() {
        const total = this.events.length;
        const upcoming = this.getUpcomingEvents(30).length;
        const today = this.getTodayEvents().length;

        const byMonth = {};
        this.events.forEach(event => {
            const date = new Date(event.date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            byMonth[key] = (byMonth[key] || 0) + 1;
        });

        return {
            total,
            upcoming,
            today,
            byMonth
        };
    },

    /**
     * Search events
     * @param {string} query - Search query
     * @returns {Array} Matching events
     */
    searchEvents(query) {
        if (!query) return this.events;

        const searchLower = query.toLowerCase();
        return this.events.filter(event =>
            event.title.toLowerCase().includes(searchLower) ||
            event.description.toLowerCase().includes(searchLower) ||
            event.location.toLowerCase().includes(searchLower)
        );
    },

    /**
     * Clear all events
     */
    clearAllEvents() {
        this.events = [];
        this.saveEvents();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventScheduler;
}
