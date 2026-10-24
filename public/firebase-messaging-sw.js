// Firebase Cloud Messaging Service Worker for FX Prompty
// Handles background push notifications when the app is minimized or closed

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyB0AAVJPGz1SY2LZ-C6DRZwo8M12rBdV_s',
  authDomain: 'fx-prompty.firebaseapp.com',
  projectId: 'fx-prompty',
  storageBucket: 'fx-prompty.firebasestorage.app',
  messagingSenderId: '461202466056',
  appId: '1:461202466056:web:f92114179625e9050478bd',
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background push received:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'FX Prompty';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'New trending AI prompt arrived! Discover & create now.',
      icon: '/logo.svg',
      badge: '/logo.svg',
      data: payload.data || {},
      actions: [
        { action: 'open_app', title: 'Open FX Prompty' },
      ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('Firebase Messaging SW init notice:', e);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
