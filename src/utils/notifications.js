/**
 * Enhanced System & PWA Notification Service
 */
export const notificationService = {
  /**
   * Request browser system notification permission
   * @returns {Promise<boolean>}
   */
  async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This device/browser does not support system notifications');
      return false;
    }

    if (Notification.permission === 'granted') return true;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  },

  /**
   * Check if notifications permission is granted
   * @returns {boolean}
   */
  isGranted() {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  },

  /**
   * Check if notification permission prompt is needed (never asked before)
   * @returns {boolean}
   */
  isPermissionNeeded() {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'default';
  },

  /**
   * Trigger a System Notification (works on Mobile and Desktop)
   * @param {string} title - Notification title
   * @param {Object} options - Notification options (body, icon, badge, url, etc.)
   */
  async send(title, options = {}) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission !== 'granted') {
      return;
    }

    const defaultOptions = {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [100, 50, 100],
      tag: 'classmaster-system-alert',
      renotify: true,
      data: {
        url: options.url || window.location.href
      },
      ...options
    };

    // Play subtle audio alert if supported
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch { /* ignore */ }

    // Prefer ServiceWorker showNotification if registered (best for PWAs & Android/iOS)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, defaultOptions);
          return;
        }
      } catch (e) {
        console.warn('SW notification fallback to standard Notification:', e);
      }
    }

    // Standard Desktop Web Notification fallback
    try {
      const notification = new Notification(title, defaultOptions);
      notification.onclick = () => {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
        notification.close();
      };
      return notification;
    } catch (e) {
      console.warn('Direct notification error:', e);
    }
  },

  /**
   * Alias for send()
   */
  async notify(title, options = {}) {
    return this.send(title, options);
  }
};
