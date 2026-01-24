// @ts-nocheck
(() => {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    // Detect if running on GitHub Pages or manually via ?demo=true
    const IS_PRODUCTION = location.hostname.includes("github.io") ||
        window.location.search.includes("demo=true");

    const CONFIG = {
        API_BASE_URL: './api'
    };

    if (IS_PRODUCTION) {
        console.warn("⚠️ Production Mode Detected: Backend disabled.");

        // Show Banner
        window.addEventListener('DOMContentLoaded', () => {
            const banner = document.createElement('div');
            banner.style.cssText = `
                background: linear-gradient(90deg, #6366f1, #8b5cf6);
                color: white;
                text-align: center;
                padding: 10px;
                font-weight: 500;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            banner.innerHTML = '🚀 <strong>Demo Mode</strong>: Backend features are simulated. Data is saved to your browser\'s local storage.';
            document.body.prepend(banner);
            document.body.style.paddingTop = '45px'; // Push content down
        });
    }

    // ============================================
    // UTILITIES
    // ============================================
    const Utils = {
        generateId() {
            return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        },

        formatDate(date, includeTime = false) {
            if (!date) return '';
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
            if (!html) return '';
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
    // MOCK API (LOCAL STORAGE)
    // ============================================
    const MockAPI = {
        delay(ms = 300) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        getData(key) {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        },

        saveData(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        },

        async handleRequest(endpoint, method, data) {
            await this.delay(); // Simulate network latency

            console.log(`[MockAPI] ${method} ${endpoint}`, data);

            // TASKS ENDPOINT
            if (endpoint.includes('tasks.php')) {
                const tasks = this.getData('taskflow_tasks');

                if (method === 'GET') {
                    return tasks;
                }

                if (method === 'POST') {
                    const newTask = { ...data, id: Utils.generateId(), createdAt: new Date().toISOString() };
                    tasks.push(newTask);
                    this.saveData('taskflow_tasks', tasks);
                    return { success: true, task: newTask };
                }

                if (method === 'PUT') {
                    const index = tasks.findIndex(t => t.id === data.id);
                    if (index !== -1) {
                        tasks[index] = { ...tasks[index], ...data };
                        this.saveData('taskflow_tasks', tasks);
                        return { success: true, task: tasks[index] };
                    }
                    throw new Error('Task not found');
                }

                if (method === 'DELETE') {
                    const id = endpoint.split('id=')[1];
                    const newTasks = tasks.filter(t => t.id !== id);
                    this.saveData('taskflow_tasks', newTasks);
                    return { success: true };
                }
            }

            // EVENTS ENDPOINT
            if (endpoint.includes('events.php')) {
                const events = this.getData('taskflow_events');

                if (method === 'GET') {
                    return events;
                }

                if (method === 'POST') {
                    const newEvent = { ...data, id: Utils.generateId() };
                    events.push(newEvent);
                    this.saveData('taskflow_events', events);
                    return { success: true, event: newEvent };
                }

                if (method === 'PUT') {
                    const index = events.findIndex(e => e.id === data.id);
                    if (index !== -1) {
                        events[index] = { ...events[index], ...data };
                        this.saveData('taskflow_events', events);
                        return { success: true, event: events[index] };
                    }
                    throw new Error('Event not found');
                }

                if (method === 'DELETE') {
                    const id = endpoint.split('id=')[1];
                    const newEvents = events.filter(e => e.id !== id);
                    this.saveData('taskflow_events', newEvents);
                    return { success: true };
                }
            }

            return null;
        }
    };

    // ============================================
    // API SERVICE
    // ============================================
    const API = {
        async request(endpoint, method = 'GET', data = null) {
            if (IS_PRODUCTION) {
                return MockAPI.handleRequest(endpoint, method, data);
            }

            const url = `${CONFIG.API_BASE_URL}/${endpoint}`;
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            try {
                const response = await fetch(url, options);
                const contentType = response.headers.get("content-type");

                if (!response.ok) {
                    // Try to get error message from JSON
                    if (contentType && contentType.includes("application/json")) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'API request failed');
                    }
                    throw new Error(`API Request failed with status ${response.status}`);
                }

                if (contentType && contentType.includes("application/json")) {
                    return await response.json();
                }
                return null;
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        },

        get(endpoint) {
            return this.request(endpoint, 'GET');
        },

        post(endpoint, data) {
            return this.request(endpoint, 'POST', data);
        },

        put(endpoint, data) {
            return this.request(endpoint, 'PUT', data);
        },

        delete(endpoint) {
            return this.request(endpoint, 'DELETE');
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

        async init() {
            await this.loadTasks();
        },

        async loadTasks() {
            try {
                const tasks = await API.get('tasks.php');
                this.tasks = tasks || [];
                return this.tasks;
            } catch (error) {
                Notifications.error('Failed to load tasks', 'Please check your connection or database configuration.');
                this.tasks = [];
                return [];
            }
        },

        getAllTasks() {
            return this.tasks;
        },

        getTaskById(id) {
            return this.tasks.find(task => task.id === id) || null;
        },

        async createTask(taskData) {
            if (!taskData.title || taskData.title.trim() === '') {
                throw new Error('Task title is required');
            }

            const payload = {
                id: Utils.generateId(), // Generate ID here or let backend do it
                title: taskData.title.trim(),
                description: taskData.description?.trim() || '',
                assignee: taskData.assignee?.trim() || '',
                status: taskData.status || 'todo',
                priority: taskData.priority || 'medium',
                deadline: taskData.deadline || null
            };

            const response = await API.post('tasks.php', payload);
            if (response.success && response.task) {
                this.tasks.push(response.task);
                return response.task;
            } else {
                throw new Error(response.message || 'Failed to create task');
            }
        },

        async updateTask(id, updates) {
            const taskIndex = this.tasks.findIndex(task => task.id === id);
            if (taskIndex === -1) {
                throw new Error('Task not found');
            }

            if (updates.title !== undefined && updates.title.trim() === '') {
                throw new Error('Task title cannot be empty');
            }

            const payload = { id, ...updates };

            const response = await API.put('tasks.php', payload);
            if (response.success && response.task) {
                this.tasks[taskIndex] = response.task;
                return response.task;
            } else {
                throw new Error(response.message || 'Failed to update task');
            }
        },

        async deleteTask(id) {
            const taskIndex = this.tasks.findIndex(task => task.id === id);
            if (taskIndex === -1) {
                throw new Error('Task not found');
            }

            const response = await API.delete(`tasks.php?id=${id}`);
            if (response.success) {
                this.tasks.splice(taskIndex, 1);
                return true;
            } else {
                throw new Error(response.message || 'Failed to delete task');
            }
        },

        async updateStatus(id, status) {
            const validStatuses = ['todo', 'in-progress', 'completed'];
            if (!validStatuses.includes(status)) {
                throw new Error('Invalid status');
            }
            return await this.updateTask(id, { status });
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
                    (task.description && task.description.toLowerCase().includes(searchLower))
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

        async init() {
            await this.loadEvents();
        },

        async loadEvents() {
            try {
                const events = await API.get('events.php');
                this.events = events || [];
                return this.events;
            } catch (error) {
                Notifications.error('Failed to load events', error.message);
                this.events = [];
                return [];
            }
        },

        getAllEvents() {
            return this.events;
        },

        getEventById(id) {
            return this.events.find(event => event.id === id) || null;
        },

        async createEvent(eventData) {
            if (!eventData.title || eventData.title.trim() === '') {
                throw new Error('Event title is required');
            }
            if (!eventData.date) {
                throw new Error('Event date is required');
            }

            const payload = {
                id: Utils.generateId(),
                title: eventData.title.trim(),
                description: eventData.description?.trim() || '',
                date: eventData.date,
                startTime: eventData.startTime || '',
                endTime: eventData.endTime || '',
                location: eventData.location?.trim() || '',
                color: eventData.color || 'hsl(260, 70%, 55%)',
                reminder: eventData.reminder || 'none'
            };

            const response = await API.post('events.php', payload);
            if (response.success && response.event) {
                this.events.push(response.event);
                return response.event;
            } else {
                throw new Error(response.message || 'Failed to create event');
            }
        },

        async updateEvent(id, updates) {
            const eventIndex = this.events.findIndex(event => event.id === id);
            if (eventIndex === -1) {
                throw new Error('Event not found');
            }

            if (updates.title !== undefined && updates.title.trim() === '') {
                throw new Error('Event title cannot be empty');
            }

            const payload = { id, ...updates };

            const response = await API.put('events.php', payload);
            if (response.success && response.event) {
                this.events[eventIndex] = response.event;
                return response.event;
            } else {
                throw new Error(response.message || 'Failed to update event');
            }
        },

        async deleteEvent(id) {
            const eventIndex = this.events.findIndex(event => event.id === id);
            if (eventIndex === -1) {
                throw new Error('Event not found');
            }

            const response = await API.delete(`events.php?id=${id}`);
            if (response.success) {
                this.events.splice(eventIndex, 1);
                return true;
            } else {
                throw new Error(response.message || 'Failed to delete event');
            }
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
            // Since tasks are loaded async, render is called after TaskManager.init()
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

        attachTaskEventListeners() {
            document.querySelectorAll('.task-status-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const action = button.dataset.action;
                    const taskId = button.dataset.taskId;

                    // Disable button to prevent double-click
                    button.disabled = true;
                    await this.handleTaskAction(action, taskId);
                    button.disabled = false;
                });
            });

            document.querySelectorAll('.task-edit-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const taskId = button.dataset.taskId;
                    this.handleTaskAction('edit', taskId);
                });
            });

            document.querySelectorAll('.task-delete-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const taskId = button.dataset.taskId;
                    await this.handleTaskAction('delete', taskId);
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

        async handleTaskAction(action, taskId) {
            try {
                switch (action) {
                    case 'complete':
                        await TaskManager.updateStatus(taskId, 'completed');
                        Notifications.success('Task completed! 🎉');
                        this.render();
                        break;
                    case 'start':
                        await TaskManager.updateStatus(taskId, 'in-progress');
                        Notifications.success('Task started');
                        this.render();
                        break;
                    case 'edit':
                        this.openTaskModal(taskId);
                        break;
                    case 'delete':
                        if (confirm(`Are you sure you want to delete this task?`)) {
                            await TaskManager.deleteTask(taskId);
                            Notifications.success('Task deleted');
                            this.render();
                        }
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

        async saveTask() {
            const saveBtn = document.getElementById('save-task');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

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
                    await TaskManager.updateTask(this.editingTaskId, taskData);
                    Notifications.success('Task updated successfully');
                } else {
                    await TaskManager.createTask(taskData);
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
            } finally {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        }
    };

    // ============================================
    // CALENDAR UI
    // ============================================
    const CalendarUI = {
        currentDate: new Date(),
        selectedDate: null,
        editingEventId: null,

        init() {
            this.setupEventListeners();
            // Render will be called after init
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

            calendarDays.innerHTML = '';

            days.forEach(({ date, day, isCurrentMonth }) => {
                const dayEl = document.createElement('div');

                // Format date string for comparison
                const dateStr = date.toISOString().split('T')[0];
                const isToday = Utils.isToday(date);

                // Get events for this day
                const dayEvents = EventScheduler.getEventsForDate(dateStr);

                dayEl.className = `calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`;
                if (this.selectedDate && dateStr === this.selectedDate) {
                    dayEl.classList.add('selected');
                }

                dayEl.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="day-events">
                    ${dayEvents.slice(0, 3).map(event => `
                        <div class="day-event-dot" style="background-color: ${event.color}" title="${Utils.sanitizeHTML(event.title)}"></div>
                    `).join('')}
                    ${dayEvents.length > 3 ? `<div class="day-event-more">+${dayEvents.length - 3}</div>` : ''}
                </div>
            `;

                dayEl.addEventListener('click', () => {
                    this.selectedDate = dateStr;
                    this.render();
                    // Optionally scroll to events list or highlight
                });

                calendarDays.appendChild(dayEl);
            });
        },

        renderEventsList() {
            const eventsList = document.getElementById('events-list');
            const emptyState = document.getElementById('events-empty');

            if (!eventsList || !emptyState) return;

            let events;
            let title = 'Upcoming Events';

            if (this.selectedDate) {
                events = EventScheduler.getEventsForDate(this.selectedDate);
                title = `Events for ${Utils.formatDate(this.selectedDate)}`;
            } else {
                events = EventScheduler.getUpcomingEvents(30);
            }

            // Update section title if we had one (simplified for this implementation)
            const header = eventsList.previousElementSibling;
            if (header && header.tagName === 'H3') {
                header.textContent = title;
            }

            if (events.length === 0) {
                eventsList.innerHTML = '';
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
                eventsList.innerHTML = events.map(event => this.createEventCard(event)).join('');

                // Attach event listeners
                document.querySelectorAll('.event-edit-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.openEventModal(btn.dataset.eventId);
                    });
                });

                document.querySelectorAll('.event-delete-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this event?')) {
                            try {
                                await EventScheduler.deleteEvent(btn.dataset.eventId);
                                Notifications.success('Event deleted');
                                this.render();
                            } catch (err) {
                                Notifications.error('Failed to delete', err.message);
                            }
                        }
                    });
                });
            }
        },

        createEventCard(event) {
            return `
            <div class="event-card" style="border-left-color: ${event.color}">
                <div class="event-time">
                    ${event.startTime ? Utils.formatTime(event.startTime) : 'All Day'}
                </div>
                <div class="event-details">
                    <h4 class="event-title">${Utils.sanitizeHTML(event.title)}</h4>
                    ${event.location ? `<div class="event-location" style="font-size: 0.85rem; color: var(--text-tertiary);">📍 ${Utils.sanitizeHTML(event.location)}</div>` : ''}
                </div>
                <div class="event-actions">
                    <button class="btn-icon event-edit-btn" data-event-id="${event.id}">✎</button>
                    <button class="btn-icon event-delete-btn" data-event-id="${event.id}">🗑</button>
                </div>
            </div>
        `;
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
            this.selectedDate = null;
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
                // Default to selected date or today
                const defaultDate = this.selectedDate || new Date().toISOString().split('T')[0];
                document.getElementById('event-date').value = defaultDate;
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

        async saveEvent() {
            const saveBtn = document.getElementById('save-event');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

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

            // Basic validation
            if (eventData.startTime && eventData.endTime && eventData.startTime > eventData.endTime) {
                Notifications.error('Invalid time range', 'Start time must be before end time');
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
                return;
            }

            try {
                if (this.editingEventId) {
                    await EventScheduler.updateEvent(this.editingEventId, eventData);
                    Notifications.success('Event updated successfully');
                } else {
                    await EventScheduler.createEvent(eventData);
                    Notifications.success('Event created successfully');
                }

                this.closeEventModal();
                this.render();
            } catch (error) {
                Notifications.error('Failed to save event', error.message);
            } finally {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        }
    };

    // ============================================
    // APP NAVIGATION
    // ============================================
    const App = {
        init() {
            Notifications.init();

            // Initialize managers (load data)
            const initPromises = [
                TaskManager.init(),
                EventScheduler.init()
            ];

            Promise.all(initPromises).then(() => {
                // Initialize UI after data is loaded
                TaskUI.init();
                CalendarUI.init();
                this.setupNavigation();

                // Initial Render
                TaskUI.render();
                CalendarUI.render();

                // Remove loading state if implemented
                console.log('TaskFlow initialized with PHP Backend');
            }).catch(err => {
                console.error('Initialization failed:', err);
                Notifications.error('System Error', 'Failed to initialize application.');
            });
        },

        setupNavigation() {
            const navTabs = document.querySelectorAll('.nav-tab');
            const views = document.querySelectorAll('.view');

            navTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetView = tab.dataset.view;

                    // Update tabs
                    navTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    // Update views
                    views.forEach(view => {
                        view.classList.remove('active');
                        if (view.id === `${targetView}-view`) {
                            view.classList.add('active');
                        }
                    });
                });
            });
        }
    };

    // Initialize App
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
})();