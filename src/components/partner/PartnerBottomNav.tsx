/**
 * Partner Bottom Navigation
 * Mobile-first (reuses customer UI pattern with different routes/icons)
 * Same design system: colors, spacing, typography
 */

import { Home, Package, ShoppingCart, DollarSign, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const PartnerBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { to: '/partner/dashboard', icon: Home, label: 'Home' },
    { to: '/partner/catalog', icon: Package, label: 'Catalog' },
    { to: '/partner/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/partner/earnings', icon: DollarSign, label: 'Earnings' },
    { to: '/partner/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || (to !== '/partner/dashboard' && location.pathname.startsWith(to));

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

