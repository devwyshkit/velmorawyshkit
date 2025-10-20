import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Trophy, Flame, Sparkles } from "lucide-react";
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
import { EnhancedFooter } from "@/components/customer/shared/EnhancedFooter";
import { EmailVerificationBanner } from "@/components/customer/shared/EmailVerificationBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecommendations } from "@/lib/integrations/openai";
import { fetchPartners, type Partner } from "@/lib/integrations/supabase-data";
import { supabase } from "@/lib/integrations/supabase-client";
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
  const [banners, setBanners] = useState<any[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [featuredCampaigns, setFeaturedCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load banners from Supabase (we have 4 in database!)
        try {
          const { data: bannersData, error: bannersError } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
          
          if (bannersError) {
            console.warn('Banners fetch failed:', bannersError);
          } else {
            setBanners(bannersData || []);
          }
        } catch (error) {
          console.warn('Failed to load banners:', error);
        }

        // Load occasions from Supabase (we have 8 in database!)
        try {
          const { data: occasionsData, error: occasionsError } = await supabase
            .from('occasions')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
          
          if (occasionsError) {
            console.warn('Occasions fetch failed:', occasionsError);
          } else {
            setOccasions(occasionsData?.map(occ => ({
              id: occ.id,
              name: occ.name,
              image: occ.image_url,
              icon: occ.icon_emoji,
              slug: occ.slug,
            })) || []);
          }
        } catch (error) {
          console.warn('Failed to load occasions:', error);
        }

        // Load recommendations with user context (fallback if no banners)
        if (banners.length === 0) {
          const browsingHistory = JSON.parse(localStorage.getItem('wyshkit_browsing_history') || '[]');
          const recs = await getRecommendations({
            location: location || 'India',
            browsing_history: browsingHistory.slice(0, 10),
            occasion: 'General',
          });
          setRecommendations(recs);
        }

        // Load partners from Supabase (with fallback to mock data)
        const partnersData = await fetchPartners(location);
        setPartners(partnersData);
        setFilteredPartners(partnersData);

        // Load featured campaigns (PROMPT 4 - Campaign Management)
        try {
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select('*')
            .eq('featured', true)
            .eq('status', 'active')
            .lte('start_date', new Date().toISOString())
            .gte('end_date', new Date().toISOString())
            .limit(5);
          
          setFeaturedCampaigns(campaigns || []);
        } catch (error) {
          console.warn('Featured campaigns fetch failed:', error);
        }
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
        // Filter partners by their category's typical price range
        const priceRanges: Record<string, (partner: Partner) => boolean> = {
          'Under ₹500': (p) => ['Chocolates', 'Food & Beverage'].includes(p.category || ''),
          '₹500-₹1000': (p) => ['Personalized', 'Chocolates'].includes(p.category || ''),
          '₹1000-₹2500': (p) => ['Tech Gifts', 'Gourmet'].includes(p.category || ''),
          'Above ₹2500': (p) => ['Premium', 'Tech Gifts'].includes(p.category || ''),
        };
        const filterFn = priceRanges[filter.label];
        if (filterFn) {
          filtered = filtered.filter(filterFn);
        }
      } else if (filter.category === 'occasion') {
        // Filter by category match (Birthday, Anniversary, etc. → show all for now)
        // In production, would check partner.occasionTags array
      } else if (filter.category === 'category') {
        // Filter by exact category match
        filtered = filtered.filter(p => p.category === filter.label);
      }
    });

    setFilteredPartners(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader />
        <main className="max-w-screen-xl mx-auto space-y-4 pt-4 px-4">
          {/* Hero Skeleton - Matches actual h-32 banner height */}
          <Skeleton className="h-32 w-full rounded-xl" />
          
          {/* Occasions Skeleton */}
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>

          {/* Partners Skeleton - Matches actual partner card structure */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-1 p-2">
                <Skeleton className="aspect-square rounded-lg mb-2" />
                <Skeleton className="h-4 w-3/4" />  {/* Name: text-base */}
                <Skeleton className="h-3 w-1/2" />  {/* Category: text-xs */}
                <Skeleton className="h-3 w-2/3" />  {/* Rating + Delivery */}
                <Skeleton className="h-3 w-full" />  {/* Tagline */}
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
                {(banners.length > 0 ? banners : recommendations).map((item) => (
                  <CarouselItem key={item.id} className="basis-[85%] pl-2">
                    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-0 overflow-hidden">
                      <CardContent className="p-0">
                        <div
                          className="relative h-32"
                          onClick={() => navigate(item.cta_link || item.link || `/customer/partners/${item.partner_id}`)}
                        >
                          {/* Banner Image (if from database) */}
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                          
                          {/* Gradient Overlay (for better text readability) */}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-transparent" />
                          
                          {/* Content - Center-aligned */}
                          <div className="relative z-10 p-4 h-full flex flex-col justify-center text-center space-y-1">
                            <div className="h-10 w-10 bg-white/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                              <Gift className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                            <p className="text-white/90 text-xs">{item.subtitle || item.description}</p>
                            {item.cta_text && (
                              <span className="text-white/80 text-xs font-medium">{item.cta_text} →</span>
                            )}
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
                {(banners.length > 0 ? banners : recommendations).map((_, idx) => (
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

        {/* Featured Campaigns Carousel - PROMPT 4 Integration */}
        {featuredCampaigns.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-lg font-semibold">Special Offers</h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto text-sm"
                onClick={() => navigate("/customer/campaigns")}
              >
                View All
              </Button>
            </div>
            <Carousel className="w-full px-4">
              <CarouselContent className="-ml-2">
                {featuredCampaigns.map((campaign) => (
                  <CarouselItem key={campaign.id} className="basis-[90%] md:basis-1/2 pl-2">
                    <Card 
                      className="overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/customer/campaigns/${campaign.id}`)}
                    >
                      <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center relative">
                        {campaign.banner_url ? (
                          <img 
                            src={campaign.banner_url} 
                            alt={campaign.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <p className="font-bold text-lg mb-1">{campaign.name}</p>
                            {campaign.discount_type && campaign.discount_value && (
                              <Badge className="bg-primary text-primary-foreground">
                                {campaign.discount_type === 'percentage' 
                                  ? `${campaign.discount_value}% OFF`
                                  : `₹${campaign.discount_value} OFF`
                                }
                              </Badge>
                            )}
                          </div>
                        )}
                        <Badge className="absolute top-2 left-2 bg-amber-100 dark:bg-amber-900 px-2 py-0.5 gap-1 text-xs border-amber-200">
                          <Sparkles className="h-3 w-3 text-amber-900 dark:text-amber-100" />
                          <span className="text-amber-900 dark:text-amber-100 font-medium">Featured</span>
                        </Badge>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </section>
        )}

        {/* Occasions - ROUND cards like Swiggy: Single row for service marketplace focus */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold px-4">What's the occasion?</h2>
          {/* Single row horizontal scroll (optimized for partner card visibility) */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2 px-4 lg:overflow-visible lg:px-0 lg:gap-6 lg:justify-start">
            {occasions.map((occasion) => (
              <button
                key={occasion.id}
                onClick={() => navigate(`/customer/search?occasion=${occasion.name.toLowerCase()}`)}
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
              onClick={() => navigate("/customer/search?view=partners")}
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
                    {/* Sponsored Badge - Top Left (Small icon + text, Zomato pattern) */}
                    {partner.sponsored && (
                      <Badge className="absolute top-2 left-2 bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 gap-0.5 text-[10px] border-amber-200 dark:border-amber-700">
                        <Sparkles className="h-2.5 w-2.5 text-amber-900 dark:text-amber-100" />
                        <span className="text-amber-900 dark:text-amber-100 font-medium">Sponsored</span>
                      </Badge>
                    )}
                    {/* Bestseller/Trending Badge - Top Right (Small icon + text, no conflict with sponsored) */}
                    {partner.badge && !partner.sponsored && (
                      <Badge
                        className="absolute top-2 right-2 px-1.5 py-0.5 gap-0.5 text-[10px] bg-[#FFB3AF] dark:bg-[#8B4A47] border-0"
                      >
                        {partner.badge === 'bestseller' ? (
                          <>
                            <Trophy className="h-2.5 w-2.5 text-foreground" />
                            <span className="font-medium">Bestseller</span>
                          </>
                        ) : (
                          <>
                            <Flame className="h-2.5 w-2.5 text-foreground" />
                            <span className="font-medium">Trending</span>
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

      {/* Enhanced Footer - Swiggy/Zomato Pattern */}
      <EnhancedFooter />
      
      <FloatingCartButton />
      <CustomerBottomNav />
    </div>
  );
};

