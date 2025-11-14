import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
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
import { HomeFooter } from "@/components/customer/shared/HomeFooter";
import { StickyCartBar } from "@/components/customer/shared/StickyCartBar";
import { OptimizedImage } from "@/components/ui/skeleton-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { fetchStores, type Store } from "@/lib/integrations/supabase-data";
import { supabase } from "@/lib/integrations/supabase-client";
import { isMockModeEnabled } from "@/lib/mock-mode";
import { getMockBanners, getMockOccasions, getMockOffers } from "@/lib/mock-catalog";
import { useDelivery } from "@/contexts/DeliveryContext";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyStates } from "@/components/ui/empty-state";
import {
  SmartFilters,
  type SortOption,
  type FilterOption,
} from "@/components/customer/shared/SmartFilters";
import { OfferCard, type Offer } from "@/components/customer/shared/OfferCard";
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
  const { location, deliveryDate } = useDelivery();
  const { user } = useAuth();
  const [banners, setBanners] = useState<
    Array<{
      id: string;
      title?: string;
      image_url?: string;
      cta_link?: string;
      link?: string;
      store_id?: string;
      subtitle?: string;
      description?: string;
      cta_text?: string;
      is_active?: boolean;
    }>
  >([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [displayedStores, setDisplayedStores] = useState<Store[]>([]);
  const [hasMoreStores, setHasMoreStores] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visitedStores, setVisitedStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [filteredAndSortedStores, setFilteredAndSortedStores] = useState<
    Store[]
  >([]);
  const [trendingStores, setTrendingStores] = useState<Store[]>([]);
  const [newLaunches, setNewLaunches] = useState<Store[]>([]);
  const [recommendedStores, setRecommendedStores] = useState<Store[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  const STORES_PER_PAGE = 8;

  // Load visited stores and recommendations from backend (when user is logged in)
  useEffect(() => {
    // Visited stores tracking - future enhancement
    // For now, visited stores are empty - can be implemented later
    setVisitedStores([]);

    // Load personalized recommendations (only if user logged in)
    if (user && stores.length > 0) {
      // Use stores array for recommendations (can be enhanced with ML later)
      const recommended = stores.slice(0, 6);
      setRecommendedStores(recommended);
    } else {
      setRecommendedStores([]);
    }
  }, [user, stores]);

  // Load data function - can be called from useEffect or pull-to-refresh
  // Backend only - no fallbacks
  // 2025 Pattern: Parallel queries using Promise.all() for performance
  const loadData = useCallback(async () => {
      setLoading(true);
      try {
        const mockMode = isMockModeEnabled();
        
        if (mockMode) {
          // MOCK MODE: Use mock data - NO Supabase calls
          const mockBanners = getMockBanners();
          const mockOccasions = getMockOccasions();
          const mockStores = await fetchStores(location); // fetchStores already handles mock mode
          const mockOffers = getMockOffers();
          
          // Process banners
          setBanners(mockBanners);
          
          // Process occasions
          setOccasions(
            mockOccasions.map((occ) => ({
              id: occ.id,
              name: occ.name,
              image: occ.image_url,
              icon: occ.icon_emoji,
              slug: occ.slug,
            })),
          );
          
          // Process stores
          let sortedStores: Store[] = [];
          if (mockStores && mockStores.length > 0) {
            sortedStores = [...mockStores].sort(
              (a, b) => (b.rating || 0) - (a.rating || 0),
            );
            setStores(sortedStores);
          } else {
            setStores([]);
            sortedStores = [];
          }
          
          // Initialize displayed stores for infinite scroll
          setDisplayedStores(sortedStores.slice(0, STORES_PER_PAGE));
          setHasMoreStores(sortedStores.length > STORES_PER_PAGE);
          setFilteredAndSortedStores(sortedStores);

          // Filter trending stores
          const trending = sortedStores
            .filter((s) => s.badge === "trending" || (s.ratingCount || 0) > 100)
            .slice(0, 8);
          setTrendingStores(trending);

          // Filter new launches
          const newOnes = sortedStores
            .filter((s) => (s.ratingCount || 0) < 50)
            .slice(0, 8);
          setNewLaunches(newOnes);

          // Process offers
          const transformedOffers: Offer[] = mockOffers.map((offer) => ({
            id: offer.id,
            title: offer.title,
            discount: offer.discount_type === 'percentage' 
              ? `${offer.discount_value}% OFF`
              : offer.discount_type === 'fixed'
              ? `₹${offer.discount_value / 100} OFF`
              : 'FREE DELIVERY',
            validUntil: `Valid till ${new Date(offer.end_date).toLocaleDateString()}`,
            ctaLink: "/search",
            description: offer.description || offer.title,
          }));
          setOffers(transformedOffers);
        } else {
          // REAL MODE: Use Supabase (only if not in mock mode)
          // Parallelize all independent queries (2025 pattern - Swiggy/Fiverr)
          const [bannersResult, occasionsResult, storesResult, offersResult] = await Promise.all([
            // Banners query with graceful error handling
            supabase
              .from("banners")
              .select("id, title, image_url, cta_link, link, store_id, subtitle, description, cta_text, is_active, position")
              .eq("is_active", true)
              .order("position", { ascending: true })
              .limit(10)
              .then(({ data, error }) => {
                if (error) {
                  return { data: [], error: null };
                }
                return { data: data || [], error: null };
              })
              .catch(() => ({ data: [], error: null })),
            
            // Occasions query with graceful error handling
            supabase
              .from("occasions")
              .select("id, name, image_url, icon_emoji, slug, is_active, position")
              .eq("is_active", true)
              .order("position", { ascending: true })
              .limit(20)
              .then(({ data, error }) => {
                if (error) {
                  return { data: [], error: null };
                }
                return { data: data || [], error: null };
              })
              .catch(() => ({ data: [], error: null })),
            
            // Stores query (fetchStores handles its own parallelization)
            fetchStores(location),
            
            // Offers query with graceful error handling
            supabase
              .from("promotional_offers")
              .select("id, title, discount_type, discount_value, description, end_date, created_at")
              .eq("status", "active")
              .eq("is_active", true)
              .gte("end_date", new Date().toISOString())
              .order("created_at", { ascending: false })
              .limit(5)
              .then(({ data, error }) => {
                if (error) {
                  return { data: [], error: null };
                }
                return { data: data || [], error: null };
              })
              .catch(() => ({ data: [], error: null })),
          ]);
          
          // Process banners
          if (bannersResult.data && bannersResult.data.length > 0) {
            setBanners(bannersResult.data);
          } else {
            setBanners([]);
          }

          // Process occasions
          if (occasionsResult.data && occasionsResult.data.length > 0) {
            setOccasions(
              occasionsResult.data.map((occ) => ({
                id: occ.id,
                name: occ.name,
                image: occ.image_url,
                icon: occ.icon_emoji,
                slug: occ.slug,
              })),
            );
          } else {
            setOccasions([]);
          }

          // Process stores
          let sortedStores: Store[] = [];
          if (storesResult && storesResult.length > 0) {
            sortedStores = [...storesResult].sort(
              (a, b) => (b.rating || 0) - (a.rating || 0),
            );
            setStores(sortedStores);
          } else {
            setStores([]);
            sortedStores = [];
          }
          
          setDisplayedStores(sortedStores.slice(0, STORES_PER_PAGE));
          setHasMoreStores(sortedStores.length > STORES_PER_PAGE);
          setFilteredAndSortedStores(sortedStores);

          const trending = sortedStores
            .filter((s) => s.badge === "trending" || (s.ratingCount || 0) > 100)
            .slice(0, 8);
          setTrendingStores(trending);

          const newOnes = sortedStores
            .filter((s) => (s.ratingCount || 0) < 50)
            .slice(0, 8);
          setNewLaunches(newOnes);

          // Process offers
          if (offersResult.data && offersResult.data.length > 0) {
            const transformedOffers: Offer[] = offersResult.data.map((offer) => ({
              id: offer.id,
              title: offer.title,
              discount: offer.discount_type === 'percentage' 
                ? `${offer.discount_value}% OFF`
                : offer.discount_type === 'fixed'
                ? `₹${offer.discount_value / 100} OFF`
                : 'FREE DELIVERY',
              validUntil: `Valid till ${new Date(offer.end_date).toLocaleDateString()}`,
              ctaLink: "/search",
              description: offer.description || offer.title,
            }));
            setOffers(transformedOffers);
          } else {
            setOffers([]);
          }
        }
      } catch (error) {
        // Silent error handling - show empty states (Swiggy 2025 pattern)
        setBanners([]);
        setOccasions([]);
        setStores([]);
        setOffers([]);
      } finally {
        setLoading(false);
      }
  }, [location]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCurrentSlide(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  // Apply filters and sorting to stores
  useEffect(() => {
    let filtered = [...stores];

    // Apply filters
    if (filters.length > 0) {
      filters.forEach((filter) => {
        switch (filter) {
          case "offers":
            // Stores with offers/badges (check for badge or sponsored)
            filtered = filtered.filter((s) => s.badge || s.sponsored);
            break;
          case "fast-delivery":
            // Stores with fast delivery (delivery time < 1 day)
            filtered = filtered.filter((s) => {
              const deliveryMatch = s.delivery?.match(/\d+/);
              if (deliveryMatch) {
                const hours = parseInt(deliveryMatch[0]);
                return hours < 24; // Less than 24 hours
              }
              return false;
            });
            break;
          case "new":
            // New stores (no badge and ratingCount < 50)
            filtered = filtered.filter(
              (s) => !s.badge && (s.ratingCount || 0) < 50,
            );
            break;
        }
      });
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "delivery":
        // Sort by delivery time (extract numbers, lower is faster)
        sorted.sort((a, b) => {
          const aMatch = a.delivery?.match(/\d+/);
          const bMatch = b.delivery?.match(/\d+/);
          const aTime = aMatch ? parseInt(aMatch[0]) : 999;
          const bTime = bMatch ? parseInt(bMatch[0]) : 999;
          return aTime - bTime;
        });
        break;
      case "cost-low":
        // Sort by starting price (lower = cheaper)
        sorted.sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0));
        break;
      case "cost-high":
        // Sort by starting price (higher = expensive)
        sorted.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
        break;
      case "relevance":
      default:
        // Relevance = rating + review count (Swiggy pattern)
        sorted.sort((a, b) => {
          const aScore = (a.rating || 0) * 10 + (a.ratingCount || 0);
          const bScore = (b.rating || 0) * 10 + (b.ratingCount || 0);
          return bScore - aScore;
        });
        break;
    }

    setFilteredAndSortedStores(sorted);
    // Reset displayed stores when filters/sort change
    setDisplayedStores(sorted.slice(0, STORES_PER_PAGE));
    setHasMoreStores(sorted.length > STORES_PER_PAGE);
  }, [stores, filters, sortBy, STORES_PER_PAGE]);

  // Load more stores for infinite scroll
  const loadMoreStores = async () => {
    if (isLoadingMore || !hasMoreStores) return;

    setIsLoadingMore(true);
    try {
      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const currentCount = displayedStores.length;
      const nextBatch = filteredAndSortedStores.slice(
        currentCount,
        currentCount + STORES_PER_PAGE,
      );
      setDisplayedStores([...displayedStores, ...nextBatch]);
      setHasMoreStores(
        currentCount + STORES_PER_PAGE < filteredAndSortedStores.length,
      );
    } catch (error) {
      // Silent error handling - stop loading more (Swiggy 2025 pattern)
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Pull to refresh handler - reloads all data
  const handleRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Wire up pull-to-refresh hook
  const { isRefreshing, pullDistance, handleTouchStart } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 100,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader />
        <main className="max-w-7xl mx-auto space-y-4 pt-4">
          {/* Hero Skeleton - Matches actual h-32 md:h-40 banner height */}
          <section className="px-4 md:px-6 lg:px-8">
            <Skeleton className="h-32 md:h-40 w-full rounded-xl" />
          </section>
          
          {/* Occasions Skeleton */}
          <div className="flex gap-3 overflow-hidden px-4 md:px-6 lg:px-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>

          {/* Stores Skeleton - Matches actual store card structure */}
          {/* Swiggy 2025: Tighter mobile gap - 12px mobile, 24px desktop, compact mobile padding - 8px mobile, 16px desktop */}
          <div className="grid grid-cols-2 gap-3 md:gap-6 px-4 md:px-6 lg:px-8 md:grid-cols-3 lg:grid-cols-4 bg-background">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-1.5 p-2 md:p-4 bg-card rounded-xl">
                <Skeleton className="aspect-square rounded-lg mb-2 md:mb-2.5 bg-card" />
                <Skeleton className="h-4 w-3/4" /> {/* Name: text-base */}
                <Skeleton className="h-3 w-1/2" /> {/* Category: text-xs */}
                <Skeleton className="h-3 w-2/3" /> {/* Rating + Delivery */}
                <Skeleton className="h-3 w-full" /> {/* Tagline */}
              </div>
            ))}
          </div>
        </main>
        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-[112px]">
      <CustomerMobileHeader />

      {/* Main Content */}
      {/* Swiggy 2025: Tighter mobile spacing - 16px mobile, 24px desktop */}
      <main className="max-w-7xl mx-auto space-y-4 md:space-y-6 pt-4">
        {/* Hero Banners - Always show section to prevent layout shift */}
        <section className="px-4 md:px-6 lg:px-8">
          {banners.length === 0 ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : (
            <div className="relative">
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {banners.map((item) => (
                    <CarouselItem
                      key={item.id}
                      className="basis-[85%] pl-2 md:basis-[45%]"
                    >
                      <Card className="cursor-pointer hover:shadow-lg border-0 overflow-hidden">
                        <CardContent className="p-0">
                          <div
                            className="relative h-32 md:h-40" // 128px mobile, 160px desktop (Swiggy 2025 standard)
                            onClick={() =>
                              navigate(
                                item.cta_link || item.link || item.store_id
                                  ? RouteMap.search(`store=${item.store_id}`)
                                  : "/",
                              )
                            }
                          >
                            {/* Banner Image */}
                            {item.image_url && (
                              <OptimizedImage
                                src={item.image_url}
                                alt={item.title}
                                width={400}
                                height={128}
                                className="absolute inset-0 w-full h-full object-cover md:hidden"
                              />
                            )}
                            {item.image_url && (
                              <OptimizedImage
                                src={item.image_url}
                                alt={item.title}
                                width={800}
                                height={160}
                                className="absolute inset-0 w-full h-full object-cover hidden md:block"
                              />
                            )}
                            
                            {/* Gradient Overlay (for better text readability) */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-transparent" />
                            
                            {/* Content - Center-aligned */}
                            <div className="relative z-10 p-4 h-full flex flex-col justify-center text-center space-y-1">
                              <div className="h-10 w-10 bg-white/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                <Gift className="h-6 w-6 text-white" />
                              </div>
                              <h3 className="font-semibold text-white text-sm">
                                {item.title}
                              </h3>
                              <p className="text-white/90 text-xs">
                                {item.subtitle || item.description}
                              </p>
                              {item.cta_text && (
                                <span className="text-white/80 text-xs font-medium">
                                  {item.cta_text} →
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              
              {/* Dot Indicators - Below carousel, left-aligned (Modern Ecommerce Pattern) */}
              {banners.length > 1 && (
                <div className="flex justify-start mt-3 px-4 md:px-6 lg:px-8">
                <div className="flex gap-1">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => carouselApi?.scrollTo(idx)}
                      className={cn(
                        "h-1.5 rounded-full",
                          idx === currentSlide
                            ? "w-6 bg-primary"
                            : "w-1.5 bg-muted-foreground/30",
                      )}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Occasions - Swiggy pattern */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-4 md:px-6 lg:px-8">
            <h2 className="text-lg font-semibold">Shop by Occasion</h2>
            <Button
              variant="link"
              className="text-primary p-0 h-auto text-sm"
              onClick={() => navigate(RouteMap.search())}
            >
              View All →
            </Button>
          </div>
          {/* Single row horizontal scroll (optimized for store card visibility) */}
          {occasions.length > 0 ? (
            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3 px-4 md:px-6 lg:px-8 lg:overflow-visible lg:justify-start">
              {occasions.map((occasion) => (
                <button
                  key={occasion.id}
                  onClick={() =>
                    navigate(
                      RouteMap.search(`occasion=${occasion.name.toLowerCase()}`),
                    )
                  }
                  className="snap-start flex flex-col items-center gap-1.5 min-w-[90px] md:min-w-[100px] shrink-0"
                  aria-label={`Browse ${occasion.name} gifts`}
                >
                  {/* ROUND circular image - Swiggy pattern (80px optimal) */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border/50 hover:border-primary">
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
          ) : (
            <div className="px-4 md:px-6 lg:px-8">
              <p className="text-sm text-muted-foreground text-center py-4">
                No occasions available
              </p>
            </div>
          )}
        </section>

        {/* Featured Offers - Swiggy 2025 pattern */}
        {offers.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-4 md:px-6 lg:px-8">
              <h2 className="text-lg font-semibold">Featured Offers</h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto text-sm"
                onClick={() => navigate(RouteMap.search("?filter=offers"))}
              >
                View All →
              </Button>
            </div>
            {/* Horizontal scroll */}
            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2 px-4 md:px-6 lg:px-8 lg:overflow-visible lg:justify-start">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onClick={() => navigate(offer.ctaLink || RouteMap.search())}
                />
              ))}
            </div>
          </section>
        )}

        {/* Top Rated Stores - Single unified section (Swiggy pattern) */}
        {!loading && stores.length === 0 ? (
          /* Empty State when no stores available */
          <section className="px-3 md:px-4 py-8">
            <EmptyStates.Products
              title="No stores available"
              description={`We couldn't find any stores in ${location}. Try changing your location or check back later.`}
              action={{
                label: "Change Location",
                onClick: () => {
                  // Trigger location selector
                  const locationButton = document.querySelector(
                    '[aria-label="Change location"]',
                  );
                  if (locationButton) {
                    (locationButton as HTMLElement).click();
                  }
                },
              }}
              secondaryAction={{
                label: "Browse All",
                onClick: () => navigate(RouteMap.search()),
              }}
            />
          </section>
        ) : stores.length > 0 ? (
          <section className="space-y-3 bg-background">
            {/* Smart Filters - Sticky (Swiggy 2025 pattern) */}
            <SmartFilters
              sortBy={sortBy}
              filters={filters}
              onSortChange={setSortBy}
              onFilterChange={setFilters}
              sticky={true}
              stickyTop="top-0"
            />

            <div className="flex items-center justify-between px-4 md:px-6 lg:px-8">
              <h2 className="text-lg font-semibold">Top Rated • {location}</h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto text-sm"
                onClick={() => navigate(RouteMap.search())}
              >
                View All →
              </Button>
            </div>
            <PullToRefresh
              isRefreshing={isRefreshing}
              pullDistance={pullDistance}
              onTouchStart={handleTouchStart}
            >
              <InfiniteScroll
                hasMore={hasMoreStores}
                isLoading={isLoadingMore}
                onLoadMore={loadMoreStores}
                threshold={100}
              >
                <div className="grid grid-cols-2 gap-4 md:gap-6 px-4 md:px-6 lg:px-8 md:grid-cols-3 lg:grid-cols-4 bg-background">
                  {displayedStores.map((store) => (
                <Card
                      key={store.id}
                      className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md"
                      onClick={() => navigate(RouteMap.catalog(store.id))}
                    >
                      <CardContent className="p-3 md:p-4">
                        {/* Image - Square 1:1 (Swiggy pattern for store cards) */}
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-card mb-2 md:mb-3">
                      <OptimizedImage
                            src={store.image}
                            alt={store.name}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {/* Sponsored Badge - Top Left (Small icon + text, Zomato pattern) */}
                          {store.sponsored && (
                            <Badge className="absolute top-2 left-2 bg-amber-100 px-1.5 py-0.5 gap-0.5 text-[10px] border-amber-200">
                              <Sparkles className="h-2.5 w-2.5 text-amber-900" />
                              <span className="text-amber-900 font-medium">
                                Sponsored
                              </span>
                            </Badge>
                          )}
                          {/* Bestseller/Trending Badge - Top Right (Small icon + text, no conflict with sponsored) */}
                          {store.badge && !store.sponsored && (
                            <Badge
                              className={cn(
                                "absolute top-2 right-2 px-1.5 py-0.5 gap-0.5 text-[10px] border-0",
                                store.badge === "bestseller"
                                  ? "bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))]"
                                  : "bg-[hsl(var(--warning-container))] text-[hsl(var(--on-warning-container))]",
                              )}
                            >
                              {store.badge === "bestseller" ? (
                                <>
                                  <Trophy className="h-2.5 w-2.5" />
                                  <span className="font-medium">
                                    Bestseller
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Flame className="h-2.5 w-2.5" />
                                  <span className="font-medium">Trending</span>
                                </>
                              )}
                            </Badge>
                          )}
                        </div>

                        {/* Content */}
                        <div className="space-y-1.5 md:space-y-2">
                          {/* Name - clamp to 2 lines for stability */}
                          <h3 className="text-base font-bold line-clamp-2">
                            {store.name}
                          </h3>

                          {/* Category - 12px gray per spec */}
                          {store.category && (
                            <p className="text-xs text-muted-foreground">
                              {store.category}
                            </p>
                          )}

                          {/* Meta row: rating (+count) • ETA • distance (if available) */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {store.rating}
                              {store.ratingCount
                                ? ` (${store.ratingCount})`
                                : ""}
                            </span>
                            <span>•</span>
                            <span>{store.delivery}</span>
                            {/* Distance can be added to Store type later if needed */}
                          </div>
                          {/* No price in store cards to keep to 3 signals */}

                          {/* Tagline - 12px gray, 1 line per spec */}
                          {store.tagline && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {store.tagline}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </InfiniteScroll>
            </PullToRefresh>
          </section>
        ) : null}

        {/* Trending Stores - Swiggy 2025 pattern */}
        {trendingStores.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-4 md:px-6 lg:px-8">
              <h2 className="text-lg font-semibold">Trending</h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto text-sm"
                onClick={() => navigate(RouteMap.search("?filter=trending"))}
              >
                View All →
              </Button>
            </div>
            {/* Horizontal scroll */}
            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3 px-4 md:px-6 lg:px-8 lg:overflow-visible lg:justify-start">
              {trendingStores.map((store) => (
                <Card
                  key={store.id}
                  className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md snap-start shrink-0 w-[150px] md:w-[180px]"
                  onClick={() => navigate(RouteMap.catalog(store.id))}
                >
                  <CardContent className="p-2 md:p-2.5">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-card mb-2 md:mb-2.5">
                      <OptimizedImage
                        src={store.image}
                        alt={store.name}
                        width={150}
                        height={150}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {store.sponsored && (
                        <Badge className="absolute top-2 left-2 bg-amber-100 px-1.5 py-0.5 gap-0.5 text-[10px] border-amber-200">
                          <Sparkles className="h-2.5 w-2.5 text-amber-900" />
                          <span className="text-amber-900 font-medium">
                            Sponsored
                          </span>
                        </Badge>
                      )}
                      {store.badge && !store.sponsored && (
                        <Badge
                          className={cn(
                            "absolute top-2 right-2 px-1.5 py-0.5 gap-0.5 text-[10px] border-0",
                            store.badge === "bestseller"
                              ? "bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))]"
                              : "bg-[hsl(var(--warning-container))] text-[hsl(var(--on-warning-container))]",
                          )}
                        >
                          {store.badge === "bestseller" ? (
                            <>
                              <Trophy className="h-2.5 w-2.5" />
                              <span className="font-medium">Bestseller</span>
                            </>
                          ) : (
                            <>
                              <Flame className="h-2.5 w-2.5" />
                              <span className="font-medium">Trending</span>
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold line-clamp-2">
                        {store.name}
                      </h3>
                      {store.category && (
                        <p className="text-xs text-muted-foreground">
                          {store.category}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {store.rating}
                          {store.ratingCount ? ` (${store.ratingCount})` : ""}
                        </span>
                        <span>•</span>
                        <span>{store.delivery}</span>
                      </div>
                      {store.tagline && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {store.tagline}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* New Launches - Swiggy 2025 pattern */}
        {newLaunches.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-4 md:px-6 lg:px-8">
              <h2 className="text-lg font-semibold">New on Wyshkit</h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto text-sm"
                onClick={() => navigate(RouteMap.search("?filter=new"))}
              >
                View All →
              </Button>
            </div>
            {/* Horizontal scroll */}
            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3 px-4 md:px-6 lg:px-8 lg:overflow-visible lg:justify-start">
              {newLaunches.map((store) => (
                <Card
                  key={store.id}
                  className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md snap-start shrink-0 w-[150px] md:w-[180px]"
                  onClick={() => navigate(RouteMap.catalog(store.id))}
                >
                  <CardContent className="p-2 md:p-2.5">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-card mb-2 md:mb-2.5">
                      <OptimizedImage
                        src={store.image}
                        alt={store.name}
                        width={150}
                        height={150}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {store.sponsored && (
                        <Badge className="absolute top-2 left-2 bg-amber-100 px-1.5 py-0.5 gap-0.5 text-[10px] border-amber-200">
                          <Sparkles className="h-2.5 w-2.5 text-amber-900" />
                          <span className="text-amber-900 font-medium">
                            Sponsored
                          </span>
                        </Badge>
                      )}
                      {store.badge && !store.sponsored && (
                        <Badge
                          className={cn(
                            "absolute top-2 right-2 px-1.5 py-0.5 gap-0.5 text-[10px] border-0",
                            store.badge === "bestseller"
                              ? "bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))]"
                              : "bg-[hsl(var(--warning-container))] text-[hsl(var(--on-warning-container))]",
                          )}
                        >
                          {store.badge === "bestseller" ? (
                            <>
                              <Trophy className="h-2.5 w-2.5" />
                              <span className="font-medium">Bestseller</span>
                            </>
                          ) : (
                            <>
                              <Flame className="h-2.5 w-2.5" />
                              <span className="font-medium">Trending</span>
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold line-clamp-2">
                        {store.name}
                      </h3>
                      {store.category && (
                        <p className="text-xs text-muted-foreground">
                          {store.category}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {store.rating}
                          {store.ratingCount ? ` (${store.ratingCount})` : ""}
                        </span>
                        <span>•</span>
                        <span>{store.delivery}</span>
                      </div>
                      {store.tagline && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {store.tagline}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Personalized Recommendations - Swiggy 2025 pattern */}
        {recommendedStores.length > 0 && user && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-4 md:px-6 lg:px-8">
              <h2 className="text-lg font-semibold">Recommended for You</h2>
              <Button
                variant="link"
                className="text-primary p-0 h-auto text-sm"
                onClick={() => navigate(RouteMap.search())}
              >
                View All →
              </Button>
            </div>
            {/* Horizontal scroll */}
            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3 px-4 md:px-6 lg:px-8 lg:overflow-visible lg:justify-start">
              {recommendedStores.map((store) => (
                <Card
                  key={store.id}
                  className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md snap-start shrink-0 w-[150px] md:w-[180px]"
                  onClick={() => navigate(RouteMap.catalog(store.id))}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-card mb-2 md:mb-3">
                      <OptimizedImage
                        src={store.image}
                        alt={store.name}
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {store.sponsored && (
                        <Badge className="absolute top-2 left-2 bg-amber-100 px-1.5 py-0.5 gap-0.5 text-[10px] border-amber-200">
                          <Sparkles className="h-2.5 w-2.5 text-amber-900" />
                          <span className="text-amber-900 font-medium">
                            Sponsored
                          </span>
                        </Badge>
                      )}
                      {store.badge && !store.sponsored && (
                        <Badge
                          className={cn(
                            "absolute top-2 right-2 px-1.5 py-0.5 gap-0.5 text-[10px] border-0",
                            store.badge === "bestseller"
                              ? "bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))]"
                              : "bg-[hsl(var(--warning-container))] text-[hsl(var(--on-warning-container))]",
                          )}
                        >
                          {store.badge === "bestseller" ? (
                            <>
                              <Trophy className="h-2.5 w-2.5" />
                              <span className="font-medium">Bestseller</span>
                            </>
                          ) : (
                            <>
                              <Flame className="h-2.5 w-2.5" />
                              <span className="font-medium">Trending</span>
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <h3 className="text-base font-bold line-clamp-2">
                        {store.name}
                      </h3>
                      {store.category && (
                        <p className="text-xs text-muted-foreground">
                          {store.category}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {store.rating}
                          {store.ratingCount ? ` (${store.ratingCount})` : ""}
                        </span>
                        <span>•</span>
                        <span>{store.delivery}</span>
                      </div>
                      {store.tagline && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {store.tagline}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

      </main>

      <StickyCartBar />
      <CustomerBottomNav />
      <HomeFooter />
    </div>
  );
};
