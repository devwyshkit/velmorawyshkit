import { Instagram, Twitter, Facebook, Linkedin, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Enhanced Footer - Swiggy/Zomato Pattern
 * Comprehensive footer with 30+ links organized in clear sections
 * Mobile: Stacked columns
 * Desktop: 5-6 column grid
 */
export const EnhancedFooter = () => {
  return (
    <footer className="w-full bg-muted/30 border-t border-border mt-12">
      <div className="max-w-screen-xl mx-auto px-4 py-8 md:py-12">
        
        {/* Desktop: Multi-Column Layout (Swiggy/Zomato Pattern) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          
          {/* Column 1: Company */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm mb-3">Company</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About Wyshkit
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/press" className="hover:text-primary transition-colors">
                  Press Kit
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: For Partners */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm mb-3">For Partners</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/partner/signup" className="hover:text-primary transition-colors">
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link to="/partner/login" className="hover:text-primary transition-colors">
                  Partner Portal
                </Link>
              </li>
              <li>
                <Link to="/partner-success-stories" className="hover:text-primary transition-colors">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link to="/partner-resources" className="hover:text-primary transition-colors">
                  Partner Resources
                </Link>
              </li>
              <li>
                <Link to="/partner-faq" className="hover:text-primary transition-colors">
                  Partner FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Customers */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm mb-3">For Customers</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/corporate" className="hover:text-primary transition-colors">
                  Corporate Gifting
                </Link>
              </li>
              <li>
                <Link to="/bulk-orders" className="hover:text-primary transition-colors">
                  Bulk Orders
                </Link>
              </li>
              <li>
                <Link to="/gift-ideas" className="hover:text-primary transition-colors">
                  Gift Ideas by Occasion
                </Link>
              </li>
              <li>
                <Link to="/customer/track" className="hover:text-primary transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/customer-faq" className="hover:text-primary transition-colors">
                  Customer FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-primary transition-colors opacity-60">
                  Admin
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-primary transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Support & Contact */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm mb-3">Support</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/help" className="hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/return-refund" className="hover:text-primary transition-colors">
                  Return & Refund
                </Link>
              </li>
              <li>
                <Link to="/report-issue" className="hover:text-primary transition-colors">
                  Report an Issue
                </Link>
              </li>
            </ul>
            
            {/* Contact Info */}
            <div className="space-y-2 pt-3 border-t border-border/50">
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <a href="tel:+919740803490" className="hover:text-primary transition-colors">
                  +91 97408 03490
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <a href="mailto:support@wyshkit.com" className="hover:text-primary transition-colors">
                  support@wyshkit.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Social Media Links (Desktop) */}
        <div className="hidden md:flex items-center justify-center gap-6 py-6 border-t border-border">
          <a 
            href="https://instagram.com/wyshkit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a 
            href="https://facebook.com/wyshkit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="h-5 w-5" />
          </a>
          <a 
            href="https://twitter.com/wyshkit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="h-5 w-5" />
          </a>
          <a 
            href="https://linkedin.com/company/wyshkit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
          </a>
        </div>

        {/* Payment Methods (Like Swiggy/Zomato) */}
        <div className="hidden md:flex items-center justify-center gap-4 py-4 border-t border-border">
          <span className="text-xs text-muted-foreground">We accept:</span>
          <div className="flex items-center gap-3">
            <div className="text-xs px-2 py-1 bg-background border border-border rounded">
              UPI
            </div>
            <div className="text-xs px-2 py-1 bg-background border border-border rounded">
              Cards
            </div>
            <div className="text-xs px-2 py-1 bg-background border border-border rounded">
              Net Banking
            </div>
            <div className="text-xs px-2 py-1 bg-background border border-border rounded">
              Wallets
            </div>
          </div>
        </div>

        {/* Copyright & Compliance (Bottom) */}
        <div className="pt-6 border-t border-border space-y-3">
          <p className="text-xs text-center text-muted-foreground">
            © 2025 Velmora Labs Private Limited. All rights reserved.
          </p>
          <p className="text-xs text-center text-muted-foreground">
            Operating as <span className="font-medium text-foreground">Wyshkit</span> • 
            CIN: U47730DL2025PTC453280 • 
            PAN: AALCV3232B • 
            Delhi 110092
          </p>
        </div>

        {/* Mobile: Social Media */}
        <div className="md:hidden flex items-center justify-center gap-4 pt-6 border-t border-border mt-6">
          <a 
            href="https://instagram.com/wyshkit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="h-6 w-6" />
          </a>
          <a 
            href="https://facebook.com/wyshkit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="h-6 w-6" />
          </a>
          <a 
            href="https://twitter.com/wyshkit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="h-6 w-6" />
          </a>
          <a 
            href="https://linkedin.com/company/wyshkit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-6 w-6" />
          </a>
        </div>

        {/* Mobile: Quick Links */}
        <div className="md:hidden flex justify-center gap-3 text-xs text-muted-foreground pt-4">
          <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <span>•</span>
          <Link to="/refund" className="hover:text-primary transition-colors">Refund</Link>
          <span>•</span>
          <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
};

