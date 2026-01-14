// ============================================
// NOTIFICATIONS MODULE - Toast Notifications
// ============================================

const Notifications = {
    container: null,
    toasts: [],

    /**
     * Initialize notification system
     */
    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            console.error('Toast container not found');
        }
    },

    /**
     * Show a notification
     * @param {string} message - Main message
     * @param {string} type - Notification type (success, error, info, warning)
     * @param {string} description - Optional description
     * @param {number} duration - Auto-dismiss duration in ms (0 for no auto-dismiss)
     */
    show(message, type = 'info', description = '', duration = 4000) {
        if (!this.container) this.init();

        const toast = this.createToast(message, type, description);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Trigger animation
        setTimeout(() => toast.style.opacity = '1', 10);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(toast), duration);
        }

        return toast;
    },

    /**
     * Create toast element
     * @param {string} message - Main message
     * @param {string} type - Notification type
     * @param {string} description - Optional description
     * @returns {HTMLElement} Toast element
     */
    createToast(message, type, description) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';

        const icon = this.getIcon(type);

        toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-message">${Utils.sanitizeHTML(message)}</div>
        ${description ? `<div class="toast-description">${Utils.sanitizeHTML(description)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close notification">✕</button>
    `;

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.dismiss(toast));

        return toast;
    },

    /**
     * Get icon for notification type
     * @param {string} type - Notification type
     * @returns {string} Icon emoji
     */
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    },

    /**
     * Dismiss a toast notification
     * @param {HTMLElement} toast - Toast element to dismiss
     */
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

    /**
     * Dismiss all notifications
     */
    dismissAll() {
        this.toasts.forEach(toast => this.dismiss(toast));
    },

    /**
     * Show success notification
     * @param {string} message - Message
     * @param {string} description - Optional description
     */
    success(message, description = '') {
        return this.show(message, 'success', description);
    },

    /**
     * Show error notification
     * @param {string} message - Message
     * @param {string} description - Optional description
     */
    error(message, description = '') {
        return this.show(message, 'error', description, 5000);
    },

    /**
     * Show warning notification
     * @param {string} message - Message
     * @param {string} description - Optional description
     */
    warning(message, description = '') {
        return this.show(message, 'warning', description);
    },

    /**
     * Show info notification
     * @param {string} message - Message
     * @param {string} description - Optional description
     */
    info(message, description = '') {
        return this.show(message, 'info', description);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Notifications;
}
