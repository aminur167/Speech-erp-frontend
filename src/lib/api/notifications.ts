import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { AppNotification } from "@/types/domain";

export async function listNotifications(
  params: { isRead?: boolean; page?: number } = {},
): Promise<PaginatedResponse<AppNotification>> {
  const { data } = await apiClient.get<PaginatedResponse<AppNotification>>("/notifications/", {
    params: { is_read: params.isRead, page: params.page },
  });
  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>("/notifications/unread-count/");
  return data.count;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data } = await apiClient.post<AppNotification>(`/notifications/${id}/read/`);
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/mark-all-read/");
}
