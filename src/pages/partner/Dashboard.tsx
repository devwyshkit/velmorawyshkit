/**
 * Partner Dashboard Layout
 * Responsive: Desktop sidebar + Mobile bottom nav (matches customer UI pattern)
 */

import { Outlet } from 'react-router-dom';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PartnerBottomNav } from '@/components/partner/PartnerBottomNav';
import { PartnerSidebar } from '@/components/partner/PartnerSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export const Dashboard = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <PartnerSidebar />
      
      <div className="flex-1 flex flex-col">
        <PartnerHeader />
        
        {/* Mobile: pb-20 for bottom nav | Desktop: pb-4 */}
        <main className={isMobile ? "pb-20" : "pb-4"}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <PartnerBottomNav />
    </div>
  );
};

