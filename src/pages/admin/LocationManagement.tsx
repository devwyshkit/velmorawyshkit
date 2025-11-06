import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const AdminLocationManagement = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Location Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage delivery zones and serviceable areas
        </p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Delivery Zones</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage delivery zones with zone-specific pricing
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
