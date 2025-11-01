import { Instagram, Twitter, Facebook, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { RouteMap } from "@/routes";

export const HomeFooter = () => {
  return (
    <footer className="hidden md:block bg-background border-t border-border py-12 px-4">
      <div className="max-w-screen-xl mx-auto">
        {/* Main Footer Content - 5 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div>
              {/* Wyshkit Logo */}
              <img
                src="/wyshkit-customer-logo.png"
                alt="Wyshkit"
                className="h-8 w-auto mb-3"
              />
              <p className="text-sm text-muted-foreground">
                Thoughtful gifts, delivered with care
              </p>
            </div>
            
            {/* Startup India Badge */}
            <div className="mt-6 space-y-2">
              <img 
                src="/footer-logo.png" 
                alt="Recognised by Startup India" 
                className="h-12 w-auto"
              />
              <p className="text-xs text-muted-foreground">
                Recognised by Startup India
              </p>
            </div>
          </div>

          {/* About Us */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">About Us</h3>
            <div className="space-y-3">
              <a href="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                About Wyshkit
              </a>
              <a href="/careers" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Careers
              </a>
              <a href="/blog" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Blog
              </a>
              <a href="/press" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Press Kit
              </a>
              <a href="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </a>
            </div>
          </div>

          {/* For Customers */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">For Customers</h3>
            <div className="space-y-3">
              <a href="/how-it-works" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                How It Works
              </a>
              <Link to={RouteMap.orders()} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Track Order
              </Link>
              <Link to={RouteMap.help()} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Help & FAQs
              </Link>
              <a href="/refund" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Returns & Refunds
              </a>
              <a href="/gift-cards" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Gift Cards
              </a>
            </div>
          </div>

          {/* For Partners */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">For Partners</h3>
            <div className="space-y-3">
              <a href="/partner/signup" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Sell on Wyshkit
              </a>
              <a href="/partner/login" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Partner Portal
              </a>
              <a href="/partner/support" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Partner Support
              </a>
              <a href="/become-courier" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Become a Courier
              </a>
            </div>
          </div>

          {/* Top Cities */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Top Cities</h3>
            <div className="space-y-3">
              <a href="/cities/delhi" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Delhi NCR
              </a>
              <a href="/cities/mumbai" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Mumbai
              </a>
              <a href="/cities/bangalore" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Bangalore
              </a>
              <a href="/cities/hyderabad" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Hyderabad
              </a>
              <a href="/cities/pune" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Pune
              </a>
              <a href="/cities/chennai" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Chennai
              </a>
              <a href="/cities/kolkata" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Kolkata
              </a>
              <a href="/cities/ahmedabad" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Ahmedabad
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Row: Copyright + Social + Legal */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © 2025 Velmora Labs Private Limited. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a 
              href="https://instagram.com/wyshkit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a 
              href="https://twitter.com/wyshkit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a 
              href="https://facebook.com/wyshkit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a 
              href="https://linkedin.com/company/wyshkit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4">
            <a href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Terms
            </a>
            <span className="text-xs text-muted-foreground">•</span>
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </a>
            <span className="text-xs text-muted-foreground">•</span>
            <a href="/refund" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Refund Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

