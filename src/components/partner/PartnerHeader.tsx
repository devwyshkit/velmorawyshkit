/**
 * Partner Header
 * Mobile-first (reuses customer UI pattern)
 * Same color system: #CD1C18 (Wyshkit Red)
 */

import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface PartnerHeaderProps {
  title?: string;
}

export const PartnerHeader = ({ title = 'Partner Dashboard' }: PartnerHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <Link to="/partner/dashboard" className="flex items-center gap-2">
            <img 
              src="/wyshkit-business-logo.png" 
              alt="Wyshkit" 
              className="h-8 w-auto"
            />
            <Badge variant="outline" className="hidden md:flex text-xs">Partner</Badge>
          </Link>
        </div>

        {/* Right: Notifications */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

