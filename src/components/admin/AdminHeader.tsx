/**
 * Admin Header
 * Mobile-first (reuses customer UI pattern)
 */

import { Shield, Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export const AdminHeader = () => {
  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <Link to="/admin/overview" className="flex items-center gap-2">
            <img 
              src="/wyshkit-logo.png" 
              alt="Wyshkit" 
              className="h-8 w-auto"
            />
            <Badge variant="destructive" className="hidden md:flex text-xs gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

