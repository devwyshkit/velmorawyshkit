import { useState, useEffect } from "react";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export const PartnerAdvertising = () => {
  const { toast } = useToast();
  
  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Advertising</h1>
        <p className="text-sm text-muted-foreground">
          Request banner promotions and priority listings
        </p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            Advertising features will be available soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
