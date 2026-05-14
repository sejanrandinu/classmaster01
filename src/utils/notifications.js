export const notificationService = {
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async send(title, options = {}) {
    if (Notification.permission !== 'granted') return;
    
    return new Notification(title, {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      ...options
    });
  }
};
