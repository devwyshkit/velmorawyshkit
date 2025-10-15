import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { 
  Gift, 
  Heart, 
  Cake, 
  Shirt, 
  Coffee, 
  Star,
  Briefcase,
  Users,
  Calendar,
  Sparkles,
  Crown,
  Baby,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

// Global E-commerce Standard Occasion Grid - Amazon/Flipkart Pattern
// Visual occasion cards with trending indicators and social proof - DLS Compliant

interface OccasionCategory {
  id: string;
  name: string;
  icon: any;
  image: string;
  trending: boolean;
  popularProducts: number;
  avgPrice: string;
  deliveryTime: string;
  description: string;
  gradient: string;
}

interface OccasionGridProps {
  onOccasionClick: (occasionId: string) => void;
  variant?: "grid" | "horizontal";
  className?: string;
}

export const OccasionGrid = ({ 
  onOccasionClick, 
  variant = "grid",
  className 
}: OccasionGridProps) => {
  const occasions: OccasionCategory[] = [
    {
      id: "birthday",
      name: "Birthday Gifts",
      icon: Cake,
      image: "/placeholder.svg",
      trending: true,
      popularProducts: 2847,
      avgPrice: "₹299-₹1999",
      deliveryTime: "Same day",
      description: "Make birthdays special",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      id: "corporate",
      name: "Corporate Gifts",
      icon: Briefcase,
      image: "/placeholder.svg",
      trending: false,
      popularProducts: 1523,
      avgPrice: "₹149-₹5999",
      deliveryTime: "Next day",
      description: "Professional gifting",
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      id: "wedding", 
      name: "Wedding Gifts",
      icon: Crown,
      image: "/placeholder.svg",
      trending: true,
      popularProducts: 967,
      avgPrice: "₹999-₹9999",
      deliveryTime: "2-3 days",
      description: "Celebrate love",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      id: "anniversary",
      name: "Anniversary",
      icon: Heart,
      image: "/placeholder.svg",
      trending: false,
      popularProducts: 843,
      avgPrice: "₹599-₹3999",
      deliveryTime: "Same day",
      description: "Romantic moments",
      gradient: "from-red-500 to-pink-500"
    },
    {
      id: "baby",
      name: "Baby Shower",
      icon: Baby,  
      image: "/placeholder.svg",
      trending: true,
      popularProducts: 456,
      avgPrice: "₹399-₹2999",
      deliveryTime: "Same day",
      description: "Welcome little ones",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      id: "festival",
      name: "Festival Gifts",
      icon: Sparkles,
      image: "/placeholder.svg", 
      trending: false,
      popularProducts: 1834,
      avgPrice: "₹199-₹4999",
      deliveryTime: "Same day",
      description: "Festive celebrations",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  if (variant === "horizontal") {
    return (
      <div className={cn("space-y-3", className)}>
        <h2 className="text-lg font-semibold px-4">What's the occasion?</h2>
        <HorizontalScroll 
          gap="sm" 
          paddingX="md"
          cardType="category"
          snapAlign="start"
        >
          {occasions.slice(0, 6).map((occasion) => (
            <div
              key={occasion.id}
              onClick={() => onOccasionClick(occasion.id)}
              className="cursor-pointer group"
            >
              <div className="flex flex-col items-center gap-2 min-w-[80px]">
                {/* Round Image Container - Modern E-commerce Pattern */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border/50 group-hover:border-primary transition-colors duration-200">
                    <div className={cn(
                      "w-full h-full bg-gradient-to-br opacity-90 flex items-center justify-center",
                      occasion.gradient
                    )}>
                      <occasion.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Trending Indicator - Corner Badge */}
                  {occasion.trending && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                      <TrendingUp className="h-3 w-3 text-destructive-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Category Label */}
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {occasion.name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {occasion.popularProducts}+ items
                  </p>
                </div>
              </div>
            </div>
          ))}
        </HorizontalScroll>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">Shop by Occasion</h2>
        <Button variant="ghost" size="sm">View All</Button>
      </div>
      
      {/* Mobile-First Grid - 2 columns, modern visual approach */}
      <div className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 lg:grid-cols-4">
        {occasions.map((occasion) => (
          <Card 
            key={occasion.id}
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-0 overflow-hidden group bg-card"
            onClick={() => onOccasionClick(occasion.id)}
          >
            <CardContent className="p-4 text-center space-y-3">
              {/* Round Image Container - Primary Visual Element */}
              <div className="relative mx-auto">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border/30 group-hover:border-primary/50 transition-colors duration-200 mx-auto">
                  <div className={cn(
                    "w-full h-full bg-gradient-to-br opacity-90 flex items-center justify-center relative",
                    occasion.gradient
                  )}>
                    <occasion.icon className="h-10 w-10 text-white" />
                    
                    {/* Subtle overlay for depth */}
                    <div className="absolute inset-0 bg-white/10 rounded-full" />
                  </div>
                </div>
                
                {/* Trending Badge - Modern positioning */}
                {occasion.trending && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-sm">
                    <TrendingUp className="h-3 w-3 text-destructive-foreground" />
                  </div>
                )}
              </div>
              
              {/* Category Info */}
              <div className="space-y-1">
                <h3 className="font-semibold text-sm leading-tight">{occasion.name}</h3>
                <p className="text-xs text-muted-foreground">{occasion.description}</p>
              </div>
              
              {/* Stats Row - Compact */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{occasion.popularProducts}+ products</span>
                <span className="text-primary font-medium">{occasion.avgPrice}</span>
              </div>
              
              {/* Delivery Badge - Minimal */}
              <Badge variant="outline" className="text-xs w-full justify-center py-1">
                {occasion.deliveryTime} delivery
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};