import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminPayouts = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payout Management</h1>
        <p className="text-muted-foreground">Process partner payouts with Zoho Books integration</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pending Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Payout processing and Zoho Books sync will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

