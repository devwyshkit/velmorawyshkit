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
import { FloatingCartButton } from "@/components/customer/shared/FloatingCartButton";
import { FilterChips, type Filter } from "@/components/customer/shared/FilterChips";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { EmailVerificationBanner } from "@/components/customer/shared/EmailVerificationBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecommendations } from "@/lib/integrations/openai";
import { fetchPartners, type Partner } from "@/lib/integrations/supabase-data";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

interface Occasion {
  id: string;
  name: string;
  image: string;
  icon: string;
}

export const CustomerHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { location } = useLocation();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);

  // Static data
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load recommendations
        const recs = await getRecommendations();
        setRecommendations(recs);

        // Load partners from Supabase (with fallback to mock data)
        const partnersData = await fetchPartners(location);
        setPartners(partnersData);
        setFilteredPartners(partnersData);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: "Loading error",
          description: "Some content may not be available",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location, toast]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCurrentSlide(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const handleFilterChange = (activeFilters: Filter[]) => {
    if (activeFilters.length === 0) {
      setFilteredPartners(partners);
      return;
    }

    // Filter partners based on active filters
    let filtered = [...partners];

    activeFilters.forEach(filter => {
      if (filter.category === 'price') {
        // Price filtering would need actual price data from partners
        // For now, just showing all
      } else if (filter.category === 'occasion') {
        // Filter by occasion tag
        // For now, just showing all
      } else if (filter.category === 'category') {
        // Filter by category tag
        // For now, just showing all
      }
    });

    setFilteredPartners(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader />
        <main className="max-w-screen-xl mx-auto space-y-4 pt-4 px-4">
          {/* Hero Skeleton */}
          <Skeleton className="h-40 w-full rounded-xl" />
          
          {/* Occasions Skeleton */}
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>

          {/* Partners Skeleton */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </main>
        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader />
      
      {/* Email Verification Banner - Show if user not verified */}
      {user && !user.isEmailVerified && (
        <EmailVerificationBanner email={user.email} />
      )}

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
                  stopOnInteraction: true,      // Pause on click/drag
                  stopOnMouseEnter: true,       // Pause on hover (Zomato pattern)
                  stopOnFocusIn: true,          // Pause on keyboard focus (WCAG 2.2.2)
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
                          onClick={() => navigate(`/customer/partners/${item.partner_id}`)}
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
                  aria-label="Previous recommendation"
                >
                  <span className="text-sm">←</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => carouselApi?.scrollNext()}
                  disabled={!carouselApi?.canScrollNext()}
                  aria-label="Next recommendation"
                >
                  <span className="text-sm">→</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Occasions - ROUND cards like Swiggy: Horizontal scroll mobile, Grid desktop */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold px-4">What's the occasion?</h2>
          {/* Swiggy/Zomato pattern: Mobile = 2 rows horizontal scroll | Desktop = 1 row */}
          <div className="grid grid-rows-2 grid-flow-col auto-cols-[95px] gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2 pl-4 lg:grid-rows-1 lg:overflow-visible lg:pl-0 lg:gap-6 lg:auto-cols-auto lg:justify-start">
            {occasions.map((occasion) => (
              <button
                key={occasion.id}
                onClick={() => navigate(`/customer/occasions/${occasion.id}`)}
                className="snap-start flex flex-col items-center gap-2 min-w-[80px] shrink-0 md:min-w-0"
                aria-label={`Browse ${occasion.name} gifts`}
              >
                {/* ROUND circular image - Swiggy pattern (80px optimal) */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border/50 hover:border-primary transition-colors">
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

        {/* Filter Chips */}
        <section className="px-4">
          <FilterChips onFilterChange={handleFilterChange} />
        </section>

        {/* Partners - Responsive Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-lg font-semibold">Partners near you</h2>
            <Button
              variant="link"
              className="text-primary p-0 h-auto"
              onClick={() => navigate("/customer/partners")}
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredPartners.slice(0, 6).map((partner) => (
              <Card
                key={partner.id}
                className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow"
                onClick={() => navigate(`/customer/partners/${partner.id}`)}
              >
                <CardContent className="p-2">
                  {/* Image - 1:1 square (Amazon/Flipkart standard for vendor image reuse) */}
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                    <img
                      src={partner.image}
                      alt={partner.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Sponsored Badge - Top Left (Zomato pattern) */}
                    {partner.sponsored && (
                      <Badge className="absolute top-2 left-2 bg-amber-100 text-amber-900 text-xs border-amber-200">
                        Sponsored
                      </Badge>
                    )}
                    {/* Bestseller/Trending Badge - Top Right */}
                    {partner.badge && (
                      <Badge
                        className="absolute top-2 right-2 gap-1 text-sm bg-[#FFB3AF] text-foreground border-0 hover:bg-[#FFB3AF]/90"
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
                  
                  {/* Content */}
                  <div className="space-y-1">
                    {/* Name - 16px bold per spec */}
                    <h3 className="text-base font-bold line-clamp-1">
                      {partner.name}
                    </h3>
                    
                    {/* Category - 12px gray per spec */}
                    {partner.category && (
                      <p className="text-xs text-muted-foreground">{partner.category}</p>
                    )}
                    
                    {/* Rating (14px) and Delivery (12px) per spec */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-sm">
                        ★ {partner.rating} {partner.ratingCount && `(${partner.ratingCount})`}
                      </span>
                      <span>{partner.delivery}</span>
                    </div>
                    
                    {/* Tagline - 12px gray, 1 line per spec */}
                    {partner.tagline && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{partner.tagline}</p>
                    )}
                  </div>
                  
                  {/* Product Thumbnails Preview - Uber Eats pattern for discovery */}
                  <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="snap-start w-12 h-12 rounded bg-muted flex-shrink-0">
                        <img 
                          src={`https://picsum.photos/seed/thumb-${partner.id}-${i}/100/100`}
                          alt={`Product ${i}`}
                          className="w-full h-full object-cover rounded"
                          loading="lazy"
                        />
                      </div>
                    ))}
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
      <FloatingCartButton />
      <CustomerBottomNav />
    </div>
  );
};

