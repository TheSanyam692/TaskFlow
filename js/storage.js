// ============================================
// STORAGE MODULE - LocalStorage Wrapper
// ============================================

const Storage = {
  // Storage keys
  KEYS: {
    TASKS: 'taskflow_tasks',
    EVENTS: 'taskflow_events',
    SETTINGS: 'taskflow_settings'
  },

  /**
   * Get data from localStorage
   * @param {string} key - Storage key
   * @returns {any} Parsed data or null
   */
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return null;
    }
  },

  /**
   * Set data in localStorage
   * @param {string} key - Storage key
   * @param {any} value - Data to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Please clear some data.');
      } else {
        console.error(`Error writing to storage (${key}):`, error);
      }
      return false;
    }
  },

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
      return false;
    }
  },

  /**
   * Clear all app data from localStorage
   */
  clearAll() {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  /**
   * Check available storage space
   * @returns {number} Approximate available space in bytes
   */
  checkQuota() {
    try {
      const test = new Array(1024).join('a');
      let size = 0;
      
      for (let i = 0; i < 10000; i++) {
        try {
          localStorage.setItem('__test__', test);
          localStorage.removeItem('__test__');
          size += test.length;
        } catch (e) {
          localStorage.removeItem('__test__');
          break;
        }
      }
      
      return size;
    } catch (error) {
      console.error('Error checking storage quota:', error);
      return 0;
    }
  },

  /**
   * Get storage usage statistics
   * @returns {object} Storage statistics
   */
  getStats() {
    let totalSize = 0;
    const stats = {};

    Object.entries(this.KEYS).forEach(([name, key]) => {
      const data = localStorage.getItem(key);
      const size = data ? new Blob([data]).size : 0;
      stats[name] = {
        key,
        size,
        itemCount: data ? JSON.parse(data).length || 0 : 0
      };
      totalSize += size;
    });

    return {
      total: totalSize,
      items: stats
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
