/**
 * Admin Sidebar Navigation
 * Desktop-friendly navigation for admin console (Swiggy pattern)
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, ShoppingBag, Settings } from 'lucide-react';

export const AdminSidebar = () => {
  const location = useLocation();

  const navItems = [
    { to: '/admin/overview', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/partners', icon: Users, label: 'Partner Approvals' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  ];

  return (
    <aside className="w-64 border-r bg-card min-h-screen hidden md:block">
      <div className="p-6 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

