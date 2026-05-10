
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
            audio.play().catch(e => console.warn('Audio play failed (browser policy):', e));
        } catch (e) {
            console.error('Failed to play sound:', e);
        }
    },

    /**
     * Trigger a system notification with sound
     * @param {string} title 
     * @param {Object} options 
     */
    async notify(title, options = {}) {
        // 1. Play sound
        this.playSound();

        // 2. Show system notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            const defaultOptions = {
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                silent: true, // We handle sound ourselves for better control
                ...options
            };
            
            try {
                const n = new Notification(title, defaultOptions);
                
                // Close after 5 seconds by default
                if (!options.requireInteraction) {
                    setTimeout(() => n.close(), 5000);
                }

                n.onclick = () => {
                    window.focus();
                    n.close();
                };
            } catch (e) {
                console.error('Notification error:', e);
            }
        }
    }
};
