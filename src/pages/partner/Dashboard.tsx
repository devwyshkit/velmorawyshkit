/**
 * Partner Dashboard Layout
 * Mobile-first container with bottom nav (same pattern as customer UI)
 */

import { Outlet } from 'react-router-dom';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PartnerBottomNav } from '@/components/partner/PartnerBottomNav';

export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <PartnerHeader />
      
      <main className="pb-16 md:pb-4">
        <Outlet />
      </main>

      <PartnerBottomNav />
    </div>
  );
};

