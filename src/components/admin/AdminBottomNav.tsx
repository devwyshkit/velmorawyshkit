/**
 * Admin Bottom Navigation
 * Mobile-only navigation (Swiggy pattern)
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, ShoppingBag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const AdminBottomNav = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Only render on mobile
  if (!isMobile) return null;

  const navItems = [
    { to: '/admin/overview', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/partners', icon: Users, label: 'Partners' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

