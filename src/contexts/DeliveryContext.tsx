import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { secureStorage } from "@/lib/security/encryption";

interface DeliveryContextType {
  location: string;
  setLocation: (location: string) => void;
  deliveryDate: Date;
  setDeliveryDate: (date: Date) => void;
  loading: boolean;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export const DeliveryProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocationState] = useState<string>('Bangalore');
  const [deliveryDate, setDeliveryDateState] = useState<Date>(() => {
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [loading, setLoading] = useState(true);

  // Load location and delivery date from secure storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedLocation = await secureStorage.getItem('wyshkit_location');
        const storedDeliveryDate = await secureStorage.getItem('wyshkit_delivery_date');
        
        if (storedLocation) {
          setLocationState(storedLocation);
        }
        
        if (storedDeliveryDate) {
          const parsedDate = new Date(storedDeliveryDate);
          if (!isNaN(parsedDate.getTime())) {
            setDeliveryDateState(parsedDate);
          }
        }
      } catch (error) {
        console.error('Error loading delivery data:', error);
        // Fallback to defaults
        setLocationState('Bangalore');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDeliveryDateState(tomorrow);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Persist location and delivery date to secure storage
  useEffect(() => {
    if (!loading) {
      secureStorage.setItem('wyshkit_location', location).catch(error => {
        console.error('Error saving location:', error);
      });
      secureStorage.setItem('wyshkit_delivery_date', deliveryDate.toISOString()).catch(error => {
        console.error('Error saving delivery date:', error);
      });
    }
  }, [location, deliveryDate, loading]);

  // Optional: Detect user's location on first visit
  useEffect(() => {
    const checkLocationDetection = async () => {
      try {
        const hasDetectedLocation = await secureStorage.getItem('wyshkit_location_detected');
        
        if (!hasDetectedLocation && navigator.geolocation) {
          setLoading(true);
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                // Use reverse geocoding to get city name
                // For now, just mark as detected
                await secureStorage.setItem('wyshkit_location_detected', 'true');
              } catch (error) {
                console.error('Error detecting location:', error);
              } finally {
                setLoading(false);
              }
            },
            async (error) => {
              console.error('Geolocation error:', error);
              await secureStorage.setItem('wyshkit_location_detected', 'true');
              setLoading(false);
            }
          );
        }
      } catch (error) {
        console.error('Error checking location detection:', error);
      }
    };
    
    checkLocationDetection();
  }, []);

  const setLocation = (newLocation: string) => {
    setLocationState(newLocation);
  };

  const setDeliveryDate = (newDate: Date) => {
    setDeliveryDateState(newDate);
  };

  return (
    <DeliveryContext.Provider value={{ location, setLocation, deliveryDate, setDeliveryDate, loading }}>
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error("useDelivery must be used within DeliveryProvider");
  }
  return context;
};