import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { getRecommendations } from "@/lib/integrations/openai";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

interface Partner {
  id: string;
  name: string;
  image: string;
  rating: number;
  delivery: string;
  badge?: 'bestseller' | 'trending';
}

interface Occasion {
  id: string;
  name: string;
  image: string;
  icon: string;
}

export const CustomerHome = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Mock data - replace with actual Supabase queries
  const occasions: Occasion[] = [
    { id: '1', name: 'Birthday', image: '/placeholder.svg', icon: '🎂' },
    { id: '2', name: 'Anniversary', image: '/placeholder.svg', icon: '💑' },
    { id: '3', name: 'Wedding', image: '/placeholder.svg', icon: '💒' },
    { id: '4', name: 'Corporate', image: '/placeholder.svg', icon: '💼' },
    { id: '5', name: 'Festival', image: '/placeholder.svg', icon: '🪔' },
    { id: '6', name: 'Graduation', image: '/placeholder.svg', icon: '🎓' },
    { id: '7', name: 'Baby Shower', image: '/placeholder.svg', icon: '👶' },
    { id: '8', name: 'Farewell', image: '/placeholder.svg', icon: '👋' },
  ];

  const partners: Partner[] = [
    {
      id: '1',
      name: 'Premium Gifts Co',
      image: '/placeholder.svg',
      rating: 4.5,
      delivery: '30-45 mins',
      badge: 'bestseller',
    },
    {
      id: '2',
      name: 'Artisan Crafts',
      image: '/placeholder.svg',
      rating: 4.7,
      delivery: '45-60 mins',
      badge: 'trending',
    },
    {
      id: '3',
      name: 'Gourmet Delights',
      image: '/placeholder.svg',
      rating: 4.3,
      delivery: '40-50 mins',
    },
    {
      id: '4',
      name: 'Tech Accessories Hub',
      image: '/placeholder.svg',
      rating: 4.6,
      delivery: '35-45 mins',
    },
    {
      id: '5',
      name: 'Floral Paradise',
      image: '/placeholder.svg',
      rating: 4.8,
      delivery: '25-35 mins',
      badge: 'bestseller',
    },
    {
      id: '6',
      name: 'Custom Creations',
      image: '/placeholder.svg',
      rating: 4.4,
      delivery: '60-75 mins',
    },
  ];

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const recs = await getRecommendations();
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCurrentSlide(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader />

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto space-y-4 pt-4">
        {/* Hero Banners - Responsive Grid: 85% mobile, 50% tablet, 33% desktop */}
        <section className="px-4">
          <div>
            <Carousel
              setApi={setCarouselApi}
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 5000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                {recommendations.map((item) => (
                  <CarouselItem key={item.id} className="basis-[85%] pl-2">
                    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-0 overflow-hidden">
                      <CardContent className="p-0">
                        <div
                          className="relative h-40 bg-gradient-to-br from-primary via-primary-light to-primary"
                          onClick={() => navigate(`/customer/items/${item.id}`)}
                        >
                          {/* Background Pattern */}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-primary opacity-90" />
                          
                          {/* Content - Center-aligned with icon (Original pattern) */}
                          <div className="relative z-10 p-4 h-full flex flex-col justify-center text-center space-y-1">
                            <div className="h-10 w-10 bg-white/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                              <Gift className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                            <p className="text-white/90 text-xs">{item.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            
            {/* Indicators (left) & Small Navigation Arrows (right) - Below carousel */}
            <div className="flex items-center justify-between mt-3 px-2">
              {/* Left: Dot Indicators */}
              <div className="flex gap-1">
                {recommendations.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => carouselApi?.scrollTo(idx)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      idx === currentSlide ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
              
              {/* Right: Small Navigation Arrows Grouped Together */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => carouselApi?.scrollPrev()}
                  disabled={!carouselApi?.canScrollPrev()}
                >
                  <span className="text-sm">←</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => carouselApi?.scrollNext()}
                  disabled={!carouselApi?.canScrollNext()}
                >
                  <span className="text-sm">→</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Occasions - ROUND cards like Swiggy (horizontal scroll) */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold px-4">What's the occasion?</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {occasions.map((occasion) => (
              <button
                key={occasion.id}
                onClick={() => navigate(`/customer/occasions/${occasion.id}`)}
                className="flex flex-col items-center gap-2 min-w-[80px] shrink-0"
              >
                {/* ROUND circular image - Swiggy/Zomato pattern */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border/50 hover:border-primary transition-colors">
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-3xl">
                      {occasion.icon}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-center line-clamp-2 max-w-[80px]">
                  {occasion.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Partners - Responsive Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-lg font-semibold">Vendors near you</h2>
            <Button
              variant="link"
              className="text-primary p-0 h-auto"
              onClick={() => navigate("/customer/partners")}
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 md:grid-cols-3 lg:grid-cols-4">
            {partners.slice(0, 6).map((partner) => (
              <Card
                key={partner.id}
                className="cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow"
                onClick={() => navigate(`/customer/partners/${partner.id}`)}
              >
                <CardContent className="p-2">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                    <img
                      src={partner.image}
                      alt={partner.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {partner.badge && (
                      <Badge
                        className="absolute top-2 left-2 gap-1 text-sm bg-[#FFB3AF] text-foreground border-0 hover:bg-[#FFB3AF]/90"
                      >
                        {partner.badge === 'bestseller' ? (
                          <>
                            <Trophy className="w-3 h-3" />
                            Bestseller
                          </>
                        ) : (
                          <>
                            <Flame className="w-3 h-3" />
                            Trending
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold line-clamp-1 mb-1">
                    {partner.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      ★ {partner.rating}
                    </span>
                    <span>{partner.delivery}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <div className="mt-6">
        <ComplianceFooter />
      </div>
      <CustomerBottomNav />
    </div>
  );
};

