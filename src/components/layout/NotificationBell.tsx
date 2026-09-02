"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { clsx } from "clsx";
import { useUnreadNotificationCount } from "@/hooks/notifications/useUnreadNotificationCount";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { useMarkNotificationRead } from "@/hooks/notifications/useMarkNotificationRead";
import { useMarkAllNotificationsRead } from "@/hooks/notifications/useMarkAllNotificationsRead";
import type { AppNotification } from "@/types/domain";

function timeAgoLabel(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: unreadCount } = useUnreadNotificationCount();
  const { data, isLoading } = useNotifications(open);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleClick = (notification: AppNotification) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    setOpen(false);
    if (notification.link) router.push(notification.link);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-primary-light hover:text-text-primary"
      >
        <Bell className="h-5 w-5" />
        {Boolean(unreadCount) && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {(unreadCount as number) > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <p className="text-sm font-semibold text-text-primary">Notifications</p>
              {Boolean(unreadCount) && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="flex max-h-96 flex-col overflow-y-auto">
              {isLoading && (
                <p className="px-3 py-6 text-center text-sm text-text-secondary">Loading…</p>
              )}
              {!isLoading && data?.results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-text-secondary">
                  No notifications yet.
                </p>
              )}
              {data?.results.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleClick(notification)}
                  className={clsx(
                    "flex flex-col gap-0.5 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-primary-light/40",
                    !notification.isRead && "bg-info/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary">{notification.title}</p>
                    {!notification.isRead && (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-info" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">{notification.message}</p>
                  <p className="text-[11px] text-text-secondary/70">
                    {timeAgoLabel(notification.createdAt)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
