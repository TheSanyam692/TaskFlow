// ============================================
// TASK UI MODULE - Task Interface Components
// ============================================

const TaskUI = {
    currentFilter: {
        status: 'all',
        priority: 'all',
        search: ''
    },
    currentSort: 'created',
    editingTaskId: null,

    /**
     * Initialize task UI
     */
    init() {
        this.setupEventListeners();
        this.render();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add task buttons
        document.getElementById('btn-add-task')?.addEventListener('click', () => this.openTaskModal());
        document.getElementById('btn-add-task-empty')?.addEventListener('click', () => this.openTaskModal());

        // Modal controls
        document.getElementById('close-task-modal')?.addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancel-task')?.addEventListener('click', () => this.closeTaskModal());
        document.getElementById('save-task')?.addEventListener('click', () => this.saveTask());

        // Close modal on overlay click
        document.getElementById('task-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                this.closeTaskModal();
            }
        });

        // Search
        const searchInput = document.getElementById('task-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.currentFilter.search = e.target.value;
                this.render();
            }, 300));
        }

        // Filters
        document.getElementById('filter-status')?.addEventListener('change', (e) => {
            this.currentFilter.status = e.target.value;
            this.render();
        });

        document.getElementById('filter-priority')?.addEventListener('change', (e) => {
            this.currentFilter.priority = e.target.value;
            this.render();
        });

        // Sort
        document.getElementById('sort-tasks')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.render();
        });
    },

    /**
     * Render task list
     */
    render() {
        const taskGrid = document.getElementById('task-grid');
        const emptyState = document.getElementById('tasks-empty');

        if (!taskGrid || !emptyState) return;

        // Get filtered and sorted tasks
        let tasks = TaskManager.filterTasks(this.currentFilter);
        tasks = TaskManager.sortTasks(tasks, this.currentSort);

        // Show/hide empty state
        if (tasks.length === 0) {
            taskGrid.style.display = 'none';
            emptyState.classList.remove('hidden');
        } else {
            taskGrid.style.display = 'grid';
            emptyState.classList.add('hidden');

            // Render tasks
            taskGrid.innerHTML = tasks.map(task => this.createTaskCard(task)).join('');

            // Add event listeners to task cards
            this.attachTaskEventListeners();
        }
    },

    /**
     * Create task card HTML
     * @param {object} task - Task object
     * @returns {string} HTML string
     */
    createTaskCard(task) {
        const statusClass = task.status.replace('-', '');
        const priorityClass = task.priority;
        const deadlineText = task.deadline ? Utils.formatDeadline(task.deadline) : '';
        const isOverdue = task.deadline && Utils.getDaysUntil(task.deadline) < 0 && task.status !== 'completed';

        return `
      <div class="task-card" data-task-id="${task.id}">
        <div class="task-header">
          <div>
            <h3 class="task-title">${Utils.sanitizeHTML(task.title)}</h3>
            <div class="task-meta">
              <span class="badge badge-status ${statusClass}">${this.getStatusLabel(task.status)}</span>
              <span class="badge badge-priority ${priorityClass}">${task.priority}</span>
            </div>
          </div>
        </div>
        
        ${task.description ? `
          <p class="task-description">${Utils.sanitizeHTML(Utils.truncate(task.description, 120))}</p>
        ` : ''}
        
        ${task.assignee ? `
          <div style="margin-bottom: var(--space-md);">
            <span style="font-size: 0.85rem; color: var(--text-tertiary);">👤 ${Utils.sanitizeHTML(task.assignee)}</span>
          </div>
        ` : ''}
        
        <div class="task-footer">
          <div class="task-info">
            ${task.deadline ? `
              <div style="color: ${isOverdue ? 'var(--priority-high)' : 'var(--text-tertiary)'};">
                📅 ${deadlineText}
              </div>
            ` : ''}
            <div style="font-size: 0.75rem; margin-top: var(--space-xs);">
              ${Utils.getRelativeTime(task.createdAt)}
            </div>
          </div>
          <div class="task-actions">
            ${task.status !== 'completed' ? `
              <button class="btn-icon" data-action="complete" data-task-id="${task.id}" title="Mark as completed">
                ✓
              </button>
            ` : ''}
            ${task.status === 'todo' ? `
              <button class="btn-icon" data-action="start" data-task-id="${task.id}" title="Start task">
                ▶
              </button>
            ` : ''}
            <button class="btn-icon" data-action="edit" data-task-id="${task.id}" title="Edit task">
              ✎
            </button>
            <button class="btn-icon" data-action="delete" data-task-id="${task.id}" title="Delete task">
              🗑
            </button>
          </div>
        </div>
      </div>
    `;
    },

    /**
     * Get status label
     * @param {string} status - Status value
     * @returns {string} Label text
     */
    getStatusLabel(status) {
        const labels = {
            'todo': 'To-Do',
            'in-progress': 'In Progress',
            'completed': 'Completed'
        };
        return labels[status] || status;
    },

    /**
     * Attach event listeners to task cards
     */
    attachTaskEventListeners() {
        // Action buttons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = button.dataset.action;
                const taskId = button.dataset.taskId;
                this.handleTaskAction(action, taskId);
            });
        });
    },

    /**
     * Handle task action
     * @param {string} action - Action type
     * @param {string} taskId - Task ID
     */
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

    /**
     * Open task modal
     * @param {string} taskId - Optional task ID for editing
     */
    openTaskModal(taskId = null) {
        const modal = document.getElementById('task-modal');
        const modalTitle = document.getElementById('task-modal-title');
        const form = document.getElementById('task-form');

        if (!modal || !modalTitle || !form) return;

        this.editingTaskId = taskId;

        // Set modal title
        modalTitle.textContent = taskId ? 'Edit Task' : 'Add New Task';

        // Reset or populate form
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

        // Show modal
        modal.classList.remove('hidden');
        document.getElementById('task-title')?.focus();
    },

    /**
     * Close task modal
     */
    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');

        if (modal) modal.classList.add('hidden');
        if (form) form.reset();

        this.editingTaskId = null;
    },

    /**
     * Save task
     */
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
                // Update existing task
                TaskManager.updateTask(this.editingTaskId, taskData);
                Notifications.success('Task updated successfully');
            } else {
                // Create new task
                TaskManager.createTask(taskData);
                Notifications.success('Task created successfully');
            }

            this.closeTaskModal();
            this.render();
        } catch (error) {
            Notifications.error('Failed to save task', error.message);
        }
    },

    /**
     * Delete task with confirmation
     * @param {string} taskId - Task ID
     */
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskUI;
}
