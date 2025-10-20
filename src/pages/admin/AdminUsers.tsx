import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminUsers = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
        <p className="text-muted-foreground">Manage admin users and permissions</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Admin User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Admin user management with role-based access control will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

