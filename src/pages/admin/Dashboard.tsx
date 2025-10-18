/**
 * Admin Dashboard Layout
 * Responsive: Desktop sidebar + Mobile bottom nav (matches customer/partner pattern)
 */

import { Outlet } from 'react-router-dom';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

export const Dashboard = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        
        {/* Mobile: pb-20 for bottom nav | Desktop: pb-4 */}
        <main className={isMobile ? "pb-20" : "pb-4"}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <AdminBottomNav />
    </div>
  );
};

