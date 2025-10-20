import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Configure commission, policies, and integrations</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Platform Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Platform settings and integration status will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

