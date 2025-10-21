import { useState, useEffect } from "react";
import { Plus, X, Search, Calculator, ListChecks, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/integrations/supabase-client";
import { useToast } from "@/hooks/use-toast";

interface Component {
  id: string;
  name: string;
  wholesale_price: number;
  retail_price: number;
  stock: number;
  images: string[];
  partner_name?: string;
}

interface SelectedComponent extends Component {
  quantity: number;
}

interface AssemblyStep {
  step_number: number;
  instruction_text: string;
  instruction_image?: string;
}

interface HamperBuilderProps {
  onSave: (hamperData: {
    components: SelectedComponent[];
    assemblyInstructions: AssemblyStep[];
    totalCost: number;
    suggestedPrice: number;
  }) => void;
  initialComponents?: SelectedComponent[];
  initialInstructions?: AssemblyStep[];
}

/**
 * HamperBuilder Component
 * Allows partners to create combo products by selecting components
 * with real-time margin calculation
 */
export const HamperBuilder = ({
  onSave,
  initialComponents = [],
  initialInstructions = [],
}: HamperBuilderProps) => {
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableComponents, setAvailableComponents] = useState<Component[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>(initialComponents);
  const [assemblySteps, setAssemblySteps] = useState<AssemblyStep[]>(
    initialInstructions.length > 0
      ? initialInstructions
      : [{ step_number: 1, instruction_text: "" }]
  );
  const [loading, setLoading] = useState(false);

  // Load available components from Component Marketplace
  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('component_products')
        .select(`
          id,
          product:partner_products(
            id,
            name,
            price,
            stock,
            images,
            partner_id,
            partner_profiles(business_name)
          ),
          wholesale_price,
          moq,
          lead_time_days
        `)
        .eq('is_available', true)
        .gt('product.stock', 0);

      if (error) throw error;

      const components: Component[] = (data || []).map((item: any) => ({
        id: item.product.id,
        name: item.product.name,
        wholesale_price: item.wholesale_price,
        retail_price: item.product.price,
        stock: item.product.stock,
        images: item.product.images || [],
        partner_name: item.product.partner_profiles?.business_name,
      }));

      setAvailableComponents(components);
    } catch (error: any) {
      console.error('Failed to load components:', error);
      toast({
        title: "Failed to load components",
        description: "Using mock data for now",
        variant: "destructive",
      });
      // Mock fallback
      setAvailableComponents([
        {
          id: '1',
          name: 'Boat Rockerz Wireless Earbuds',
          wholesale_price: 120000,
          retail_price: 150000,
          stock: 450,
          images: ['/products/boat-rockerz.jpg'],
          partner_name: 'Boat Audio',
        },
        {
          id: '2',
          name: 'Premium Chocolate Box',
          wholesale_price: 50000,
          retail_price: 80000,
          stock: 200,
          images: ['/products/chocolates.jpg'],
          partner_name: 'ChocoCraft',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addComponent = (component: Component) => {
    const existing = selectedComponents.find(c => c.id === component.id);
    if (existing) {
      setSelectedComponents(
        selectedComponents.map(c =>
          c.id === component.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setSelectedComponents([
        ...selectedComponents,
        { ...component, quantity: 1 },
      ]);
    }
    toast({
      title: "Component added",
      description: `Added ${component.name} to hamper`,
    });
  };

  const removeComponent = (componentId: string) => {
    setSelectedComponents(selectedComponents.filter(c => c.id !== componentId));
  };

  const updateQuantity = (componentId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedComponents(
      selectedComponents.map(c =>
        c.id === componentId ? { ...c, quantity } : c
      )
    );
  };

  const addAssemblyStep = () => {
    setAssemblySteps([
      ...assemblySteps,
      {
        step_number: assemblySteps.length + 1,
        instruction_text: "",
      },
    ]);
  };

  const updateAssemblyStep = (index: number, instruction_text: string) => {
    setAssemblySteps(
      assemblySteps.map((step, i) =>
        i === index ? { ...step, instruction_text } : step
      )
    );
  };

  const removeAssemblyStep = (index: number) => {
    setAssemblySteps(
      assemblySteps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, step_number: i + 1 }))
    );
  };

  // Calculate costs and margins
  const totalCost = selectedComponents.reduce(
    (sum, c) => sum + c.wholesale_price * c.quantity,
    0
  );
  const suggestedPrice = Math.round(totalCost * 3); // 3x markup
  const platformCommission = 0.20; // 20%
  const commissionAmount = Math.round(suggestedPrice * platformCommission);
  const profit = suggestedPrice - totalCost - commissionAmount;

  const handleSave = () => {
    if (selectedComponents.length === 0) {
      toast({
        title: "No components selected",
        description: "Please add at least one component to your hamper",
        variant: "destructive",
      });
      return;
    }

    onSave({
      components: selectedComponents,
      assemblyInstructions: assemblySteps.filter(s => s.instruction_text.trim()),
      totalCost,
      suggestedPrice,
    });

    toast({
      title: "Hamper configured",
      description: "Product form updated with hamper details",
    });
  };

  const filteredComponents = availableComponents.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Selected Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Selected Components ({selectedComponents.length})</span>
            <Button onClick={() => setSearchOpen(true)} size="sm">
              <Search className="h-4 w-4 mr-2" />
              Add Component
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedComponents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No components added yet</p>
              <p className="text-sm">Click "Add Component" to start building your hamper</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedComponents.map((component) => (
                <div
                  key={component.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <img
                    src={component.images[0] || '/placeholder-product.png'}
                    alt={component.name}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{component.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {component.partner_name}
                    </p>
                    <p className="text-xs font-semibold text-primary">
                      ₹{(component.wholesale_price / 100).toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(component.id, component.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{component.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(component.id, component.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComponent(component.id)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ₹{((component.wholesale_price * component.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Margin Calculator */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5" />
            Margin Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Component Cost:</span>
            <span className="font-semibold">₹{(totalCost / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Suggested Retail Price (3x):</span>
            <span className="font-bold text-lg">₹{(suggestedPrice / 100).toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform Commission (20%):</span>
            <span className="text-destructive">-₹{(commissionAmount / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>Your Profit:</span>
            <span className="text-green-600">₹{(profit / 100).toFixed(2)}</span>
          </div>
          {profit < 0 && (
            <p className="text-xs text-destructive">
              ⚠️ Negative margin! Consider adjusting retail price.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assembly Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-5 w-5" />
            Assembly Instructions (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assemblySteps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-sm font-medium text-muted-foreground pt-2">
                {index + 1}.
              </span>
              <Textarea
                placeholder={`Step ${index + 1}: e.g., "Place chocolates in gift box"`}
                value={step.instruction_text}
                onChange={(e) => updateAssemblyStep(index, e.target.value)}
                className="flex-1"
                rows={2}
              />
              {assemblySteps.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAssemblyStep(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addAssemblyStep}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full" size="lg">
        <Eye className="h-5 w-5 mr-2" />
        Configure Hamper
      </Button>

      {/* Component Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Components</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading components...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredComponents.map((component) => (
                  <Card
                    key={component.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => addComponent(component)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <img
                          src={component.images[0] || '/placeholder-product.png'}
                          alt={component.name}
                          className="w-20 h-20 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{component.name}</p>
                          <p className="text-xs text-muted-foreground">
                            by {component.partner_name}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Wholesale</p>
                              <p className="font-bold text-primary">
                                ₹{(component.wholesale_price / 100).toFixed(2)}
                              </p>
                            </div>
                            <Badge variant="outline">{component.stock} in stock</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

