# Wyshkit Customer Mobile UI - Complete Guide

## Overview

A production-ready, mobile-first customer UI built with React, following Swiggy/Zomato design patterns and world-class standards from Apple, Stripe, and Airbnb.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access customer UI
http://localhost:8080/customer/home
```

**Hard Refresh**: Cmd/Ctrl + Shift + R

---

## Features

### Pages (11 total)
1. **Login** - Supabase auth + Google OAuth + Guest mode
2. **Signup** - Registration with OAuth
3. **Home** - Discovery (carousel, occasions, partners)
4. **Partner** - Browse vendor items
5. **Search** - Live search with trending
6. **Basket Sheet** - Cart review (bottom sheet)
7. **Checkout Sheet** - Payment flow (bottom sheet)
8. **Confirmation** - Order success
9. **Proof Sheet** - Custom item approval (bottom sheet)
10. **Track** - Order tracking with timeline
11. **Profile** - User settings and order history

### Shared Components (5 total)
1. **CustomerMobileHeader** - Responsive header (minimal mobile, full desktop)
2. **CustomerBottomNav** - Mobile-only navigation (5 items)
3. **CustomerItemCard** - Reusable product/partner cards
4. **ComplianceFooter** - Legal details + social links
5. **Stepper** - Quantity selector

---

## Design System

### Colors
```css
Primary: #CD1C18 (Wyshkit Red)
Background: hsl(var(--background))
Muted: hsl(var(--muted))
Foreground: hsl(var(--foreground))
Border: hsl(var(--border))
```

### Spacing Scale
```
gap-1: 4px   (tight: indicators, icons)
gap-2: 8px   (small: buttons, controls)
gap-3: 12px  (medium: header items, social icons)
gap-4: 16px  (default: grids, cards)

space-y-1: 4px   (banner content)
space-y-3: 12px  (sections)
space-y-4: 16px  (main container)

pt-4: 16px   (header spacing)
mt-6: 24px   (footer spacing)
```

### Typography
```
text-xs: 12px    (descriptions, metadata)
text-sm: 14px    (titles, labels, body)
text-base: 16px  (default)
text-lg: 18px    (section headings)
text-xl: 20px    (page titles)
text-2xl: 24px   (hero titles)

Line heights:
1.2 (tight, headlines)
1.4 (normal, titles)
1.5 (comfortable, body)
```

### Component Sizes
```
Header height: h-14 (56px)
Bottom nav: h-16 (64px)
Banner: h-40 (160px) - FIXED SIZE
Icons (header): h-5 w-5 (20px)
Icons (social): h-4 w-4 (16px)
Icons (contact): h-3 w-3 (12px)
Icons (cards): h-4 w-4 (16px)
Buttons (CTA): h-12 (48px)
Buttons (small): h-6 w-6 (24px - carousel arrows)
Occasion cards: w-16 h-16 (64px, round)
```

### Icons
```
Navigation: Home, Search, ShoppingBag, Heart, User (Lucide)
Badges: Trophy (Bestseller), Flame (Trending) (Lucide)
Contact: Phone, Mail (Lucide)
Social: Instagram, Twitter, Facebook, Linkedin (Lucide)
Banner: Gift (Lucide)
```

---

## Responsive Patterns

### Mobile-First Approach
```tsx
// 1. Build for 320px base
<div className="grid grid-cols-2 gap-4">

// 2. Add tablet breakpoint
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">

// 3. Add desktop breakpoint
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```

### Breakpoints
```css
Mobile: 320px - 767px (default)
Tablet: 768px - 1023px (md:)
Desktop: 1024px+ (lg:)
```

### Navigation Pattern
**Mobile (< 768px)**:
- Header: Logo + Location only
- Bottom Nav: Home, Search, Cart, Wishlist, Account
- NO duplication

**Desktop (>= 768px)**:
- Header: Logo + Location + Cart + Wishlist + Account icons
- NO bottom nav
- All features accessible

### Conditional Rendering
```tsx
// Mobile-only
{isMobile && <CustomerBottomNav />}

// Desktop-only
<div className="hidden md:flex">
  <ShoppingBag /> <Heart /> <User />
</div>
```

---

## Component Patterns

### Hero Carousel
```tsx
// Fixed 85% width (non-responsive)
<CarouselItem className="basis-[85%] pl-2">
  <Card className="border-0">
    <CardContent className="p-0">
      <div className="relative h-40"> {/* 160px fixed */}
        {/* Gift icon in white rounded box */}
        <div className="h-10 w-10 bg-white/20 rounded-lg">
          <Gift className="h-6 w-6 text-white" />
        </div>
        {/* Center-aligned content */}
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs">{description}</p>
      </div>
    </CardContent>
  </Card>
</CarouselItem>
```

### Occasion Cards (Swiggy Pattern)
```tsx
// Round cards, horizontal scroll
<button className="flex flex-col items-center gap-2 min-w-[80px]">
  <div className="w-16 h-16 rounded-full overflow-hidden border-2">
    {/* Emoji or icon */}
  </div>
  <span className="text-xs font-medium">{name}</span>
