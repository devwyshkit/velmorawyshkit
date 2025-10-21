import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminAnalytics = () => {
  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-sm md:text-base text-muted-foreground">Revenue, partners, and performance metrics</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Comprehensive analytics with charts will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

