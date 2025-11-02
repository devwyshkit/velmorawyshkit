import { useState, useEffect, useCallback } from "react";
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
import { OptimizedImage } from "@/components/ui/skeleton-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { fetchStores, type Store } from "@/lib/integrations/supabase-data";
import { supabase } from "@/lib/integrations/supabase-client";
import { useDelivery } from "@/contexts/DeliveryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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

  // Load visited stores from localStorage (shown if ≥2 views)
  useEffect(() => {
    const visitedKey = "wyshkit_visited_stores";
    const visited = JSON.parse(localStorage.getItem(visitedKey) || "[]");
    // Filter stores with 2+ views
    const filtered = visited
      .filter((v: { viewCount?: number }) => (v.viewCount || 0) >= 2)
      .slice(0, 6);
    if (filtered.length >= 2) {
      setVisitedStores(
        filtered.map(
          (v: {
            id: string;
            name: string;
            image: string;
            rating: number;
            ratingCount?: number;
            delivery: string;
            category?: string;
            tagline?: string;
            badge?: "bestseller" | "trending";
            sponsored?: boolean;
          }) => ({
        id: v.id,
        name: v.name,
        image: v.image,
        rating: v.rating,
        ratingCount: v.ratingCount,
        delivery: v.delivery,
        category: v.category,
        tagline: v.tagline,
        badge: v.badge,
        sponsored: v.sponsored,
            status: "approved" as const,
            is_active: true,
          }),
        ),
      );
    }

    // Load personalized recommendations (only if user logged in AND visited ≥3 stores)
    if (user && visited.length >= 3) {
      // Use visited stores + some from stores array for recommendations
      const visitedIds = new Set(visited.map((v: { id: string }) => v.id));
      const recommended = stores
        .filter((s) => !visitedIds.has(s.id))
        .slice(0, 6);
      setRecommendedStores(recommended);
    }
  }, [user, stores]);

  // Load data function - can be called from useEffect or pull-to-refresh
  const loadData = useCallback(async () => {
      setLoading(true);
      try {
        const hasSupabaseEnv = Boolean(
        import.meta.env.VITE_SUPABASE_URL &&
          import.meta.env.VITE_SUPABASE_ANON_KEY,
        );

        if (!hasSupabaseEnv) {
          // No Supabase env in dev → rely on fallbacks immediately
          setBanners([
            {
            id: "1",
            title: "Welcome to Wyshkit",
            image_url:
              "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=128&fit=crop",
            cta_link: "/search",
            is_active: true,
          },
          ]);
          const fallbackOccasions: Occasion[] = [
          {
            id: "1",
            name: "Birthday",
            image:
              "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop",
            icon: "🎂",
            slug: "birthday",
          },
          {
            id: "2",
            name: "Anniversary",
            image:
              "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=100&h=100&fit=crop",
            icon: "💍",
            slug: "anniversary",
          },
          {
            id: "3",
            name: "Wedding",
            image:
              "https://images.unsplash.com/photo-1519741497674-611481863552?w=100&h=100&fit=crop",
            icon: "💒",
            slug: "wedding",
          },
          {
            id: "4",
            name: "Corporate",
            image:
              "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=100&h=100&fit=crop",
            icon: "🏢",
            slug: "corporate",
          },
          ];
          setOccasions(fallbackOccasions);
        const fallbackStores = [
          {
            id: "1",
            name: "GiftCraft Studio",
            image:
              "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop",
              rating: 4.8,
            delivery: "35–45 min",
            badge: "bestseller" as const,
            location: "Bangalore",
            category: "Custom Gifts",
            tagline: "Handcrafted personalized gifts",
              ratingCount: 156,
              sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "2",
            name: "Luxury Hampers Co",
            image:
              "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=200&h=200&fit=crop",
              rating: 4.6,
            delivery: "2–3 days",
            badge: "trending" as const,
            location: "Mumbai",
            category: "Hampers",
            tagline: "Premium gift hampers",
              ratingCount: 89,
              sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "3",
            name: "Sweet Delights Bakery",
            image:
              "https://images.unsplash.com/photo-1486427944299-d1955d23da34?w=200&h=200&fit=crop",
            rating: 4.5,
            delivery: "1-2 days",
            location: "Delhi",
            category: "Chocolates & Sweets",
            tagline: "Artisan chocolates and gourmet sweets",
            ratingCount: 32,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "4",
            name: "Flower Boutique",
            image:
              "https://images.unsplash.com/photo-1563241522-316a37a47b7d?w=200&h=200&fit=crop",
            rating: 4.7,
            delivery: "Same day",
            location: "Pune",
            category: "Flowers",
            tagline: "Fresh flowers for every occasion",
            ratingCount: 28,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "5",
            name: "Tech Gift Hub",
            image:
              "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop",
            rating: 4.4,
            delivery: "3-5 days",
            location: "Hyderabad",
            category: "Tech Gifts",
            tagline: "Latest gadgets and tech accessories",
            ratingCount: 45,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "6",
            name: "Artisan Crafts Co",
            image:
              "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=200&h=200&fit=crop",
            rating: 4.9,
            delivery: "5-7 days",
            badge: "trending" as const,
            location: "Chennai",
            category: "Handmade",
            tagline: "Unique handmade gifts",
            ratingCount: 112,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "7",
            name: "Gourmet Treats Box",
            image:
              "https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=200&h=200&fit=crop",
            rating: 4.3,
            delivery: "2-3 days",
            location: "Kolkata",
            category: "Food & Beverage",
            tagline: "Curated gourmet selections",
            ratingCount: 18,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "8",
            name: "Books & Beyond",
            image:
              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=200&fit=crop",
            rating: 4.6,
            delivery: "3-4 days",
            location: "Delhi",
            category: "Books",
            tagline: "Curated book collections",
            ratingCount: 25,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          ];
            // Sort by rating descending
        const sorted = [...fallbackStores].sort(
          (a, b) => (b.rating || 0) - (a.rating || 0),
        );
        setStores(sorted);

        // Filter trending and new for fallback data
        const trending = sorted
          .filter((s) => s.badge === "trending" || (s.ratingCount || 0) > 100)
          .slice(0, 8);
        setTrendingStores(trending);

        const newOnes = sorted
          .filter((s) => (s.ratingCount || 0) < 50)
          .slice(0, 8);
        // Ensure we always have new launches if stores exist (defensive check)
        if (newOnes.length === 0 && sorted.length > 0) {
          // If no stores match, use first few stores as fallback (they're already sorted by rating)
          // This ensures the section always shows during development
          const fallbackNew = sorted.slice(0, Math.min(5, sorted.length));
          setNewLaunches(fallbackNew);
        } else {
          setNewLaunches(newOnes);
        }

        // Mock offers for fallback
        const mockOffers: Offer[] = [
          {
            id: "1",
            title: "Bank Offers",
            discount: "10% OFF",
            validUntil: "Valid till 31 Dec",
            ctaLink: "/search?filter=offers",
            bankName: "HDFC Bank",
            description: "On orders above ₹1000",
          },
          {
            id: "2",
            title: "First Order Bonus",
            discount: "₹200 OFF",
            validUntil: "Limited time",
            ctaLink: "/search",
            description: "For new customers",
          },
          {
            id: "3",
            title: "Festive Special",
            discount: "15% OFF",
            validUntil: "Valid till 31 Dec",
            ctaLink: "/search",
            description: "On all occasions",
          },
        ];
        setOffers(mockOffers);
          return;
        }

        // Load banners from Supabase
        const { data: bannersData } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
        
        if (bannersData && bannersData.length > 0) {
          setBanners(bannersData);
        } else {
        // Fallback data for development - Multiple banners to test navigation
          setBanners([
            {
            id: "1",
            title: "Welcome to Wyshkit",
            image_url:
              "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=128&fit=crop",
            cta_link: "/search",
            is_active: true,
          },
          {
            id: "2",
            title: "Festive Season Special",
            image_url:
              "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=128&fit=crop",
            cta_link: "/search?occasion=festival",
            is_active: true,
          },
          {
            id: "3",
            title: "New Arrivals",
            image_url:
              "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=128&fit=crop",
            cta_link: "/search?filter=new",
            is_active: true,
          },
          ]);
        }

        // Load occasions from Supabase
        const { data: occasionsData } = await supabase
        .from("occasions")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
        
        if (occasionsData && occasionsData.length > 0) {
        setOccasions(
          occasionsData.map((occ) => ({
            id: occ.id,
            name: occ.name,
            image: occ.image_url,
            icon: occ.icon_emoji,
            slug: occ.slug,
          })),
        );
        } else {
          // Fallback data for development
          setOccasions([
          {
            id: "1",
            name: "Birthday",
            image:
              "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop",
            icon: "🎂",
            slug: "birthday",
          },
          {
            id: "2",
            name: "Anniversary",
            image:
              "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=100&h=100&fit=crop",
            icon: "💍",
            slug: "anniversary",
          },
          {
            id: "3",
            name: "Wedding",
            image:
              "https://images.unsplash.com/photo-1519741497674-611481863552?w=100&h=100&fit=crop",
            icon: "💒",
            slug: "wedding",
          },
          {
            id: "4",
            name: "Corporate",
            image:
              "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=100&h=100&fit=crop",
            icon: "🏢",
            slug: "corporate",
          },
        ]);
      }

      // Load stores from Supabase (sorted by rating descending)
      const storesData = await fetchStores(location);
      let sortedStores: Store[] = [];
      if (storesData && storesData.length > 0) {
            // Sort by rating descending (Swiggy pattern: Top Rated)
        sortedStores = [...storesData].sort(
          (a, b) => (b.rating || 0) - (a.rating || 0),
        );
        setStores(sortedStores);
          } else {
          // Fallback data for development
        const fallbackStores2 = [
          {
            id: "1",
            name: "GiftCraft Studio",
            image:
              "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop",
              rating: 4.8,
            delivery: "1-2 days",
            badge: "bestseller" as const,
            location: "Bangalore",
            category: "Custom Gifts",
            tagline: "Handcrafted personalized gifts",
              ratingCount: 156,
              sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "2",
            name: "Luxury Hampers Co",
            image:
              "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=200&h=200&fit=crop",
              rating: 4.6,
            delivery: "2-3 days",
            badge: "trending" as const,
            location: "Mumbai",
            category: "Hampers",
            tagline: "Premium gift hampers",
              ratingCount: 89,
              sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "3",
            name: "Sweet Delights Bakery",
            image:
              "https://images.unsplash.com/photo-1486427944299-d1955d23da34?w=200&h=200&fit=crop",
            rating: 4.5,
            delivery: "1-2 days",
            location: "Delhi",
            category: "Chocolates & Sweets",
            tagline: "Artisan chocolates and gourmet sweets",
            ratingCount: 32,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "4",
            name: "Flower Boutique",
            image:
              "https://images.unsplash.com/photo-1563241522-316a37a47b7d?w=200&h=200&fit=crop",
            rating: 4.7,
            delivery: "Same day",
            location: "Pune",
            category: "Flowers",
            tagline: "Fresh flowers for every occasion",
            ratingCount: 28,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "5",
            name: "Tech Gift Hub",
            image:
              "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop",
            rating: 4.4,
            delivery: "3-5 days",
            location: "Hyderabad",
            category: "Tech Gifts",
            tagline: "Latest gadgets and tech accessories",
            ratingCount: 45,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "6",
            name: "Artisan Crafts Co",
            image:
              "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=200&h=200&fit=crop",
            rating: 4.9,
            delivery: "5-7 days",
            badge: "trending" as const,
            location: "Chennai",
            category: "Handmade",
            tagline: "Unique handmade gifts",
            ratingCount: 112,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "7",
            name: "Gourmet Treats Box",
            image:
              "https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=200&h=200&fit=crop",
            rating: 4.3,
            delivery: "2-3 days",
            location: "Kolkata",
            category: "Food & Beverage",
            tagline: "Curated gourmet selections",
            ratingCount: 18,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
          {
            id: "8",
            name: "Books & Beyond",
            image:
              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=200&fit=crop",
            rating: 4.6,
            delivery: "3-4 days",
            location: "Delhi",
            category: "Books",
            tagline: "Curated book collections",
            ratingCount: 25,
            sponsored: false,
            status: "approved" as const,
            is_active: true,
          },
            ];
            // Sort by rating descending
        sortedStores = [...fallbackStores2].sort(
          (a, b) => (b.rating || 0) - (a.rating || 0),
        );
        setStores(sortedStores);
      }
      // Initialize displayed stores for infinite scroll
      // Filtering and sorting will be applied in useEffect
      setDisplayedStores(sortedStores.slice(0, STORES_PER_PAGE));
      setHasMoreStores(sortedStores.length > STORES_PER_PAGE);
      setFilteredAndSortedStores(sortedStores);

      // Filter trending stores (badge === 'trending' OR high engagement)
      const trending = sortedStores
        .filter((s) => s.badge === "trending" || (s.ratingCount || 0) > 100)
        .slice(0, 8);
      setTrendingStores(trending);

      // Filter new launches (ratingCount < 50 - indicates newer stores)
      const newOnes = sortedStores
        .filter((s) => (s.ratingCount || 0) < 50)
        .slice(0, 8);
      // Ensure we always have new launches if stores exist (defensive check)
      if (newOnes.length === 0 && sortedStores.length > 0) {
        // If no stores match, use first few stores as fallback (they're already sorted by rating)
        // This ensures the section always shows during development
        const fallbackNew = sortedStores.slice(
          0,
          Math.min(5, sortedStores.length),
        );
        setNewLaunches(fallbackNew);
      } else {
        setNewLaunches(newOnes);
      }

      // Load offers (mock data - can be migrated to Supabase later)
      const mockOffers: Offer[] = [
        {
          id: "1",
          title: "Bank Offers",
          discount: "10% OFF",
          validUntil: "Valid till 31 Dec",
          ctaLink: "/search?filter=offers",
          bankName: "HDFC Bank",
          description: "On orders above ₹1000",
        },
        {
          id: "2",
          title: "First Order Bonus",
          discount: "₹200 OFF",
          validUntil: "Limited time",
          ctaLink: "/search",
          description: "For new customers",
        },
        {
          id: "3",
          title: "Festive Special",
          discount: "15% OFF",
          validUntil: "Valid till 31 Dec",
          ctaLink: "/search",
          description: "On all occasions",
        },
      ];
      setOffers(mockOffers);
      } catch (error) {
      console.error("Error loading data:", error);
      // Ensure offers are still set even on error (fallback)
      const mockOffers: Offer[] = [
        {
          id: "1",
          title: "Bank Offers",
          discount: "10% OFF",
          validUntil: "Valid till 31 Dec",
          ctaLink: "/search?filter=offers",
          bankName: "HDFC Bank",
          description: "On orders above ₹1000",
        },
        {
          id: "2",
          title: "First Order Bonus",
          discount: "₹200 OFF",
          validUntil: "Limited time",
          ctaLink: "/search",
          description: "For new customers",
        },
        {
          id: "3",
          title: "Festive Special",
          discount: "15% OFF",
          validUntil: "Valid till 31 Dec",
          ctaLink: "/search",
          description: "On all occasions",
        },
      ];
      setOffers(mockOffers);
        toast({
          title: "Loading error",
          description: "Some content may not be available",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
  }, [location, toast]);

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
            // Stores with offers/badges (mock: check for badge or sponsored)
            filtered = filtered.filter((s) => s.badge || s.sponsored);
            break;
          case "fast-delivery":
            // Stores with fast delivery (mock: delivery time < 1 day)
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
            // New stores (mock: no badge and ratingCount < 50)
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
        // Mock: sort by ratingCount (lower = cheaper, for demo)
        sorted.sort((a, b) => (a.ratingCount || 0) - (b.ratingCount || 0));
        break;
      case "cost-high":
        // Mock: sort by ratingCount (higher = expensive, for demo)
        sorted.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
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
      console.error("Error loading more stores:", error);
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
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader />
        <main className="max-w-screen-xl mx-auto space-y-4 pt-4">
          {/* Hero Skeleton - Matches actual h-40 banner height */}
          <section className="px-4">
            <Skeleton className="h-40 w-full rounded-xl" />
          </section>
          
          {/* Occasions Skeleton */}
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>

          {/* Stores Skeleton - Matches actual store card structure */}
          <div className="grid grid-cols-2 gap-4 px-4 md:grid-cols-3 lg:grid-cols-4 bg-background">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-1.5 p-2.5 bg-card rounded-xl">
                <Skeleton className="aspect-square rounded-lg mb-2.5 bg-card" />
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
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader />

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto space-y-6 pt-4">
        {/* Hero Banners - Always show section to prevent layout shift */}
        <section className="px-4">
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
                      <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] border-0 overflow-hidden">
                        <CardContent className="p-0">
                          <div
                            className="relative h-40 md:h-48" // 160px mobile, 192px desktop (Swiggy standard)
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
                                height={160}
                                className="absolute inset-0 w-full h-full object-cover md:hidden"
                              />
                            )}
                            {item.image_url && (
                              <OptimizedImage
                                src={item.image_url}
                                alt={item.title}
                                width={800}
                                height={192}
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
                <div className="flex justify-start mt-3 px-4">
                <div className="flex gap-1">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => carouselApi?.scrollTo(idx)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
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
          <div className="flex items-center justify-between px-4">
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
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3 px-4 lg:overflow-visible lg:px-0 lg:gap-6 lg:justify-start">
            {occasions.map((occasion) => (
              <button
                key={occasion.id}
                onClick={() =>
                  navigate(
                    RouteMap.search(`occasion=${occasion.name.toLowerCase()}`),
                  )
                }
                className="snap-start flex flex-col items-center gap-1.5 min-w-[80px] shrink-0 md:min-w-0"
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

        {/* Featured Offers - Swiggy 2025 pattern */}
        {offers.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-4">
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
            <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2 px-4 lg:overflow-visible lg:px-0 lg:gap-6 lg:justify-start">
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
          <section className="px-4 py-8">
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

            <div className="flex items-center justify-between px-4">
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
                <div className="grid grid-cols-2 gap-4 px-4 md:grid-cols-3 lg:grid-cols-4 bg-background">
                  {displayedStores.map((store) => (
                <Card
                      key={store.id}
                      className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow"
                      onClick={() => navigate(RouteMap.search(`store=${store.id}`))}
                    >
                      <CardContent className="p-2.5">
                        {/* Image - Square 1:1 (Swiggy pattern for store cards) */}
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-card mb-2.5">
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
                        <div className="space-y-1.5">
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
            <div className="flex items-center justify-between px-4">
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
            <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3 px-4 lg:overflow-visible lg:px-0 lg:gap-6 lg:justify-start">
              {trendingStores.map((store) => (
                <Card
                  key={store.id}
                  className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow snap-start shrink-0 w-[150px] md:w-[180px]"
                  onClick={() => navigate(RouteMap.search(`store=${store.id}`))}
                >
                  <CardContent className="p-2.5">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-card mb-2.5">
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
            <div className="flex items-center justify-between px-4">
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
            <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3 px-4 lg:overflow-visible lg:px-0 lg:gap-6 lg:justify-start">
              {newLaunches.map((store) => (
                <Card
                  key={store.id}
                  className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow snap-start shrink-0 w-[150px] md:w-[180px]"
                  onClick={() => navigate(RouteMap.search(`store=${store.id}`))}
                >
                  <CardContent className="p-2.5">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-card mb-2.5">
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
            <div className="flex items-center justify-between px-4">
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
            <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3 px-4 lg:overflow-visible lg:px-0 lg:gap-6 lg:justify-start">
              {recommendedStores.map((store) => (
                <Card
                  key={store.id}
                  className="cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow snap-start shrink-0 w-[150px] md:w-[180px]"
                  onClick={() => navigate(RouteMap.search(`store=${store.id}`))}
                >
                  <CardContent className="p-2.5">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-card mb-2.5">
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

      </main>

      <CustomerBottomNav />
      <HomeFooter />
    </div>
  );
};
