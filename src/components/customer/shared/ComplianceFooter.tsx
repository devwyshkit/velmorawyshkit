import { Instagram, Twitter, Facebook, Linkedin, Phone, Mail } from "lucide-react";

export const ComplianceFooter = () => {
  return (
    <footer className="w-full bg-muted/30 border-t border-border py-6 px-4 text-xs text-muted-foreground">
      <div className="max-w-screen-xl mx-auto">
        
        {/* Mobile: Compact Single Column */}
        <div className="md:hidden space-y-3">
          <p className="text-center text-foreground font-semibold">
            © 2025 Velmora Labs Private Limited. All rights reserved.
          </p>
          <p className="text-center">
            Operating as <span className="font-medium text-foreground">Wyshkit</span> • CIN: U47730DL2025PTC453280
          </p>
          <p className="text-center">
            Delhi 110092 • PAN: AALCV3232B • TAN: DELV31029F
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <a href="tel:+919740803490" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone className="h-3 w-3" />
              <span>+91 97408 03490</span>
            </a>
            <span>•</span>
            <a href="mailto:support@wyshkit.com" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Mail className="h-3 w-3" />
              <span>Email</span>
            </a>
          </div>
          <div className="flex items-center justify-center gap-3">
            <a 
              href="https://instagram.com/wyshkit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a 
              href="https://twitter.com/wyshkit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a 
              href="https://facebook.com/wyshkit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a 
              href="https://linkedin.com/company/wyshkit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
          <div className="flex justify-center gap-3">
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
            <span>•</span>
            <a href="/refund" className="hover:text-primary transition-colors">Refund</a>
          </div>
        </div>

        {/* Desktop: Multi-Column Detailed */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-sm">Company Information</p>
            <p className="font-medium text-foreground">Velmora Labs Private Limited</p>
            <p>Office No. G-3, Gali No. 2,</p>
            <p>Plot No. 48-49, Common Light,</p>
            <p>East Delhi, Delhi – 110092</p>
            <p className="mt-2">
              Operating as <span className="font-medium text-foreground">Wyshkit</span>
            </p>
            <p>CIN: U47730DL2025PTC453280</p>
          </div>

          {/* Tax Details */}
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-sm">Tax Details</p>
            <p>PAN: AALCV3232B</p>
            <p>TAN: DELV31029F</p>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-sm">Contact</p>
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

          {/* Social Links */}
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-sm">Follow Us</p>
            <div className="flex items-center gap-3">
              <a 
                href="https://instagram.com/wyshkit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="https://twitter.com/wyshkit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="https://facebook.com/wyshkit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="https://linkedin.com/company/wyshkit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Row: Copyright + Links (Desktop Only) */}
        <div className="hidden md:flex items-center justify-between mt-6 pt-6 border-t border-border">
          <p className="text-xs">© 2025 Velmora Labs Private Limited. All rights reserved.</p>
          <div className="flex gap-4 text-xs">
            <a href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="/refund" className="hover:text-primary transition-colors">
              Refund Policy
            </a>
            <a href="/contact" className="hover:text-primary transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
