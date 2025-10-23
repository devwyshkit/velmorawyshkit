import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, User, ShoppingBag, Heart, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/customer/shared/ThemeToggle";
import { useTheme } from "@/components/theme-provider";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "@/contexts/LocationContext";
import { loadGooglePlaces, initAutocomplete, formatAddress, reverseGeocode } from "@/lib/integrations/google-places";

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
  const { theme } = useTheme();
  const { cartCount } = useCart();
  const { location, setLocation } = useLocation();
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const addressInputRef = useRef<HTMLInputElement>(null);
  
  // Determine if dark mode is active (for logo switching)
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    if (isLocationSheetOpen && addressInputRef.current) {
      loadGooglePlaces().then(() => {
        if (addressInputRef.current) {
          initAutocomplete(addressInputRef.current, (place) => {
            const formattedAddress = formatAddress(place);
            // Extract city name from formatted address
            const cityMatch = formattedAddress.match(/([^,]+),/);
            const cityName = cityMatch ? cityMatch[1].trim() : formattedAddress.split(',')[0].trim();
            setLocationInput(cityName);
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
        navigate('/customer/home');
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

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-card border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3 flex-1">
          {showBackButton ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleBackClick}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {title && <h1 className="text-lg font-semibold line-clamp-1">{title}</h1>}
            </>
          ) : (
            <>
              <Link to="/customer/home" className="flex-shrink-0" aria-label="Go to home">
                <img 
                  src={isDark ? "/horizontal-no-tagline-fff-transparent-3000x750.png" : "/wyshkit-customer-logo.png"} 
                  alt="Wyshkit" 
                  className="h-8 hover:opacity-80 transition-opacity" 
                />
              </Link>
              {/* Location with city name - Swiggy pattern */}
              <button 
                onClick={handleLocationClick}
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
                aria-label="Change location"
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium max-w-[120px] truncate">{location}</span>
              </button>
            </>
          )}
        </div>
        
        {/* Desktop Only: Search, Cart, Wishlist, Account icons (mobile uses bottom nav) */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/customer/search")}
            aria-label="Search"
          >
            <Search className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate("/customer/cart")}
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
            onClick={() => navigate("/customer/wishlist")}
            aria-label="Wishlist"
          >
            <Heart className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/customer/profile")}
            aria-label="Account"
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
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
          <div className="sticky top-0 z-10 bg-background dark:bg-card border-b border-border px-4 py-3">
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
                        // Reverse geocode coordinates to get actual city name
                        const cityName = await reverseGeocode(
                          position.coords.latitude,
                          position.coords.longitude
                        );
                        setLocationInput(cityName);
                        setLocation(cityName);
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
                      // Handle error silently in production
                      alert("Unable to get your location. Please enable location permissions.");
                    }
                  );
                } else {
                  alert("Geolocation is not supported by your browser");
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
    </header>
  );
};

