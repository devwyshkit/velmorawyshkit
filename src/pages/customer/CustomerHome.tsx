import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Gift, Trophy, Flame, Sparkles, Star } from "lucide-react";
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
import { CampaignCard } from "@/components/customer/campaigns/CampaignCard";
import { OptimizedImage } from "@/components/ui/skeleton-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPartners, groupPartnersByDelivery, type Partner } from "@/lib/integrations/supabase-data";
import { supabase } from "@/lib/integrations/supabase-client";
import { useDelivery } from "@/contexts/DeliveryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

interface Occasion {
  id: string;
  name: string;
  image: string;
  icon: string;
  slug: string;
}

export const CustomerHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { location, deliveryDate } = useDelivery();
  const { user } = useAuth();
  const [banners, setBanners] = useState<any[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [featuredCampaigns, setFeaturedCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [groupedPartners, setGroupedPartners] = useState<{
    tomorrow: Partner[];
    regional: Partner[];
    panIndia: Partner[];
  }>({ tomorrow: [], regional: [], panIndia: [] });

  // Group partners by delivery time using helper function
  const groupPartners = (partners: Partner[]) => {
    return groupPartnersByDelivery(partners, deliveryDate);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const hasSupabaseEnv = Boolean(
          import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        if (!hasSupabaseEnv) {
          // No Supabase env in dev → rely on fallbacks immediately
          setBanners([
            {
              id: '1',
              title: 'Welcome to Wyshkit',
              image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=128&fit=crop',
              cta_link: '/search',
              is_active: true
            }
          ]);
          const fallbackOccasions: Occasion[] = [
            { id: '1', name: 'Birthday', image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop', icon: '🎂', slug: 'birthday' },
            { id: '2', name: 'Anniversary', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=100&h=100&fit=crop', icon: '💍', slug: 'anniversary' },
            { id: '3', name: 'Wedding', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=100&h=100&fit=crop', icon: '💒', slug: 'wedding' },
            { id: '4', name: 'Corporate', image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=100&h=100&fit=crop', icon: '🏢', slug: 'corporate' }
          ];
          setOccasions(fallbackOccasions);
          const fallbackPartners = [
            {
              id: '1',
              name: 'GiftCraft Studio',
              image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop',
              rating: 4.8,
              delivery: '35–45 min',
              badge: 'bestseller' as const,
              location: 'Bangalore',
              category: 'Custom Gifts',
              tagline: 'Handcrafted personalized gifts',
              ratingCount: 156,
              sponsored: false,
              status: 'approved' as const,
              is_active: true
            },
            {
              id: '2',
              name: 'Luxury Hampers Co',
              image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=200&h=200&fit=crop',
              rating: 4.6,
              delivery: '2–3 days',
              badge: 'trending' as const,
              location: 'Mumbai',
              category: 'Hampers',
              tagline: 'Premium gift hampers',
              ratingCount: 89,
              sponsored: false,
              status: 'approved' as const,
              is_active: true
            }
          ];
          setPartners(fallbackPartners);
          setFilteredPartners(fallbackPartners);
          setGroupedPartners(groupPartners(fallbackPartners));
          return;
        }

        // Load banners from Supabase
        const { data: bannersData } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (bannersData && bannersData.length > 0) {
          setBanners(bannersData);
        } else {
          // Fallback data for development
          setBanners([
            {
              id: '1',
              title: 'Welcome to Wyshkit',
              image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=128&fit=crop',
              cta_link: '/search',
              is_active: true
            }
          ]);
        }

        // Load occasions from Supabase
        const { data: occasionsData } = await supabase
          .from('occasions')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (occasionsData && occasionsData.length > 0) {
          setOccasions(occasionsData.map(occ => ({
            id: occ.id,
            name: occ.name,
            image: occ.image_url,
            icon: occ.icon_emoji,
            slug: occ.slug,
          })));
        } else {
          // Fallback data for development
          setOccasions([
            { id: '1', name: 'Birthday', image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop', icon: '🎂', slug: 'birthday' },
            { id: '2', name: 'Anniversary', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=100&h=100&fit=crop', icon: '💍', slug: 'anniversary' },
            { id: '3', name: 'Wedding', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=100&h=100&fit=crop', icon: '💒', slug: 'wedding' },
            { id: '4', name: 'Corporate', image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=100&h=100&fit=crop', icon: '🏢', slug: 'corporate' }
          ]);
        }

          // Load partners from Supabase
          const partnersData = await fetchPartners(location);
          if (partnersData && partnersData.length > 0) {
            setPartners(partnersData);
            setFilteredPartners(partnersData);
            // Group partners by delivery time
            const grouped = groupPartners(partnersData);
            setGroupedPartners(grouped);
          } else {
          // Fallback data for development
          const fallbackPartners = [
            {
              id: '1',
              name: 'GiftCraft Studio',
              image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop',
              rating: 4.8,
              delivery: '1-2 days',
              badge: 'bestseller' as const,
              location: 'Bangalore',
              category: 'Custom Gifts',
              tagline: 'Handcrafted personalized gifts',
              ratingCount: 156,
              sponsored: false,
              status: 'approved' as const,
              is_active: true
            },
            {
              id: '2',
              name: 'Luxury Hampers Co',
              image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=200&h=200&fit=crop',
              rating: 4.6,
              delivery: '2-3 days',
              badge: 'trending' as const,
              location: 'Mumbai',
              category: 'Hampers',
              tagline: 'Premium gift hampers',
              ratingCount: 89,
              sponsored: false,
              status: 'approved' as const,
              is_active: true
            }
            ];
            setPartners(fallbackPartners);
            setFilteredPartners(fallbackPartners);
            // Group fallback partners by delivery time
            const grouped = groupPartners(fallbackPartners);
            setGroupedPartners(grouped);
          }

        // Load featured campaigns
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('*')
          .eq('featured', true)
          .eq('status', 'active')
          .lte('start_date', new Date().toISOString())
          .gte('end_date', new Date().toISOString())
          .limit(5);
        
        if (campaigns) {
          setFeaturedCampaigns(campaigns);
        }
      } catch (error) {
        console.error('Error loading data:', error);
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
  }, [location, deliveryDate]);

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
        {/* Hero Banners - Always show section to prevent layout shift */}
        <section className="px-4">
          {banners.length === 0 ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : (
            <div>
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 3500,  // 3.5 seconds (Swiggy standard)
                    stopOnInteraction: true,      // Pause on click/drag
                    stopOnMouseEnter: true,       // Pause on hover (Zomato pattern)
                    stopOnFocusIn: true,          // Pause on keyboard focus (WCAG 2.2.2)
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {banners.map((item) => (
                    <CarouselItem key={item.id} className="basis-[90%] pl-2 md:basis-[45%]">
                      <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] border-0 overflow-hidden">
                        <CardContent className="p-0">
                          <div
                            className="relative h-40 md:h-48"  // 160px mobile, 192px desktop (Swiggy standard)
                            onClick={() => navigate(item.cta_link || item.link || RouteMap.vendor(item.partner_id))}
                          >
                            {/* Banner Image */}
                            {item.image_url && (
                              <OptimizedImage
                                src={item.image_url}
                                alt={item.title}
                                width={400}
                                height={128}
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
                  {banners.map((_, idx) => (
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
                    aria-label="Previous banner"
                  >
                    <span className="text-sm">←</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={() => carouselApi?.scrollNext()}
                    disabled={!carouselApi?.canScrollNext()}
                    aria-label="Next banner"
                  >
                    <span className="text-sm">→</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Active Campaigns - Swiggy/Zomato Offers Pattern */}
        {featuredCampaigns.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                🎯 Active Offers
                <Badge variant="secondary" className="text-xs">
                  {featuredCampaigns.length}
                </Badge>
              </h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto text-sm"
                onClick={() => navigate(RouteMap.search("filter=offers"))}
              >
                View All →
              </Button>
            </div>
            <div className="px-4 space-y-3">
              {featuredCampaigns.slice(0, 3).map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
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
                onClick={() => navigate(RouteMap.search(`occasion=${occasion.name.toLowerCase()}`))}
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

        {/* Partners Grouped by Delivery Time - Swiggy Pattern */}
        {groupedPartners.tomorrow.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                ⚡ Delivering Tomorrow (Local)
                <Badge variant="secondary" className="text-xs">
                  {groupedPartners.tomorrow.length}
                </Badge>
              </h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto"
                onClick={() => navigate(RouteMap.search("delivery=tomorrow"))}
              >
                View All →
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 px-4 md:grid-cols-3 lg:grid-cols-4">
              {groupedPartners.tomorrow.slice(0, 6).map((partner) => (
              <Card
                key={partner.id}
                className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow"
                onClick={() => navigate(RouteMap.vendor(partner.id))}
              >
                <CardContent className="p-2">
                  {/* Image - 1:1 square (Amazon/Flipkart standard for vendor image reuse) */}
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                    <OptimizedImage
                      src={partner.image}
                      alt={partner.name}
                      width={200}
                      height={200}
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
                    {/* Name - clamp to 2 lines for stability */}
                    <h3 className="text-base font-bold line-clamp-2">
                      {partner.name}
                    </h3>
                    
                    {/* Category - 12px gray per spec */}
                    {partner.category && (
                      <p className="text-xs text-muted-foreground">{partner.category}</p>
                    )}
                    
                    {/* Meta row: rating (+count) • ETA • distance (if available) */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {partner.rating}{partner.ratingCount ? ` (${partner.ratingCount})` : ""}
                      </span>
                      <span>•</span>
                      <span>{partner.delivery}</span>
                      {partner.distance && (
                        <>
                          <span>•</span>
                          <span>{partner.distance}</span>
                        </>
                      )}
                    </div>
                    {/* No price in vendor cards to keep to 3 signals */}
                    
                    {/* Tagline - 12px gray, 1 line per spec */}
                    {partner.tagline && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{partner.tagline}</p>
                    )}
                  </div>
                  
                  {/* Product Thumbnails Preview - Uber Eats pattern for discovery */}
                  <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="snap-start w-12 h-12 rounded bg-muted flex-shrink-0">
                        <OptimizedImage 
                          src={`https://picsum.photos/seed/thumb-${partner.id}-${i}/100/100`}
                          alt={`Product ${i}`}
                          width={48}
                          height={48}
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
        )}

        {/* Regional Partners - 2-3 Days */}
        {groupedPartners.regional.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                📦 Delivering in 2-3 Days (Regional)
                <Badge variant="secondary" className="text-xs">
                  {groupedPartners.regional.length}
                </Badge>
              </h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto"
                onClick={() => navigate(RouteMap.search("delivery=regional"))}
              >
                View All →
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 px-4 md:grid-cols-3 lg:grid-cols-4">
              {groupedPartners.regional.slice(0, 6).map((partner) => (
                <Card
                  key={partner.id}
                  className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => navigate(RouteMap.vendor(partner.id))}
                >
                  <CardContent className="p-2">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                      <OptimizedImage
                        src={partner.image}
                        alt={partner.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {partner.sponsored && (
                        <Badge className="absolute top-2 left-2 bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 gap-0.5 text-[10px] border-amber-200 dark:border-amber-700">
                          <Sparkles className="h-2.5 w-2.5 text-amber-900 dark:text-amber-100" />
                          <span className="text-amber-900 dark:text-amber-100 font-medium">Sponsored</span>
                        </Badge>
                      )}
                      {partner.badge && (
                        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground px-1.5 py-0.5 text-[10px]">
                          {partner.badge === 'bestseller' ? '🔥' : '📈'} {partner.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold line-clamp-2">{partner.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {partner.rating}{partner.ratingCount ? ` (${partner.ratingCount})` : ""}
                        </span>
                        <span>•</span>
                        <span>{partner.delivery}</span>
                        {partner.distance && (
                          <>
                            <span>•</span>
                            <span>{partner.distance}</span>
                          </>
                        )}
                      </div>
                      {partner.tagline && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{partner.tagline}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Pan-India Partners - 5-7 Days */}
        {groupedPartners.panIndia.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                🌐 More Options (Pan-India)
                <Badge variant="secondary" className="text-xs">
                  {groupedPartners.panIndia.length}
                </Badge>
              </h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto"
                onClick={() => navigate(RouteMap.search("delivery=pan-india"))}
              >
                View All →
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 px-4 md:grid-cols-3 lg:grid-cols-4">
              {groupedPartners.panIndia.slice(0, 6).map((partner) => (
                <Card
                  key={partner.id}
                  className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => navigate(RouteMap.vendor(partner.id))}
                >
                  <CardContent className="p-2">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                      <OptimizedImage
                        src={partner.image}
                        alt={partner.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {partner.sponsored && (
                        <Badge className="absolute top-2 left-2 bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 gap-0.5 text-[10px] border-amber-200 dark:border-amber-700">
                          <Sparkles className="h-2.5 w-2.5 text-amber-900 dark:text-amber-100" />
                          <span className="text-amber-900 dark:text-amber-100 font-medium">Sponsored</span>
                        </Badge>
                      )}
                      {partner.badge && (
                        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground px-1.5 py-0.5 text-[10px]">
                          {partner.badge === 'bestseller' ? '🔥' : '📈'} {partner.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold line-clamp-2">{partner.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {partner.rating}{partner.ratingCount ? ` (${partner.ratingCount})` : ""}
                        </span>
                        <span>•</span>
                        <span>{partner.delivery}</span>
                        {partner.distance && (
                          <>
                            <span>•</span>
                            <span>{partner.distance}</span>
                          </>
                        )}
                      </div>
                      {partner.tagline && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{partner.tagline}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Enhanced Footer - Swiggy/Zomato Pattern */}
      <EnhancedFooter />
      
      <FloatingCartButton />
      <CustomerBottomNav />
    </div>
  );
};

