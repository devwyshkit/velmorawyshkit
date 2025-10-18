/**
 * Partner Sidebar Navigation
 * Desktop-only navigation (Swiggy pattern)
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Package, ShoppingCart, DollarSign, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const PartnerSidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Only render on desktop
  if (isMobile) return null;

  const navItems = [
    { to: '/partner/dashboard', icon: Home, label: 'Home' },
    { to: '/partner/catalog', icon: Package, label: 'Catalog' },
    { to: '/partner/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/partner/earnings', icon: DollarSign, label: 'Earnings' },
    { to: '/partner/profile', icon: User, label: 'Account' },
  ];

  return (
    <aside className="w-64 border-r bg-card min-h-screen">
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

