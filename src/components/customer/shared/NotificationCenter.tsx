import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Bell, Check, X, Package, FileImage, CreditCard, Truck, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, type Notification } from "@/lib/mock-notifications";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'order_update':
      return Package;
    case 'preview_ready':
      return FileImage;
    case 'payment_confirmation':
      return CreditCard;
    case 'delivery':
      return Truck;
    case 'promotional':
      return Gift;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'order_update':
      return 'text-blue-600 bg-blue-50';
    case 'preview_ready':
      return 'text-purple-600 bg-purple-50';
    case 'payment_confirmation':
      return 'text-green-600 bg-green-50';
    case 'delivery':
      return 'text-orange-600 bg-orange-50';
    case 'promotional':
      return 'text-pink-600 bg-pink-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

// Helper to load notifications synchronously (Swiggy 2025 pattern)
const loadNotificationsSync = (): Notification[] => {
  try {
    return getNotifications();
  } catch (error) {
    return [];
  }
};

export const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const navigate = useNavigate();
  // Swiggy 2025: Initialize notifications synchronously to prevent empty flash
  const [notifications, setNotifications] = useState<Notification[]>(() => loadNotificationsSync());

  useEffect(() => {
    if (isOpen) {
      // Refresh notifications synchronously
      const allNotifications = getNotifications();
      setNotifications(allNotifications);
    }
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate to relevant page
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    } else if (notification.orderId) {
      navigate(RouteMap.track(notification.orderId));
      onClose();
    }
    
    // Refresh notifications
    setNotifications(getNotifications());
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    setNotifications(getNotifications());
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification(notificationId);
    setNotifications(getNotifications());
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 flex flex-col overflow-hidden">
        {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
        <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Scrollable Content - Swiggy 2025 Pattern: Snap scrolling */}
        <div className="flex-1 overflow-y-auto snap-y snap-mandatory px-6">
          <SheetHeader className="text-left pb-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </SheetDescription>
              </div>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                  Mark all read
                </Button>
              )}
            </div>
          </SheetHeader>

          {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You're all caught up! We'll notify you when there's something new.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-colors",
                    notification.read 
                      ? "bg-background border-border hover:bg-muted/50" 
                      : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.createdAt).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};