</button>
```

### Badge System
```tsx
// On image (absolute position)
<div className="relative">
  <img ... />
  {badge && (
    <Badge className="absolute top-2 left-2 gap-1 text-xs">
      {badge === 'bestseller' ? (
        <><Trophy className="w-3 h-3" />Bestseller</>
      ) : (
        <><Flame className="w-3 h-3" />Trending</>
      )}
    </Badge>
  )}
</div>
```

---

## API Integrations

### Supabase (Auth + Database)
**File**: `src/lib/integrations/supabase-client.ts`

**Features**:
- Authentication (email/password, OAuth)
- Guest mode (localStorage fallback)
- Session management

**Setup**:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Razorpay (Payments)
**File**: `src/lib/integrations/razorpay.ts`

**Features**:
- UPI, Cards, Wallets
- GST calculation
- Invoice download

**Setup**:
```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

### Google Places (Address Autocomplete)
**File**: `src/lib/integrations/google-places.ts`

**Features**:
- Address autocomplete
- Pincode validation
- Location services

**Setup**:
```env
VITE_GOOGLE_PLACES_API_KEY=your_google_key
```

### OpenAI (AI Features)
**File**: `src/lib/integrations/openai.ts`

**Features**:
- Product recommendations
- Delivery ETA prediction
- Smart search

**Setup**:
```env
VITE_OPENAI_API_KEY=your_openai_key
```

---

## Routing

```tsx
/customer/login          - Login page
/customer/signup         - Signup page
/customer/home           - Home (discovery)
/customer/search         - Search results
/customer/partners/:id   - Partner details
/customer/cart           - Basket sheet
/customer/wishlist       - Wishlist
/customer/checkout       - Checkout sheet
/customer/confirmation   - Order success
/customer/track/:orderId - Order tracking
/customer/profile        - User profile
```

---

## Compliance Footer

### Structure
```
© 2025 Velmora Labs Private Limited. All rights reserved.
Operating as Wyshkit • CIN: U47730DL2025PTC453280

Company Information
Velmora Labs Private Limited
Office No. G-3, Gali No. 2, Plot No. 48-49, Common Light,
East Delhi, Delhi – 110092

Tax Details
PAN: AALCV3232B
TAN: DELV31029F

Contact
Tel: +91 97408 03490
Email: support@wyshkit.com

Follow Us
[Instagram] [Twitter] [Facebook] [LinkedIn]

Links: Terms | Privacy | Refund | Contact
```

### Features
- Clean legal details (no inflation)
- Phone + Email with icons
- Social media links (4 platforms)
- Policy links
- Accessible (aria-labels)

---

## Accessibility (WCAG 2.1)

- ✅ Semantic HTML (header, main, footer, nav)
- ✅ ARIA labels (navigation, carousel, social links)
- ✅ Keyboard navigation (Tab, Enter, Arrow keys)
- ✅ Screen reader support (sr-only text)
- ✅ 48px minimum touch targets (primary actions)
- ✅ Color contrast (4.5:1 minimum)
- ✅ Focus indicators (all interactive elements)
- ✅ External link attributes (target="_blank" rel="noopener noreferrer")

---

## Performance

### Optimizations
- Lazy-loaded routes (React.lazy + Suspense)
- Lazy-loaded images (loading="lazy")
- Auto-play carousel with manual override
- Smooth transitions (300ms duration)
- Conditional rendering (mobile vs desktop)
- PWA-ready (offline support, app-like)

### Lighthouse Scores (Target)
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+
- PWA: 100

---

## Testing Checklist

### Mobile View (375px - iPhone 12/13)
- [ ] Clean header (Logo + Bangalore)
- [ ] 16px gap between header and content
- [ ] Carousel with Gift icon banners
- [ ] Indicators below carousel (left)
- [ ] Small arrows grouped (right)
- [ ] Round occasion cards (horizontal scroll)
- [ ] 2-column vendor grid
- [ ] Badges with icons on images
- [ ] 24px gap before footer
- [ ] Footer: phone + email + social icons
- [ ] Bottom nav (5 items)
- [ ] NO User icon in header

### Desktop View (1920px)
- [ ] Header has Cart/Wishlist/Account icons
- [ ] NO bottom nav
- [ ] Banners same size (85% width)
- [ ] 4-column vendor grid
- [ ] All navigation accessible
- [ ] Footer complete with all details

---

## Deployment

### Build for Production
```bash
npm run build
npm run preview  # Test production build locally
```

### Deploy To
- **Vercel** (Recommended): `vercel deploy`
- **Netlify**: Connect GitHub repo
- **Firebase**: `firebase deploy`

### Environment Variables (Production)
```env
VITE_SUPABASE_URL=production_url
VITE_SUPABASE_ANON_KEY=production_key
VITE_RAZORPAY_KEY_ID=production_key
VITE_GOOGLE_PLACES_API_KEY=production_key
VITE_OPENAI_API_KEY=production_key
```

---

## Troubleshooting

### White Screen
1. Check browser console for errors
2. Verify Supabase credentials (guest mode works without)
3. Hard refresh (Cmd/Ctrl + Shift + R)

