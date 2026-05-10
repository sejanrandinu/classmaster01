
/**
 * Utility for handling System Notifications and Sound Alerts
 */

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'; // A clean "ping" sound

export const notificationService = {
    /**
     * Request permission for system notifications
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('This browser does not support system notifications');
            return false;
        }

        if (Notification.permission === 'granted') return true;

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },

    /**
     * Play a notification sound
     */
    playSound() {
        try {
            const audio = new Audio(NOTIFICATION_SOUND_URL);
            audio.play().catch(e => {
                console.warn('Audio play failed (browser policy):', e);
                // Fallback: Use vibration if audio fails
                this.vibrate();
            });
        } catch (e) {
            console.error('Failed to play sound:', e);
        }
    },

    /**
     * Vibrate the device
     */
    vibrate() {
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]); // Short vibration pattern
        }
    },

    /**
     * Trigger a system notification with sound
     * @param {string} title 
     * @param {Object} options 
     */
    async notify(title, options = {}) {
        // 1. Play sound & Vibrate
        this.playSound();
        this.vibrate();

        // 2. Show system notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            const defaultOptions = {
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                vibrate: [200, 100, 200],
                tag: 'classmaster-notify',
                renotify: true,
                silent: true, 
                ...options
            };
            
            try {
                // For mobile browsers (especially Chrome), new Notification() 
                // sometimes requires a service worker registration.
                // We'll try the direct way first.
                const n = new Notification(title, defaultOptions);
                
                if (!options.requireInteraction) {
                    setTimeout(() => n.close(), 5000);
                }

                n.onclick = () => {
                    window.focus();
                    n.close();
                };
            } catch (e) {
                console.error('Direct notification failed, might need Service Worker:', e);
            }
        }
    }
};
