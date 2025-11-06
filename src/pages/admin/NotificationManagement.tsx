import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const AdminNotificationManagement = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Notification Management</h1>
        <p className="text-sm text-muted-foreground">
          Send targeted notifications to users and partners
        </p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Notification Campaigns</h3>
          <p className="text-sm text-muted-foreground">
            Create and send targeted notification campaigns
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
