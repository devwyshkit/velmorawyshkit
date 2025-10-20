import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminDisputes = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dispute Management</h1>
        <p className="text-muted-foreground">Escalated disputes requiring admin intervention</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Escalated Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Disputes >48 hours will be displayed here with admin override powers
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

