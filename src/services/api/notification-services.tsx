import EndPoints from './EndPoints';
import { Api } from './Middleware';
import type {
  AppNotification,
  NotificationsListResponse,
  StandardNotificationResponse,
} from './types/notification-types';

/**
 * Notification Services
 * API client for the in-app notification center.
 */
class NotificationServices {
  /** Paginated list of the current user's visible notifications (newest first). */
  getNotifications = (page = 1, perPage = 20) => {
    return new Promise<{ results: AppNotification[]; total: number }>(
      (resolve, reject) => {
        Api.get(EndPoints.notifications, {
          params: { page, per_page: perPage },
        })
          .then((response) => {
            const data = response.data as NotificationsListResponse;
            if (data?.error === true) {
              reject(data?.message || 'Failed to fetch notifications');
              return;
            }
            resolve({
              results: Array.isArray(data?.results) ? data.results : [],
              total: data?.total ?? 0,
            });
          })
          .catch((error) => {
            reject(
              error?.response?.data?.message ||
                error?.message ||
                'Failed to fetch notifications'
            );
          });
      }
    );
  };

  markAsRead = (id: number) => {
    return new Promise<void>((resolve, reject) => {
      Api.post(EndPoints.notificationMarkRead(id))
        .then((response) => {
          const data = response.data as StandardNotificationResponse;
          if (data?.error === true) {
            reject(data?.message || 'Failed to mark as read');
            return;
          }
          resolve();
        })
        .catch((error) => {
          reject(error?.response?.data?.message || 'Failed to mark as read');
        });
    });
  };

  markAllAsRead = () => {
    return new Promise<void>((resolve, reject) => {
      Api.post(EndPoints.notificationsMarkAllRead)
        .then((response) => {
          const data = response.data as StandardNotificationResponse;
          if (data?.error === true) {
            reject(data?.message || 'Failed to mark all as read');
            return;
          }
          resolve();
        })
        .catch((error) => {
          reject(
            error?.response?.data?.message || 'Failed to mark all as read'
          );
        });
    });
  };

  markPhotoApprovalsAsRead = () => {
    return new Promise<void>((resolve, reject) => {
      Api.post(EndPoints.notificationPhotoApprovalsMarkRead)
        .then((response) => {
          const data = response.data as StandardNotificationResponse;
          if (data?.error === true) {
            reject(data?.message || 'Failed to mark photo approvals as read');
            return;
          }
          resolve();
        })
        .catch((error) => {
          reject(
            error?.response?.data?.message ||
              'Failed to mark photo approvals as read'
          );
        });
    });
  };

  deleteNotification = (id: number) => {
    return new Promise<void>((resolve, reject) => {
      Api.delete(EndPoints.notificationDelete(id))
        .then((response) => {
          const data = response.data as StandardNotificationResponse;
          if (data?.error === true) {
            reject(data?.message || 'Failed to delete notification');
            return;
          }
          resolve();
        })
        .catch((error) => {
          reject(
            error?.response?.data?.message || 'Failed to delete notification'
          );
        });
    });
  };

  clearAll = () => {
    return new Promise<void>((resolve, reject) => {
      Api.delete(EndPoints.notificationsClearAll)
        .then((response) => {
          const data = response.data as StandardNotificationResponse;
          if (data?.error === true) {
            reject(data?.message || 'Failed to clear notifications');
            return;
          }
          resolve();
        })
        .catch((error) => {
          reject(
            error?.response?.data?.message || 'Failed to clear notifications'
          );
        });
    });
  };
}

const notificationServices = new NotificationServices();
export default notificationServices;
