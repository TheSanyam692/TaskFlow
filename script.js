// ============================================
// UTILITIES
// ============================================
const Utils = {
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    formatDate(date, includeTime = false) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';

        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        return d.toLocaleDateString('en-US', options);
    },

    formatTime(time) {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    },

    getDaysUntil(deadline) {
        const d = new Date(deadline);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        const diffMs = d - now;
        return Math.ceil(diffMs / 86400000);
    },

    formatDeadline(deadline) {
        if (!deadline) return 'No deadline';
        const days = this.getDaysUntil(deadline);
        if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''}`;
        if (days === 0) return 'Due today';
        if (days === 1) return 'Due tomorrow';
        if (days <= 7) return `Due in ${days} days`;
        return `Due ${this.formatDate(deadline)}`;
    },

    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    },

    isToday(date) {
        const d = new Date(date);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    },

    getMonthData(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { year, month, daysInMonth, startingDayOfWeek, firstDay, lastDay };
    },

    getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month];
    }
};

// ============================================
// STORAGE
// ============================================
const Storage = {
    KEYS: {
        TASKS: 'taskflow_tasks',
        EVENTS: 'taskflow_events',
        SETTINGS: 'taskflow_settings'
    },

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error reading from storage (${key}):`, error);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to storage (${key}):`, error);
            return false;
        }
    }
};

// ============================================
// NOTIFICATIONS
// ============================================
const Notifications = {
    container: null,
    toasts: [],

    init() {
        this.container = document.getElementById('toast-container');
    },

    show(message, type = 'info', description = '', duration = 4000) {
        if (!this.container) this.init();

        const toast = this.createToast(message, type, description);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        setTimeout(() => toast.style.opacity = '1', 10);

        if (duration > 0) {
            setTimeout(() => this.dismiss(toast), duration);
        }

        return toast;
    },

    createToast(message, type, description) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';

        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const icon = icons[type] || icons.info;

        toast.innerHTML = `
                    <div class="toast-icon">${icon}</div>
                    <div class="toast-content">
                        <div class="toast-message">${Utils.sanitizeHTML(message)}</div>
                        ${description ? `<div class="toast-description">${Utils.sanitizeHTML(description)}</div>` : ''}
                    </div>
                    <button class="toast-close" aria-label="Close notification">✕</button>
                `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.dismiss(toast));

        return toast;
    },

    dismiss(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    },

    success(message, description = '') {
        return this.show(message, 'success', description);
    },

    error(message, description = '') {
        return this.show(message, 'error', description, 5000);
    },

    warning(message, description = '') {
        return this.show(message, 'warning', description);
    },

    info(message, description = '') {
        return this.show(message, 'info', description);
    }
};

// ============================================
// TASK MANAGER
// ============================================
const TaskManager = {
    tasks: [],

    init() {
        this.loadTasks();
    },

    loadTasks() {
        const storedTasks = Storage.get(Storage.KEYS.TASKS);
        this.tasks = storedTasks || [];
        return this.tasks;
    },

    saveTasks() {
        return Storage.set(Storage.KEYS.TASKS, this.tasks);
    },

    getAllTasks() {
        return this.tasks;
    },

    getTaskById(id) {
        return this.tasks.find(task => task.id === id) || null;
    },

    createTask(taskData) {
        if (!taskData.title || taskData.title.trim() === '') {
            throw new Error('Task title is required');
        }

        const now = new Date().toISOString();
        const task = {
            id: Utils.generateId(),
            title: taskData.title.trim(),
            description: taskData.description?.trim() || '',
            assignee: taskData.assignee?.trim() || '',
            status: taskData.status || 'todo',
            priority: taskData.priority || 'medium',
            deadline: taskData.deadline || null,
            createdAt: now,
            updatedAt: now
        };

        this.tasks.push(task);
        this.saveTasks();
        return task;
    },

    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        if (updates.title !== undefined && updates.title.trim() === '') {
            throw new Error('Task title cannot be empty');
        }

        const task = this.tasks[taskIndex];
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                task[key] = updates[key];
            }
        });

        task.updatedAt = new Date().toISOString();
        this.saveTasks();
        return task;
    },

    deleteTask(id) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => task.id !== id);
        if (this.tasks.length === initialLength) {
            throw new Error('Task not found');
        }
        this.saveTasks();
        return true;
    },

    updateStatus(id, status) {
        const validStatuses = ['todo', 'in-progress', 'completed'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }
        return this.updateTask(id, { status });
    },

    filterTasks(filters = {}) {
        let filtered = [...this.tasks];

        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(task => task.status === filters.status);
        }

        if (filters.priority && filters.priority !== 'all') {
            filtered = filtered.filter(task => task.priority === filters.priority);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchLower) ||
                task.description.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    },

    sortTasks(tasks, sortBy = 'created') {
        const sorted = [...tasks];

        switch (sortBy) {
            case 'deadline':
                return sorted.sort((a, b) => {
                    if (!a.deadline && !b.deadline) return 0;
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline) - new Date(b.deadline);
                });

            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return sorted.sort((a, b) =>
                    priorityOrder[a.priority] - priorityOrder[b.priority]
                );

            case 'created':
            default:
                return sorted.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
        }
    }
};

// ============================================
// EVENT SCHEDULER
// ============================================
const EventScheduler = {
    events: [],

    init() {
        this.loadEvents();
    },

    loadEvents() {
        const storedEvents = Storage.get(Storage.KEYS.EVENTS);
        this.events = storedEvents || [];
        return this.events;
    },

    saveEvents() {
        return Storage.set(Storage.KEYS.EVENTS, this.events);
    },

    getAllEvents() {
        return this.events;
    },

    getEventById(id) {
        return this.events.find(event => event.id === id) || null;
    },

    createEvent(eventData) {
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

    updateEvent(id, updates) {
        const eventIndex = this.events.findIndex(event => event.id === id);
        if (eventIndex === -1) {
            throw new Error('Event not found');
        }

        if (updates.title !== undefined && updates.title.trim() === '') {
            throw new Error('Event title cannot be empty');
        }

        const event = this.events[eventIndex];
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                event[key] = updates[key];
            }
        });

        event.updatedAt = new Date().toISOString();
        this.saveEvents();
        return event;
    },

    deleteEvent(id) {
        const initialLength = this.events.length;
        this.events = this.events.filter(event => event.id !== id);
        if (this.events.length === initialLength) {
            throw new Error('Event not found');
        }
        this.saveEvents();
        return true;
    },

    getEventsForDate(date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === targetDate.getTime();
        });
    },

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
                if (a.startTime && b.startTime) {
                    return a.startTime.localeCompare(b.startTime);
                }
                return 0;
            });
    },

    checkConflicts(date, startTime, endTime, excludeId = null) {
        if (!startTime || !endTime) return [];

        const dayEvents = this.getEventsForDate(date)
            .filter(event => event.id !== excludeId && event.startTime && event.endTime);

        return dayEvents.filter(event => {
            return (startTime < event.endTime && endTime > event.startTime);
        });
    }
};

// ============================================
// TASK UI
// ============================================
const TaskUI = {
    currentFilter: { status: 'all', priority: 'all', search: '' },
    currentSort: 'created',
    editingTaskId: null,

    init() {
        this.setupEventListeners();
        this.render();
    },

    setupEventListeners() {
        document.getElementById('btn-add-task')?.addEventListener('click', () => this.openTaskModal());
        document.getElementById('btn-add-task-empty')?.addEventListener('click', () => this.openTaskModal());
        document.getElementById('close-task-modal')?.addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancel-task')?.addEventListener('click', () => this.closeTaskModal());
        document.getElementById('save-task')?.addEventListener('click', () => this.saveTask());

        document.getElementById('task-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                this.closeTaskModal();
            }
        });

        const searchInput = document.getElementById('task-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.currentFilter.search = e.target.value;
                this.render();
            }, 300));
        }

        document.getElementById('filter-status')?.addEventListener('change', (e) => {
            this.currentFilter.status = e.target.value;
            this.render();
        });

        document.getElementById('filter-priority')?.addEventListener('change', (e) => {
            this.currentFilter.priority = e.target.value;
            this.render();
        });

        document.getElementById('sort-tasks')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.render();
        });
    },

    render() {
        const taskGrid = document.getElementById('task-grid');
        const emptyState = document.getElementById('tasks-empty');

        if (!taskGrid || !emptyState) return;

        let tasks = TaskManager.filterTasks(this.currentFilter);
        tasks = TaskManager.sortTasks(tasks, this.currentSort);

        if (tasks.length === 0) {
            taskGrid.style.display = 'none';
            emptyState.classList.remove('hidden');
        } else {
            taskGrid.style.display = 'grid';
            emptyState.classList.add('hidden');
            taskGrid.innerHTML = tasks.map(task => this.createTaskCard(task)).join('');

            // Attach event listeners after rendering
            this.attachTaskEventListeners();
        }
    },

    // Add method to attach task event listeners
    attachTaskEventListeners() {
        document.querySelectorAll('.task-status-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const action = button.dataset.action;
                const taskId = button.dataset.taskId;
                console.log('Status action:', action, 'for task:', taskId);
                this.handleTaskAction(action, taskId);
            });
        });

        document.querySelectorAll('.task-edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const taskId = button.dataset.taskId;
                console.log('Edit task:', taskId);
                this.handleTaskAction('edit', taskId);
            });
        });

        document.querySelectorAll('.task-delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const taskId = button.dataset.taskId;
                console.log('Delete task:', taskId);
                this.handleTaskAction('delete', taskId);
            });
        });
    },

    createTaskCard(task) {
        const statusActions = {
            'todo': { action: 'start', icon: '▶️', text: 'Start' },
            'in-progress': { action: 'complete', icon: '✅', text: 'Complete' },
            'completed': { action: 'start', icon: '🔄', text: 'Reopen' }
        };

        const action = statusActions[task.status] || statusActions['todo'];

        return `
                    <div class="task-card">
                        <div class="task-header">
                            <div>
                                <h3 class="task-title">${Utils.sanitizeHTML(task.title)}</h3>
                                <div class="task-meta">
                                    <span class="badge badge-status ${task.status}">${task.status.replace('-', ' ')}</span>
                                    <span class="badge badge-priority ${task.priority}">${task.priority}</span>
                                </div>
                            </div>
                        </div>
                        ${task.description ? `<p class="task-description">${Utils.sanitizeHTML(task.description)}</p>` : ''}
                        <div class="task-footer">
                            <div class="task-info">
                                ${task.deadline ? `📅 ${Utils.formatDeadline(task.deadline)}` : 'No deadline'}
                                ${task.assignee ? `<br>👤 ${Utils.sanitizeHTML(task.assignee)}` : ''}
                            </div>
                            <div class="task-actions">
                                <button class="btn-icon task-status-btn" data-action="${action.action}" data-task-id="${task.id}" title="${action.text}">
                                    ${action.icon}
                                </button>
                                <button class="btn-icon task-edit-btn" data-task-id="${task.id}" title="Edit task">
                                    ✎
                                </button>
                                <button class="btn-icon task-delete-btn" data-task-id="${task.id}" title="Delete task">
                                    🗑
                                </button>
                            </div>
                        </div>
                    </div>
                `;
    },

    handleTaskAction(action, taskId) {
        try {
            switch (action) {
                case 'complete':
                    TaskManager.updateStatus(taskId, 'completed');
                    Notifications.success('Task completed! 🎉');
                    this.render();
                    break;
                case 'start':
                    TaskManager.updateStatus(taskId, 'in-progress');
                    Notifications.success('Task started');
                    this.render();
                    break;
                case 'edit':
                    this.openTaskModal(taskId);
                    break;
                case 'delete':
                    this.deleteTask(taskId);
                    break;
            }
        } catch (error) {
            Notifications.error('Action failed', error.message);
        }
    },

    openTaskModal(taskId = null) {
        const modal = document.getElementById('task-modal');
        const modalTitle = document.getElementById('task-modal-title');
        const form = document.getElementById('task-form');

        if (!modal || !modalTitle || !form) return;

        this.editingTaskId = taskId;
        modalTitle.textContent = taskId ? 'Edit Task' : 'Add New Task';

        if (taskId) {
            const task = TaskManager.getTaskById(taskId);
            if (task) {
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-description').value = task.description;
                document.getElementById('task-assignee').value = task.assignee;
                document.getElementById('task-status').value = task.status;
                document.getElementById('task-priority').value = task.priority;
                document.getElementById('task-deadline').value = task.deadline || '';
            }
        } else {
            form.reset();
        }

        modal.classList.remove('hidden');
        document.getElementById('task-title')?.focus();
    },

    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        if (modal) modal.classList.add('hidden');
        if (form) form.reset();
        this.editingTaskId = null;
    },

    saveTask() {
        const taskData = {
            title: document.getElementById('task-title')?.value || '',
            description: document.getElementById('task-description')?.value || '',
            assignee: document.getElementById('task-assignee')?.value || '',
            status: document.getElementById('task-status')?.value || 'todo',
            priority: document.getElementById('task-priority')?.value || 'medium',
            deadline: document.getElementById('task-deadline')?.value || null
        };

        try {
            if (this.editingTaskId) {
                TaskManager.updateTask(this.editingTaskId, taskData);
                Notifications.success('Task updated successfully');
            } else {
                TaskManager.createTask(taskData);
                Notifications.success('Task created successfully');
            }

            this.currentFilter = { status: 'all', priority: 'all', search: '' };
            if (document.getElementById('filter-status')) document.getElementById('filter-status').value = 'all';
            if (document.getElementById('filter-priority')) document.getElementById('filter-priority').value = 'all';
            if (document.getElementById('task-search')) document.getElementById('task-search').value = '';

            this.closeTaskModal();
            this.render();
        } catch (error) {
            Notifications.error('Failed to save task', error.message);
        }
    },

    deleteTask(taskId) {
        const task = TaskManager.getTaskById(taskId);
        if (!task) return;

        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
            try {
                TaskManager.deleteTask(taskId);
                Notifications.success('Task deleted');
                this.render();
            } catch (error) {
                Notifications.error('Failed to delete task', error.message);
            }
        }
    }
};

// ============================================
// CALENDAR UI - WITH BUG FIX
// ============================================
const CalendarUI = {
    currentDate: new Date(),
    selectedDate: null,
    editingEventId: null,

    init() {
        this.setupEventListeners();
        this.render();
    },

    setupEventListeners() {
        document.getElementById('btn-add-event')?.addEventListener('click', () => this.openEventModal());
        document.getElementById('btn-add-event-empty')?.addEventListener('click', () => this.openEventModal());
        document.getElementById('btn-prev-month')?.addEventListener('click', () => this.previousMonth());
        document.getElementById('btn-next-month')?.addEventListener('click', () => this.nextMonth());
        document.getElementById('btn-today')?.addEventListener('click', () => this.goToToday());
        document.getElementById('close-event-modal')?.addEventListener('click', () => this.closeEventModal());
        document.getElementById('cancel-event')?.addEventListener('click', () => this.closeEventModal());
        document.getElementById('save-event')?.addEventListener('click', () => this.saveEvent());

        document.getElementById('event-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'event-modal') {
                this.closeEventModal();
            }
        });
    },

    render() {
        this.renderCalendar();
        this.renderEventsList();
    },

    renderCalendar() {
        const monthYearEl = document.getElementById('calendar-month-year');
        const calendarDays = document.getElementById('calendar-days');

        if (!calendarDays) return;

        const monthName = Utils.getMonthName(this.currentDate.getMonth());
        const year = this.currentDate.getFullYear();
        if (monthYearEl) {
            monthYearEl.textContent = `${monthName} ${year}`;
        }

        const monthData = Utils.getMonthData(year, this.currentDate.getMonth());
        const { daysInMonth, startingDayOfWeek } = monthData;

        const prevMonth = new Date(year, this.currentDate.getMonth(), 0);
        const prevMonthDays = prevMonth.getDate();
        const prevMonthStart = prevMonthDays - startingDayOfWeek + 1;

        const totalCells = 42;
        const days = [];

        for (let i = 0; i < startingDayOfWeek; i++) {
            const day = prevMonthStart + i;
            const date = new Date(year, this.currentDate.getMonth() - 1, day);
            days.push({ date, day, isCurrentMonth: false });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, this.currentDate.getMonth(), day);
            days.push({ date, day, isCurrentMonth: true });
        }

        const remainingCells = totalCells - days.length;
        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(year, this.currentDate.getMonth() + 1, day);
            days.push({ date, day, isCurrentMonth: false });
        }

        calendarDays.innerHTML = days.map(({ date, day, isCurrentMonth }) => {
            const isToday = Utils.isToday(date);
            const isSelected = this.selectedDate &&
                date.toDateString() === this.selectedDate.toDateString();

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

        calendarDays.querySelectorAll('.calendar-day').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const dateStr = dayEl.dataset.date;
                this.selectDate(new Date(dateStr));
            });
        });
    },

    renderEventsList() {
        const eventsList = document.getElementById('events-list');
        const emptyState = document.getElementById('events-empty');
        const listHeader = document.querySelector('.events-list h3');

        if (!eventsList || !emptyState) return;

        let events;

        if (this.selectedDate) {
            events = EventScheduler.getEventsForDate(this.selectedDate);
            if (listHeader) {
                listHeader.textContent = `Events for ${Utils.formatDate(this.selectedDate)}`;
            }
        } else {
            events = EventScheduler.getUpcomingEvents(30);
            if (listHeader) {
                listHeader.textContent = 'Upcoming Events';
            }
        }

        if (events.length === 0) {
            eventsList.style.display = 'none';
            emptyState.classList.remove('hidden');
        } else {
            eventsList.style.display = 'block';
            emptyState.classList.add('hidden');
            eventsList.innerHTML = events.map(event => this.createEventCard(event)).join('');

            // BUG FIX: Attach event listeners after rendering
            this.attachEventEventListeners();
        }
    },

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
                            <button class="btn-icon event-edit-btn" data-event-id="${event.id}" title="Edit event">
                                ✎
                            </button>
                            <button class="btn-icon event-delete-btn" data-event-id="${event.id}" title="Delete event">
                                🗑
                            </button>
                        </div>
                    </div>
                `;
    },

    // BUG FIX: Properly attach event listeners
    attachEventEventListeners() {
        document.querySelectorAll('.event-edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const eventId = button.dataset.eventId;
                console.log('Edit event:', eventId);
                this.openEventModal(eventId);
            });
        });

        document.querySelectorAll('.event-delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const eventId = button.dataset.eventId;
                console.log('Delete event:', eventId);
                this.deleteEvent(eventId);
            });
        });
    },

    selectDate(date) {
        this.selectedDate = date;
        this.render();
    },

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    },

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    },

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.render();
    },

    openEventModal(eventId = null) {
        const modal = document.getElementById('event-modal');
        const modalTitle = document.getElementById('event-modal-title');
        const form = document.getElementById('event-form');

        if (!modal || !modalTitle || !form) return;

        this.editingEventId = eventId;
        modalTitle.textContent = eventId ? 'Edit Event' : 'Add New Event';

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
            if (this.selectedDate) {
                const dateStr = this.selectedDate.toISOString().split('T')[0];
                document.getElementById('event-date').value = dateStr;
            }
        }

        modal.classList.remove('hidden');
        document.getElementById('event-title')?.focus();
    },

    closeEventModal() {
        const modal = document.getElementById('event-modal');
        const form = document.getElementById('event-form');
        if (modal) modal.classList.add('hidden');
        if (form) form.reset();
        this.editingEventId = null;
    },

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
            if (eventData.startTime && eventData.endTime && eventData.startTime >= eventData.endTime) {
                throw new Error('End time must be after start time');
            }

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
                EventScheduler.updateEvent(this.editingEventId, eventData);
                Notifications.success('Event updated successfully');
            } else {
                EventScheduler.createEvent(eventData);
                Notifications.success('Event created successfully');
            }

            this.closeEventModal();

            if (eventData.date) {
                const parts = eventData.date.split('-');
                const eventDate = new Date(parts[0], parts[1] - 1, parts[2]);
                this.selectedDate = eventDate;
                this.currentDate = new Date(eventDate);
            }

            this.render();
        } catch (error) {
            Notifications.error('Failed to save event', error.message);
        }
    },

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

