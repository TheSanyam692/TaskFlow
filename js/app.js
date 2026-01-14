// ============================================
// APP MODULE - Main Application Coordinator
// ============================================

const App = {
    currentView: 'tasks',

    /**
     * Initialize application
     */
    init() {
        console.log('🚀 TaskFlow initializing...');

        this.setupNavigation();
        this.initializeModules();
        this.showWelcomeMessage();

        console.log('✅ TaskFlow ready!');
    },

    /**
     * Setup view navigation
     */
    setupNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');

        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const view = tab.dataset.view;
                this.switchView(view);
            });
        });
    },

    /**
     * Switch between views
     * @param {string} viewName - View to switch to ('tasks' or 'calendar')
     */
    switchView(viewName) {
        // Update navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}-view`);
        });

        this.currentView = viewName;

        // Refresh the active view
        if (viewName === 'tasks') {
            TaskUI.render();
        } else if (viewName === 'calendar') {
            CalendarUI.render();
        }
    },

    /**
     * Initialize all modules
     */
    initializeModules() {
        // Storage is auto-initialized via direct usage

        // Initialize managers
        if (typeof TaskManager !== 'undefined') {
            TaskManager.init();
        }

        if (typeof EventScheduler !== 'undefined') {
            EventScheduler.init();
        }

        // Initialize UI modules
        if (typeof TaskUI !== 'undefined') {
            TaskUI.init();
        }

        if (typeof CalendarUI !== 'undefined') {
            CalendarUI.init();
        }

        // Initialize notifications
        if (typeof Notifications !== 'undefined') {
            Notifications.init();
        }
    },

    /**
     * Show welcome message for first-time users
     */
    showWelcomeMessage() {
        const hasSeenWelcome = localStorage.getItem('taskflow_welcome_seen');

        if (!hasSeenWelcome) {
            setTimeout(() => {
                Notifications.info(
                    'Welcome to TaskFlow! 🎉',
                    'Your collaborative task manager and event scheduler'
                );
                localStorage.setItem('taskflow_welcome_seen', 'true');
            }, 500);
        }
    },

    /**
     * Get application statistics
     * @returns {object} App statistics
     */
    getStats() {
        return {
            tasks: TaskManager.getStats(),
            events: EventScheduler.getStats(),
            storage: Storage.getStats()
        };
    },

    /**
     * Export all data
     * @returns {object} All app data
     */
    exportData() {
        return {
            tasks: TaskManager.getAllTasks(),
            events: EventScheduler.getAllEvents(),
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
    },

    /**
     * Import data from export
     * @param {object} data - Exported data
     */
    importData(data) {
        try {
            if (data.tasks) {
                Storage.set(Storage.KEYS.TASKS, data.tasks);
                TaskManager.loadTasks();
            }

            if (data.events) {
                Storage.set(Storage.KEYS.EVENTS, data.events);
                EventScheduler.loadEvents();
            }

            // Refresh UI
            if (this.currentView === 'tasks') {
                TaskUI.render();
            } else {
                CalendarUI.render();
            }

            Notifications.success('Data imported successfully');
            return true;
        } catch (error) {
            Notifications.error('Import failed', error.message);
            return false;
        }
    },

    /**
     * Clear all application data
     */
    clearAllData() {
        if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
            TaskManager.clearAllTasks();
            EventScheduler.clearAllEvents();

            TaskUI.render();
            CalendarUI.render();

            Notifications.warning('All data cleared');
        }
    },

    /**
     * Download data as JSON file
     */
    downloadData() {
        const data = this.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Notifications.success('Data downloaded');
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Expose App to global scope for console access
window.TaskFlow = App;

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K: Quick add task
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (App.currentView === 'tasks') {
            TaskUI.openTaskModal();
        } else {
            CalendarUI.openEventModal();
        }
    }

    // Cmd/Ctrl + 1: Switch to tasks
    if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        App.switchView('tasks');
    }

    // Cmd/Ctrl + 2: Switch to calendar
    if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        App.switchView('calendar');
    }

    // Escape: Close modals
    if (e.key === 'Escape') {
        const taskModal = document.getElementById('task-modal');
        const eventModal = document.getElementById('event-modal');

        if (taskModal && !taskModal.classList.contains('hidden')) {
            TaskUI.closeTaskModal();
        }

        if (eventModal && !eventModal.classList.contains('hidden')) {
            CalendarUI.closeEventModal();
        }
    }
});

// Log helpful console message
console.log('%c🚀 TaskFlow', 'font-size: 20px; font-weight: bold; color: #8b5cf6;');
console.log('%cAvailable commands:', 'font-size: 14px; font-weight: bold;');
console.log('TaskFlow.getStats() - View app statistics');
console.log('TaskFlow.exportData() - Export all data');
console.log('TaskFlow.downloadData() - Download backup file');
console.log('TaskFlow.clearAllData() - Clear all data (USE WITH CAUTION)');
console.log('\n%cKeyboard Shortcuts:', 'font-size: 14px; font-weight: bold;');
console.log('Ctrl/Cmd + K - Quick add (task or event)');
console.log('Ctrl/Cmd + 1 - Switch to Tasks view');
console.log('Ctrl/Cmd + 2 - Switch to Calendar view');
console.log('Escape - Close modal');

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
