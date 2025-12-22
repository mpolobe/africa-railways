import { useEffect } from 'react';
import { messaging, VAPID_KEY } from './firebaseConfig';
import { getToken, onMessage } from 'firebase/messaging';

export const useNotifications = (trainId) => {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, { vapidKey: VAPID_KEY });
          console.log('Push Token:', token);
          
          // Logic to handle foreground messages
          onMessage(messaging, (payload) => {
            console.log('Message received: ', payload);
            alert(`🚨 ${payload.notification.title}\n\n${payload.notification.body}`);
          });
        }
      } catch (error) {
        console.error('Notification Setup Error:', error);
      }
    };

    if (trainId) setupNotifications();
  }, [trainId]);
};
