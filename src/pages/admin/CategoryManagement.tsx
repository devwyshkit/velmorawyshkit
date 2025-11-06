import { Grid } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const AdminCategoryManagement = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Category Management</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage product categories
        </p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Grid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Product Categories</h3>
          <p className="text-sm text-muted-foreground">
            Manage product categories with display ordering
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
