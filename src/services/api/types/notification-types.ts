export type AppNotification = {
  id: number;
  type: string | null;
  trigger: string | null;
  title: string;
  body: string | null;
  image: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
};

export type NotificationsListResponse = {
  message: string;
  error: boolean;
  code: number;
  results: AppNotification[];
  total?: number;
};

export type StandardNotificationResponse = {
  message: string;
  error: boolean;
  code: number;
  results?: unknown;
};