### Server Won't Start
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### HMR Not Working
- Restart dev server
- Clear browser cache
- Check for linter errors

---

## Design Principles Applied

### From Swiggy/Zomato
- Minimal mobile header (logo + location)
- Bottom navigation (5 items)
- Round occasion cards
- No hero headline
- Horizontal scroll categories

### From Amazon/Flipkart
- Icon badges (Trophy/Flame)
- Indicators below carousel
- Grouped navigation controls
- Fixed carousel sizing

### From Apple/iOS HIG
- 16px spacing from header
- 48px touch targets
- Smooth animations (300ms)
- Clear visual hierarchy

### From Material Design
- 8dp spacing grid
- Consistent typography
- Semantic color system
- Elevation (shadows)

### From Wyshkit DLS
- space-y-4 main container
- space-y-3 sections
- gap-4 grids
- p-2 cards
- Primary color (#CD1C18)

---

## File Structure

```
src/
├── pages/customer/
│   ├── Login.tsx                 - Authentication
│   ├── Signup.tsx                - Registration
│   ├── CustomerHome.tsx          - Discovery hub
│   ├── Partner.tsx               - Vendor details
│   ├── Search.tsx                - Search results
│   ├── BasketSheet.tsx           - Cart review
│   ├── CheckoutSheet.tsx         - Payment flow
│   ├── Confirmation.tsx          - Order success
│   ├── ProofSheet.tsx            - Proof approval
│   ├── Track.tsx                 - Order tracking
│   └── Profile.tsx               - User settings
├── components/customer/
│   ├── shared/
│   │   ├── CustomerMobileHeader.tsx  - Responsive header
│   │   ├── CustomerBottomNav.tsx     - Mobile navigation
│   │   ├── CustomerItemCard.tsx      - Product cards
│   │   ├── ComplianceFooter.tsx      - Legal footer
│   │   └── Stepper.tsx               - Quantity selector
│   └── ItemSheetContent.tsx      - Item details sheet
└── lib/integrations/
    ├── supabase-client.ts        - Auth + Database
    ├── razorpay.ts               - Payments
    ├── google-places.ts          - Address autocomplete
    └── openai.ts                 - AI features
```

---

## Key Decisions (World-Class Standards)

### Hero Section
**Decision**: NO headline (clean, content-first)  
**Rationale**: Swiggy/Zomato pattern, visual content is self-explanatory

### Spacing
**Decision**: 16px between header and content  
**Rationale**: iOS HIG, Material Design standard for breathing room

### Banner Height
**Decision**: 160px (h-40)  
**Rationale**: Industry standard for mobile hero banners, optimal impact

### Banner Width
**Decision**: Fixed 85% (non-responsive)  
**Rationale**: Consistent experience across all screen sizes

### Navigation
**Decision**: Bottom nav on mobile, header icons on desktop  
**Rationale**: Zero duplication, all features accessible on both

### Badges
**Decision**: Icon badges (Trophy/Flame) on images  
**Rationale**: Amazon/Flipkart pattern, professional appearance

### Footer
**Decision**: Complete legal + social + contact  
**Rationale**: Professional standards, full compliance

---

## Component API

### CustomerMobileHeader
```tsx
<CustomerMobileHeader />
<CustomerMobileHeader 
  showBackButton 
  title="Page Title" 
  onBackClick={() => {}}
/>
```

### CustomerItemCard
```tsx
<CustomerItemCard
  id="1"
  name="Product Name"
  image="/image.jpg"
  price={1499}
  rating={4.5}
  badge="bestseller"
  onClick={() => {}}
/>
```

### Stepper
```tsx
<Stepper
  value={quantity}
  onChange={setQuantity}
  min={1}
  max={100}
/>
```

---

## Common Patterns

### Responsive Grid
```tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
  {items.map(item => <CustomerItemCard key={item.id} {...item} />)}
</div>
```

### Bottom Sheet
```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="bottom" className="h-[90vh]">
    <SheetHeader>
      <SheetTitle>Title</SheetTitle>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

### Horizontal Scroll
```tsx
<div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

---

## Best Practices Applied

### Code Quality
- TypeScript strict mode
- Consistent naming conventions
- Component reusability (DRY)
- Proper imports (@/ alias)

### Performance
- Code splitting (lazy loading)
- Image optimization
- Conditional rendering
- Minimal re-renders

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

### Responsive
- Mobile-first approach
- Progressive enhancement
- Touch-friendly (48px targets)
- No horizontal overflow

---

## Status

**Version**: 1.0.0  
**Status**: Production-Ready  
**Linter Errors**: 0  
**Test Coverage**: Manual QA  
**Deployment**: Ready

---

## Support

**Contact**: support@wyshkit.com  
**Phone**: +91 97408 03490  
**Social**: [@wyshkit](https://instagram.com/wyshkit)

---

**Built with**: React + TypeScript + Tailwind + Shadcn UI + Vite  
**Patterns**: Swiggy, Zomato, Amazon, Flipkart, Apple iOS, Material Design  
**Compliance**: Velmora Labs Private Limited (CIN: U47730DL2025PTC453280)

