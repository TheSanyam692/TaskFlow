// ============================================
// TASK MANAGER MODULE - Task Data & Logic
// ============================================

const TaskManager = {
    tasks: [],

    /**
     * Initialize task manager
     */
    init() {
        this.loadTasks();
    },

    /**
     * Load tasks from storage
     */
    loadTasks() {
        const storedTasks = Storage.get(Storage.KEYS.TASKS);
        this.tasks = storedTasks || [];
        return this.tasks;
    },

    /**
     * Save tasks to storage
     */
    saveTasks() {
        return Storage.set(Storage.KEYS.TASKS, this.tasks);
    },

    /**
     * Get all tasks
     * @returns {Array} All tasks
     */
    getAllTasks() {
        return this.tasks;
    },

    /**
     * Get task by ID
     * @param {string} id - Task ID
     * @returns {object|null} Task object or null
     */
    getTaskById(id) {
        return this.tasks.find(task => task.id === id) || null;
    },

    /**
     * Create a new task
     * @param {object} taskData - Task data
     * @returns {object} Created task
     */
    createTask(taskData) {
        // Validate required fields
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

    /**
     * Update a task
     * @param {string} id - Task ID
     * @param {object} updates - Fields to update
     * @returns {object|null} Updated task or null
     */
    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);

        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        // Validate title if being updated
        if (updates.title !== undefined && updates.title.trim() === '') {
            throw new Error('Task title cannot be empty');
        }

        const task = this.tasks[taskIndex];

        // Update fields
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                task[key] = updates[key];
            }
        });

        task.updatedAt = new Date().toISOString();

        this.saveTasks();
        return task;
    },

    /**
     * Delete a task
     * @param {string} id - Task ID
     * @returns {boolean} Success status
     */
    deleteTask(id) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => task.id !== id);

        if (this.tasks.length === initialLength) {
            throw new Error('Task not found');
        }

        this.saveTasks();
        return true;
    },

    /**
     * Update task status
     * @param {string} id - Task ID
     * @param {string} status - New status
     * @returns {object} Updated task
     */
    updateStatus(id, status) {
        const validStatuses = ['todo', 'in-progress', 'completed'];

        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        return this.updateTask(id, { status });
    },

    /**
     * Filter tasks
     * @param {object} filters - Filter criteria
     * @returns {Array} Filtered tasks
     */
    filterTasks(filters = {}) {
        let filtered = [...this.tasks];

        // Filter by status
        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(task => task.status === filters.status);
        }

        // Filter by priority
        if (filters.priority && filters.priority !== 'all') {
            filtered = filtered.filter(task => task.priority === filters.priority);
        }

        // Filter by assignee
        if (filters.assignee) {
            filtered = filtered.filter(task =>
                task.assignee.toLowerCase().includes(filters.assignee.toLowerCase())
            );
        }

        // Search in title and description
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchLower) ||
                task.description.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    },

    /**
     * Sort tasks
     * @param {Array} tasks - Tasks to sort
     * @param {string} sortBy - Sort criteria
     * @returns {Array} Sorted tasks
     */
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

            case 'title':
                return sorted.sort((a, b) =>
                    a.title.localeCompare(b.title)
                );

            case 'updated':
                return sorted.sort((a, b) =>
                    new Date(b.updatedAt) - new Date(a.updatedAt)
                );

            case 'created':
            default:
                return sorted.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
        }
    },

    /**
     * Get task statistics
     * @returns {object} Task statistics
     */
    getStats() {
        const total = this.tasks.length;
        const byStatus = {
            todo: this.tasks.filter(t => t.status === 'todo').length,
            'in-progress': this.tasks.filter(t => t.status === 'in-progress').length,
            completed: this.tasks.filter(t => t.status === 'completed').length
        };
        const byPriority = {
            high: this.tasks.filter(t => t.priority === 'high').length,
            medium: this.tasks.filter(t => t.priority === 'medium').length,
            low: this.tasks.filter(t => t.priority === 'low').length
        };
        const overdue = this.tasks.filter(t =>
            t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
        ).length;

        return {
            total,
            byStatus,
            byPriority,
            overdue
        };
    },

    /**
     * Get tasks by status
     * @param {string} status - Task status
     * @returns {Array} Tasks with specified status
     */
    getTasksByStatus(status) {
        return this.tasks.filter(task => task.status === status);
    },

    /**
     * Get overdue tasks
     * @returns {Array} Overdue tasks
     */
    getOverdueTasks() {
        const now = new Date();
        return this.tasks.filter(task =>
            task.deadline &&
            new Date(task.deadline) < now &&
            task.status !== 'completed'
        );
    },

    /**
     * Get upcoming tasks (within next 7 days)
     * @returns {Array} Upcoming tasks
     */
    getUpcomingTasks() {
        const now = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);

        return this.tasks.filter(task => {
            if (!task.deadline || task.status === 'completed') return false;
            const deadline = new Date(task.deadline);
            return deadline >= now && deadline <= weekFromNow;
        });
    },

    /**
     * Clear all tasks
     */
    clearAllTasks() {
        this.tasks = [];
        this.saveTasks();
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TaskManager.init());
} else {
    TaskManager.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskManager;
}
