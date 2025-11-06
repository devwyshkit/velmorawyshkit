import { useState, useEffect } from 'react';

interface LocationInfo {
  city: string;
  deliveryTime: string;
  displayText: string;
}

// DRY principle - Single source of truth for location data
export const useLocation = () => {
  const [location, setLocation] = useState<LocationInfo>({
    city: 'Mumbai',
    deliveryTime: '40 mins',
    displayText: 'Mumbai • 40 mins'
  });

  const [isLoading, setIsLoading] = useState(false);

  const updateLocation = async (newCity: string) => {
    setIsLoading(true);
    try {
      // Mock API call - in real app, this would determine delivery time based on location
      const deliveryTime = newCity === 'Mumbai' ? '40 mins' : '60 mins';
      
      setLocation({
        city: newCity,
        deliveryTime,
        displayText: `${newCity} • ${deliveryTime}`
      });
    } catch (error) {
      // Silent error handling (Swiggy 2025 pattern)
    } finally {
      setIsLoading(false);
    }
  };

  return {
    location,
    updateLocation,
    isLoading
  };
};