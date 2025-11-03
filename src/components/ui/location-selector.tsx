import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface LocationInfo {
  city: string;
  deliveryTime: string;
  displayText: string;
}

interface LocationSelectorProps {
  currentLocation: LocationInfo;
  onLocationChange: (location: LocationInfo) => void;
  className?: string;
}

const popularCities = [
  { city: 'Mumbai', deliveryTime: '40 mins' },
  { city: 'Delhi', deliveryTime: '45 mins' },
  { city: 'Bangalore', deliveryTime: '50 mins' },
  { city: 'Hyderabad', deliveryTime: '55 mins' },
  { city: 'Chennai', deliveryTime: '60 mins' },
  { city: 'Pune', deliveryTime: '50 mins' },
];

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  currentLocation,
  onLocationChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredCities = popularCities.filter(city =>
    city.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLocationSelect = (city: string, deliveryTime: string) => {
    const newLocation = {
      city,
      deliveryTime,
      displayText: `${city} • ${deliveryTime}`
    };
    onLocationChange(newLocation);
    setIsOpen(false);
    setSearchQuery('');
  };

  const detectCurrentLocation = async () => {
    setIsSearching(true);
    try {
      // Mock GPS detection - in real app would use Geolocation API
      setTimeout(() => {
        handleLocationSelect('Mumbai', '40 mins');
        setIsSearching(false);
      }, 1500);
    } catch (error) {
      setIsSearching(false);
      console.error('Location detection failed:', error);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 text-sm font-medium hover:bg-accent/50 transition-colors",
          "text-foreground/80 hover:text-foreground",
          className
        )}
      >
        <MapPin className="h-4 w-4 text-primary" />
        <span className="max-w-[120px] truncate">{currentLocation.displayText}</span>
      </Button>
      
      <Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <SheetContent side="bottom" className="h-auto rounded-t-xl sm:max-w-[480px] sm:left-1/2 sm:-translate-x-1/2">
          {/* Grabber */}
          <div className="flex justify-center pt-2 pb-4">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
          
          {/* Header */}
          <div className="px-4 pb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Select Delivery Location
            </h2>
          </div>
        
          <div className="px-4 pb-6 space-y-4">
          {/* Current Location Detection */}
          <Button 
            onClick={detectCurrentLocation}
            disabled={isSearching}
            className="w-full flex items-center gap-2"
            variant="outline"
          >
            <MapPin className="h-4 w-4" />
            {isSearching ? 'Detecting location...' : 'Use current location'}
          </Button>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for area, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Popular Cities */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground/80">Popular Cities</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredCities.map((location) => (
                <button
                  key={location.city}
                  onClick={() => handleLocationSelect(location.city, location.deliveryTime)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border",
                    "hover:bg-accent/50 transition-colors text-left",
                    currentLocation.city === location.city && "bg-accent border-primary"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{location.city}</span>
                    <span className="text-sm text-muted-foreground">Available for delivery</span>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {location.deliveryTime}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
};