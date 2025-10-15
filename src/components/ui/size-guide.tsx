import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ruler, User, Package } from "lucide-react";
import { cn } from "@/lib/utils";

// Global E-commerce Size Guide - Apparel Standard
// Universal sizing helper for clothing and accessories

interface SizeGuideProps {
  category: "apparel" | "accessories" | "shoes";
  measurements?: {
    chest?: number;
    waist?: number;
    height?: number;
    weight?: number;
  };
  className?: string;
}

export const SizeGuide = ({ category, measurements, className }: SizeGuideProps) => {
  const apparelSizes = [
    { size: "XS", chest: "34-36", waist: "28-30", length: "26" },
    { size: "S", chest: "36-38", waist: "30-32", length: "27" },
    { size: "M", chest: "38-40", waist: "32-34", length: "28" },
    { size: "L", chest: "40-42", waist: "34-36", length: "29" },
    { size: "XL", chest: "42-44", waist: "36-38", length: "30" },
    { size: "XXL", chest: "44-46", waist: "38-40", length: "31" }
  ];

  const getSizeRecommendation = () => {
    if (!measurements?.chest) return null;
    
    const chest = measurements.chest;
    if (chest <= 36) return "XS";
    if (chest <= 38) return "S";
    if (chest <= 40) return "M";
    if (chest <= 42) return "L";
    if (chest <= 44) return "XL";
    return "XXL";
  };

  const recommendedSize = getSizeRecommendation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <Ruler className="h-4 w-4" />
          Size Guide
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Size Guide - {category.charAt(0).toUpperCase() + category.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="guide" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guide">Size Chart</TabsTrigger>
            <TabsTrigger value="measure">How to Measure</TabsTrigger>
            <TabsTrigger value="fit">Fit Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="guide">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Size Chart (in inches)</CardTitle>
                {recommendedSize && (
                  <Badge variant="secondary" className="w-fit">
                    Recommended for you: {recommendedSize}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Size</th>
                        <th className="text-left p-2 font-medium">Chest</th>
                        <th className="text-left p-2 font-medium">Waist</th>
                        <th className="text-left p-2 font-medium">Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apparelSizes.map((size) => (
                        <tr 
                          key={size.size} 
                          className={cn(
                            "border-b hover:bg-muted/50",
                            recommendedSize === size.size && "bg-primary/10 border-primary/30"
                          )}
                        >
                          <td className="p-2 font-medium">
                            {size.size}
                            {recommendedSize === size.size && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Recommended
                              </Badge>
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground">{size.chest}</td>
                          <td className="p-2 text-muted-foreground">{size.waist}</td>
                          <td className="p-2 text-muted-foreground">{size.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Size Notes:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• All measurements are in inches</li>
                    <li>• For best fit, measure over light clothing</li>
                    <li>• If you're between sizes, choose the larger size</li>
                    <li>• Custom sizing available for bulk orders (25+ pieces)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="measure">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  How to Measure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Chest Measurement</h4>
                      <p className="text-sm text-muted-foreground">
                        Measure around the fullest part of your chest, keeping the measuring tape parallel to the floor.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Waist Measurement</h4>
                      <p className="text-sm text-muted-foreground">
                        Measure around your natural waistline, the narrowest part of your torso.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Length Measurement</h4>
                      <p className="text-sm text-muted-foreground">
                        Measure from the highest point of your shoulder down to where you want the garment to end.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fit">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fit Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Chest (inches)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 38"
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Waist (inches)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 32"
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <Button className="w-full">Calculate My Size</Button>

                {recommendedSize && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <h4 className="font-medium text-primary mb-2">Your Recommended Size</h4>
                    <div className="text-2xl font-bold text-primary">{recommendedSize}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on your measurements, we recommend size {recommendedSize} for the best fit.
                    </p>
                  </div>
                )}

                <div className="text-center">
                  <Button variant="outline" size="sm">
                    Still need help? Chat with our sizing expert
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};