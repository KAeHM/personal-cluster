"use client";

import * as React from "react";
import { BellIcon } from "lucide-react";
import { cn } from "@/common/utils/cn";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";

export type AppShellNotification = {
  id: string;
  title: string;
  description?: string;
  time?: string;
  unread?: boolean;
};

type AppShellNotificationsProps = {
  notifications: AppShellNotification[];
  className?: string;
  onNotificationSelect?: (notification: AppShellNotification) => void;
  onMarkAllRead?: () => void;
};

function AppShellNotifications({
  notifications,
  className,
  onNotificationSelect,
  onMarkAllRead,
}: AppShellNotificationsProps) {
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative size-9 shrink-0", className)}
          aria-label={
            unreadCount > 0
              ? `Notificações (${unreadCount} não lidas)`
              : "Notificações"
          }
        >
          <BellIcon className="size-4" />
          {unreadCount > 0 ? (
            <span className="bg-destructive ring-background absolute top-1.5 right-1.5 flex size-2 rounded-full ring-2" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {unreadCount > 0 && onMarkAllRead ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={onMarkAllRead}
            >
              Marcar todas como lidas
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="text-muted-foreground px-3 py-6 text-center text-sm">
            Nenhuma notificação no momento.
          </div>
        ) : (
          <DropdownMenuGroup className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex cursor-pointer flex-col items-start gap-1 px-3 py-2.5"
                onSelect={() => onNotificationSelect?.(notification)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="leading-none font-medium">
                    {notification.title}
                  </span>
                  {notification.unread ? (
                    <Badge variant="info" className="shrink-0 text-[10px]">
                      Nova
                    </Badge>
                  ) : null}
                </div>
                {notification.description ? (
                  <span className="text-muted-foreground text-xs">
                    {notification.description}
                  </span>
                ) : null}
                {notification.time ? (
                  <span className="text-muted-foreground/80 text-[11px]">
                    {notification.time}
                  </span>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AppShellNotifications };
