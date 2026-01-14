// ============================================
// UTILITIES MODULE - Helper Functions
// ============================================

const Utils = {
    /**
     * Generate a unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Format date to readable string
     * @param {Date|string} date - Date to format
     * @param {boolean} includeTime - Include time in output
     * @returns {string} Formatted date string
     */
    formatDate(date, includeTime = false) {
        const d = new Date(date);

        if (isNaN(d.getTime())) {
            return 'Invalid Date';
        }

        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return d.toLocaleDateString('en-US', options);
    },

    /**
     * Format time from HH:MM to readable format
     * @param {string} time - Time in HH:MM format
     * @returns {string} Formatted time
     */
    formatTime(time) {
        if (!time) return '';

        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

        return `${displayHour}:${minutes} ${ampm}`;
    },

    /**
     * Get relative time string (e.g., "2 days ago")
     * @param {Date|string} date - Date to compare
     * @returns {string} Relative time string
     */
    getRelativeTime(date) {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return this.formatDate(date);
    },

    /**
     * Get days until a deadline
     * @param {Date|string} deadline - Deadline date
     * @returns {number} Days until deadline (negative if past)
     */
    getDaysUntil(deadline) {
        const d = new Date(deadline);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);

        const diffMs = d - now;
        return Math.ceil(diffMs / 86400000);
    },

    /**
     * Format deadline with context (e.g., "Due in 3 days")
     * @param {Date|string} deadline - Deadline date
     * @returns {string} Formatted deadline string
     */
    formatDeadline(deadline) {
        if (!deadline) return 'No deadline';

        const days = this.getDaysUntil(deadline);

        if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''}`;
        if (days === 0) return 'Due today';
        if (days === 1) return 'Due tomorrow';
        if (days <= 7) return `Due in ${days} days`;

        return `Due ${this.formatDate(deadline)}`;
    },

    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
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

    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    },

    /**
     * Escape special regex characters
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    /**
     * Deep clone an object
     * @param {any} obj - Object to clone
     * @returns {any} Cloned object
     */
    deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            console.error('Error cloning object:', error);
            return obj;
        }
    },

    /**
     * Sort array by property
     * @param {Array} array - Array to sort
     * @param {string} property - Property to sort by
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array} Sorted array
     */
    sortBy(array, property, order = 'asc') {
        return array.sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];

            if (aVal === bVal) return 0;

            const comparison = aVal > bVal ? 1 : -1;
            return order === 'asc' ? comparison : -comparison;
        });
    },

    /**
     * Truncate string with ellipsis
     * @param {string} str - String to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated string
     */
    truncate(str, maxLength = 100) {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    },

    /**
     * Get initials from name
     * @param {string} name - Full name
     * @returns {string} Initials
     */
    getInitials(name) {
        if (!name) return '';

        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    },

    /**
     * Check if date is today
     * @param {Date|string} date - Date to check
     * @returns {boolean} Is today
     */
    isToday(date) {
        const d = new Date(date);
        const today = new Date();

        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    },

    /**
     * Get calendar month data
     * @param {number} year - Year
     * @param {number} month - Month (0-11)
     * @returns {object} Month data
     */
    getMonthData(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return {
            year,
            month,
            daysInMonth,
            startingDayOfWeek,
            firstDay,
            lastDay
        };
    },

    /**
     * Get month name
     * @param {number} month - Month (0-11)
     * @returns {string} Month name
     */
    getMonthName(month) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month];
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
