// Browser notification & sound utility for SGM ERP / Google Tasks alerts

export const requestBrowserNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações de sistema.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendSystemNotification = (title: string, body: string, icon?: string) => {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  } catch (err) {
    console.warn('Erro ao disparar notificação do sistema:', err);
  }
};