// ============================================
// APP
// ============================================
const App = {
    currentView: 'tasks',
    initialized: false,

    init() {
        if (this.initialized) return;

        this.setupNavigation();
        this.initializeModules();
        this.showWelcomeMessage();

        this.initialized = true;
    },

    setupNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const view = tab.dataset.view;
                this.switchView(view);
            });
        });
    },

    switchView(viewName) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === viewName);
        });

        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}-view`);
        });

        this.currentView = viewName;

        if (viewName === 'tasks') {
            TaskUI.render();
        } else if (viewName === 'calendar') {
            CalendarUI.render();
        }
    },

    initializeModules() {
        TaskManager.init();
        EventScheduler.init();
        TaskUI.init();
        CalendarUI.init();
        Notifications.init();
    },

    showWelcomeMessage() {
        const hasSeenWelcome = localStorage.getItem('taskflow_welcome_seen');
        if (!hasSeenWelcome) {
            setTimeout(() => {
                Notifications.info('Welcome to TaskFlow! 🎉', 'Your collaborative task manager and event scheduler');
                localStorage.setItem('taskflow_welcome_seen', 'true');
            }, 500);
        }
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
    if (isTyping && e.key !== 'Escape') return;

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (App.currentView === 'tasks') {
            TaskUI.openTaskModal();
        } else {
            CalendarUI.openEventModal();
        }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        App.switchView('tasks');
    }

    if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        App.switchView('calendar');
    }

    if (e.key === 'Escape') {
        const taskModal = document.getElementById('task-modal');
        const eventModal = document.getElementById('event-modal');

        if (taskModal && !taskModal.classList.contains('hidden')) {
            e.preventDefault();
            TaskUI.closeTaskModal();
        }

        if (eventModal && !eventModal.classList.contains('hidden')) {
            e.preventDefault();
            CalendarUI.closeEventModal();
        }
    }
});

console.log('%c🚀 TaskFlow', 'font-size: 20px; font-weight: bold; color: #8b5cf6;');
console.log('%cKeyboard Shortcuts:', 'font-size: 14px; font-weight: bold;');
console.log('Ctrl/Cmd + K - Quick add (task or event)');
console.log('Ctrl/Cmd + 1 - Switch to Tasks view');
console.log('Ctrl/Cmd + 2 - Switch to Calendar view');
console.log('Escape - Close modal');