import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminContent = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">Manage help articles, FAQs, and announcements</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Help Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Help article CMS with WYSIWYG editor will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

