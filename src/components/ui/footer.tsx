import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Instagram, Twitter, Facebook, Linkedin, Shield, Award, Truck, CreditCard, Users, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
interface FooterProps {
  className?: string;
}
export const Footer: React.FC<FooterProps> = ({
  className
}) => {
  return <footer className={cn("bg-card border-t", className)}>
      {/* Trust & Security Strip */}
      

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/wyshkit-customer-logo.png" alt="Wyshkit" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              India's largest gifting marketplace connecting customers with local vendors for personalized gifts and custom products.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <a href="https://instagram.com/wyshkit" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="https://twitter.com/wyshkit" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="https://facebook.com/wyshkit" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="https://linkedin.com/company/wyshkit" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <nav className="space-y-3">
              <Link to="/search?category=birthday" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Birthday Gifts
              </Link>
              <Link to="/search?category=corporate" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Corporate Gifts
              </Link>
              <Link to="/search?category=custom" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Custom Products
              </Link>
              <Link to="/bulk-orders" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Bulk Orders
              </Link>
              <Link to="/saved" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Wishlist
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Support</h3>
            <nav className="space-y-3">
              <Link to="/help" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Help Center
              </Link>
              <Link to="/track" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Track Order
              </Link>
              <Link to="/returns" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Returns & Refunds
              </Link>
              <Link to="/size-guide" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Size Guide
              </Link>
              <a href="mailto:support@wyshkit.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                support@wyshkit.com
              </a>
              <a href="tel:+918012345678" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                +91 80 1234 5678
              </a>
            </nav>
          </div>

          {/* Business */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Business</h3>
            <nav className="space-y-3">
              <Link to="/seller" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                Become a Vendor
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link to="/seller/dashboard" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Seller Central
              </Link>
              <Link to="/partnerships" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Partnerships
              </Link>
              <Link to="/api" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Developer API
              </Link>
              <Link to="/press" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Press & Media
              </Link>
            </nav>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Trust & Payment Strip - Simplified */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                SSL Secured
              </Badge>
              <Badge variant="outline">UPI • Cards • GPay</Badge>
              <Badge variant="outline">Free Returns</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Made in India
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <Separator className="my-6" />

        {/* Legal & Copyright - Simplified */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 Wyshkit Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/refund" className="hover:text-primary transition-colors">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>;
};