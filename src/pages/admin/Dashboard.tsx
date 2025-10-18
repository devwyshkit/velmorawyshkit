/**
 * Admin Dashboard Layout
 * Mobile-first container (reuses customer/partner pattern)
 */

import { Outlet } from 'react-router-dom';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        
        <main className="flex-1 pb-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

