import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { RouteMap } from "@/routes";
import { MapPin, User, ShoppingBag, Heart, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useDelivery } from "@/contexts/DeliveryContext";
import { SearchBar } from "@/components/customer/shared/SearchBar";
import { CartSheet } from "@/pages/customer/CartSheet";
import { loadGooglePlaces, initAutocomplete, formatAddress, reverseGeocode, extractAreaAndCity } from "@/lib/integrations/google-places";

interface CustomerMobileHeaderProps {
  showBackButton?: boolean;
  title?: string;
  onBackClick?: () => void;
}

export const CustomerMobileHeader = ({
  showBackButton = false,
  title,
  onBackClick,
}: CustomerMobileHeaderProps) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { location, setLocation } = useDelivery();
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLocationSheetOpen && addressInputRef.current) {
      loadGooglePlaces().then(() => {
        if (addressInputRef.current) {
          initAutocomplete(addressInputRef.current, (place) => {
            // Extract area and city (Swiggy 2025 pattern: "Area, City")
            const { area, city, full } = extractAreaAndCity(place);
            // Display format: "Area, City" or just area if city is same
            const displayLocation = area && city && area !== city ? `${area}, ${city}` : (area || city || full);
            setLocationInput(displayLocation);
          });
        }
      });
    }
  }, [isLocationSheetOpen]);

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      // Smart back: Go back if history exists, otherwise go to home (Swiggy pattern)
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate(RouteMap.home());
      }
    }
  };

  const handleLocationClick = () => {
    setLocationInput(location);
    setIsLocationSheetOpen(true);
  };

  const handleSaveLocation = () => {
    if (locationInput.trim()) {
      setLocation(locationInput);
      setIsLocationSheetOpen(false);
    }
  };

  // Popular cities for quick selection
  const popularCities = [
    "Bangalore",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "Chennai",
    "Pune",
    "Kolkata",
    "Ahmedabad",
  ];

  // Scroll-aware hide/reveal
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY.current + 4;
      const goingUp = y < lastY.current - 4;
      if (goingDown && y > 24) setHidden(true);
      else if (goingUp) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={"sticky top-0 z-40 bg-white border-b border-border transition-transform duration-200 " + (hidden ? "-translate-y-full" : "translate-y-0") }>
      {/* Mobile: Two-row layout | Desktop: Single row */}
      <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-0 h-auto md:h-14">
        {/* Row 1: Logo + Location (Mobile) | Logo + Location | SearchBar | Icons (Desktop) */}
          {showBackButton ? (
          // Back button mode: Single row on all screens
            <>
            <div className="flex items-center gap-2.5 flex-shrink-0 w-full md:w-auto">
              <Button variant="ghost" size="icon" onClick={handleBackClick} className="flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {title && <h1 className="text-lg font-semibold line-clamp-1 truncate">{title}</h1>}
            </div>
            </>
          ) : (
            <>
            {/* Mobile Row 1: Logo (left) + Location (right) */}
            {/* Desktop: Logo + Location (left) */}
            <div className="flex items-center justify-between w-full md:w-auto md:flex-shrink-0 md:justify-start gap-2 md:gap-2.5">
              {/* Logo - Responsive sizing (Swiggy 2025 pattern) */}
              <Link to={RouteMap.home()} className="flex-shrink-0" aria-label="Go to home">
                <img 
                  src="/wyshkit-customer-logo.png"
                  alt="Wyshkit" 
                  className="h-6 md:h-7 lg:h-8 hover:opacity-80 transition-opacity" 
                />
              </Link>
              {/* Location - Compact (Swiggy 2025 pattern: "Area, City") */}
                <button 
                  onClick={handleLocationClick}
                className="flex items-center gap-1.5 px-2 py-1.5 md:py-1 rounded-md hover:bg-muted/50 transition-colors flex-shrink-0"
                  aria-label="Change location"
                >
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium max-w-[90px] sm:max-w-[110px] md:max-w-[140px] truncate" title={location}>
                  {location}
                </span>
                </button>
            </div>
            
            {/* Mobile Row 2: Search Bar (full-width) | Desktop: Search Bar (center) */}
            <div className="w-full md:flex-1 md:min-w-0 md:mx-2 lg:mx-4">
              <SearchBar variant="navigation" placeholder="Search for gifts, occasions..." showSuggestions={true} />
        </div>
        
            {/* Desktop Only: Cart, Wishlist, Account icons (mobile uses bottom nav) */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11"
              onClick={() => setIsCartOpen(true)}
            aria-label={`Shopping cart with ${cartCount} items`}
          >
            <ShoppingBag className="h-6 w-6" />
            {cartCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs pointer-events-none"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
              onClick={() => navigate(RouteMap.favorites())}
            aria-label="Favorites"
          >
            <Heart className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
              onClick={() => navigate(RouteMap.profile())}
            aria-label="Account"
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
          </>
        )}
      </div>

      {/* Location Selection Sheet */}
      <Sheet open={isLocationSheetOpen} onOpenChange={setIsLocationSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[80vh] rounded-t-xl p-0 overflow-hidden flex flex-col sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Location Selection</SheetTitle>
            <SheetDescription>
              Select your delivery location to see available partners and products
            </SheetDescription>
          </SheetHeader>
          {/* Grabber */}
          <div className="flex justify-center pt-2">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
            <h2 className="text-lg font-semibold">Select Location</h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Use Current Location (Swiggy pattern) */}
            <Button
              variant="outline"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      try {
                        // Reverse geocode coordinates to get location with area and city
                        const place = await reverseGeocode(
                          position.coords.latitude,
                          position.coords.longitude
                        );
                        // Extract area and city from reverse geocoded address (Swiggy 2025 pattern)
                        const { area, city, full } = extractAreaAndCity(place);
                        // Display format: "Area, City" or just area if city is same
                        const displayLocation = area && city && area !== city ? `${area}, ${city}` : (area || city || full);
                        setLocationInput(displayLocation);
                        setLocation(displayLocation);
                        setIsLocationSheetOpen(false);
                      } catch (error) {
                        // Handle error silently in production
                        // Fallback to generic text
                        setLocationInput("Your Current Location");
                        setLocation("Your Current Location");
                        setIsLocationSheetOpen(false);
                      }
                    },
                    (error) => {
                      // Handle error gracefully - show toast instead of alert (better UX)
                      console.error("Geolocation error:", error);
                      setLocationInput("Your Current Location");
                    }
                  );
                } else {
                  // Geolocation not supported - gracefully handle
                  console.warn("Geolocation is not supported by your browser");
                  setLocationInput("Your Current Location");
                }
              }}
              className="w-full h-12 text-base gap-2"
              size="lg"
            >
              <MapPin className="h-5 w-5 text-primary" />
              Use Current Location
            </Button>

            {/* Search Input with Google Places */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search for your location</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={addressInputRef}
                  type="text"
                  placeholder="Enter city or area"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Popular Cities */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Popular Cities</h3>
              <div className="grid grid-cols-2 gap-2">
                {popularCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setLocationInput(city);
                    }}
                    className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{city}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer with Save Button */}
          <div className="sticky bottom-0 bg-white border-t border-border p-4">
            <Button
              onClick={handleSaveLocation}
              className="w-full h-12 text-base"
              size="lg"
              disabled={!locationInput.trim()}
            >
              Save Location
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Cart Sheet Modal for Desktop */}
      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};

