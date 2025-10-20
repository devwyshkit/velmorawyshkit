/**
 * Help Center Page
 * Feature 12: PROMPT 12
 * Searchable FAQ and support tickets
 */

import { useState } from "react";
import { HelpCircle, Search, MessageCircle, FileText, Settings, Package, DollarSign, Truck, CreditCard, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HELP_CATEGORIES } from "@/types/help";

const ICON_MAP = {
  Package, DollarSign, Truck, CreditCard, Palette, Settings
};

export const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
        <p className="text-muted-foreground">
          Find answers or contact support
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {HELP_CATEGORIES.map(category => {
            const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP];
            return (
              <Card key={category.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardContent className="p-6 text-center">
                  {IconComponent && <IconComponent className="h-12 w-12 mx-auto mb-3 text-primary" />}
                  <p className="font-medium">{category.name}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <MessageCircle className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Contact Support</h3>
                  <p className="text-sm text-muted-foreground">Get help from our team</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <FileText className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Documentation</h3>
                  <p className="text-sm text-muted-foreground">Read detailed guides</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Popular Articles */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Popular Articles</h2>
        <div className="space-y-2">
          {[
            "How to add products",
            "Setting up bulk pricing",
            "Managing orders and fulfillment",
            "Understanding commission structure",
            "Responding to customer reviews",
          ].map((article, idx) => (
            <Card key={idx} className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{article}</p>
                  <Button variant="ghost" size="sm">Read →</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

