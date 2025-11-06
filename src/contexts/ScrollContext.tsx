import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ScrollContextType {
  isHidden: boolean;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const ScrollProvider = ({ children }: { children: ReactNode }) => {
  const [isHidden, setIsHidden] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setIsHidden(false);
      return;
    }

    // Shared scroll state for persistent bar and bottom nav (Swiggy 2025 pattern)
    const lastY = { current: 0 };
    
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY.current + 4;
      const goingUp = y < lastY.current - 4;
      
      if (goingDown && y > 24) {
        setIsHidden(true);
      } else if (goingUp) {
        setIsHidden(false);
      }
      
      lastY.current = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  return (
    <ScrollContext.Provider value={{ isHidden }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScrollVisibility = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    // Return default values if context not available (fallback)
    return { isHidden: false };
  }
  return context;
};





