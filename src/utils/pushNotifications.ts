import { app, db, doc, setDoc } from '../firebase';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

const DEVICE_ID_KEY = 'fx_device_id';
const NOTIFY_PREF_KEY = 'fx_notify_pref';

/**
 * Returns a persistent unique device identifier across sessions
 */
export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server_id';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'fx_dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
};

/**
 * Checks whether push notifications are supported in the current environment
 */
export const isPushSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Checks current push notification state
 */
export const isPushNotificationActive = (): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  const pref = localStorage.getItem(NOTIFY_PREF_KEY);
  if (pref === 'false') return false;
  return Notification.permission === 'granted';
};

export interface SubscribePushOptions {
  isGuest: boolean;
  uid?: string | null;
}

export interface SubscribePushResult {
  success: boolean;
  token?: string | null;
  deviceId: string;
  error?: string;
}

/**
 * Requests notification permission, retrieves FCM token, saves subscriber info to Firestore,
 * and triggers an immediate local confirmation notification.
 */
export const subscribeToPushNotifications = async (
  options: SubscribePushOptions
): Promise<SubscribePushResult> => {
  const deviceId = getDeviceId();

  if (!isPushSupported()) {
    return {
      success: false,
      deviceId,
      error: 'Push notifications are not supported in this browser.',
    };
  }

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      localStorage.setItem(NOTIFY_PREF_KEY, 'false');
      return {
        success: false,
        deviceId,
        error: permission === 'denied'
          ? 'Notification permission was denied in your browser settings.'
          : 'Notification permission was dismissed.',
      };
    }

    // 2. Mark active in local storage
    localStorage.setItem(NOTIFY_PREF_KEY, 'true');

    // 3. Register service worker and retrieve FCM token if available
    let token: string | null = null;
    try {
      const messagingSupported = await isSupported().catch(() => false);
      if (messagingSupported && app) {
        let swReg: ServiceWorkerRegistration | undefined;
        if ('serviceWorker' in navigator) {
          swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js').catch((err) => {
            console.warn('Service worker registration note:', err);
            return undefined;
          });
        }

        const messaging = getMessaging(app);
        token = await getToken(messaging, {
          serviceWorkerRegistration: swReg,
        }).catch((err) => {
          console.warn('FCM token retrieval notice (standard fallback active):', err);
          return null;
        });
      }
    } catch (tokenErr) {
      console.warn('Error during FCM token retrieval:', tokenErr);
    }

    // 4. Save device subscription and topics in Firestore
    if (db) {
      try {
        await setDoc(
          doc(db, 'push_subscribers', deviceId),
          {
            deviceId,
            token: token || null,
            isGuest: Boolean(options.isGuest),
            uid: options.uid || null,
            active: true,
            topics: ['new_prompts', 'app_updates'],
            platform: 'web',
            userAgent: navigator.userAgent,
            subscribedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn('Firestore push_subscribers write notice:', dbErr);
      }
    }

    // 5. Trigger local confirmation notification
    try {
      if (Notification.permission === 'granted') {
        const title = 'Notifications enabled for FX Prompty!';
        const body = 'You will receive instant alerts about new trending prompts, styles, and updates.';
        const icon = '/logo.svg';

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon,
              badge: icon,
            }).catch(() => {
              new Notification(title, { body, icon });
            });
          }).catch(() => {
            new Notification(title, { body, icon });
          });
        } else {
          new Notification(title, { body, icon });
        }
      }
    } catch (notifyErr) {
      console.warn('Local confirmation notification notice:', notifyErr);
    }

    return {
      success: true,
      token,
      deviceId,
    };
  } catch (err: any) {
    console.error('Failed to enable push notifications:', err);
    return {
      success: false,
      deviceId,
      error: err.message || 'Failed to enable push notifications.',
    };
  }
};

/**
 * Disables push notifications for this device
 */
export const unsubscribeFromPushNotifications = async (): Promise<{ success: boolean }> => {
  const deviceId = getDeviceId();
  localStorage.setItem(NOTIFY_PREF_KEY, 'false');

  if (db) {
    try {
      await setDoc(
        doc(db, 'push_subscribers', deviceId),
        {
          active: false,
          unsubscribedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore push_subscribers unsubscribe notice:', e);
    }
  }

  return { success: true };
};
