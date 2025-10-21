import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminContent = () => {
  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Content Management</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage help articles, FAQs, and announcements</p>
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

