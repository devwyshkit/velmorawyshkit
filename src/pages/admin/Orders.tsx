import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminOrders = () => {
  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Order Monitoring</h1>
        <p className="text-sm md:text-base text-muted-foreground">Real-time order tracking and management</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Live Order Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Real-time order monitoring will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

