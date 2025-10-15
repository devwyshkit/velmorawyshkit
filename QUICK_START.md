# 🚀 Wyshkit Customer Mobile UI - Quick Start

## ⚡ Instant Access (No Setup Required)

The customer mobile UI is **ALREADY RUNNING** with mock data!

### Open in Browser:
```
http://localhost:8080/customer/mobile/home
```

Or use these direct links:
- **Home**: http://localhost:8080/customer/mobile/home
- **Login**: http://localhost:8080/customer/mobile/login
- **Search**: http://localhost:8080/customer/mobile/search

## 🎮 Try These Flows (Mock Data)

### 1. Browse as Guest
1. Open home page
2. Click any partner card
3. Click an item → Bottom sheet opens
4. Click "Add to Basket" → Login prompt appears
5. Click "Continue as Guest"

### 2. Search
1. Click search icon in header
2. See trending searches
3. Type anything → Results appear

### 3. Dark Mode
1. Go to Profile (bottom nav)
2. Toggle "Dark Mode" switch
3. Navigate around - all pages adapt

### 4. Mobile Responsive
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone SE" (320px)
4. Navigate - no horizontal scroll!

## 🔧 Setup Real Data (Optional)

### Step 1: Environment Variables
Create `.env` file in project root:

```env
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Razorpay
VITE_RAZORPAY_KEY=rzp_test_xxxxx

# Google Places
VITE_GOOGLE_PLACES_API_KEY=your-api-key

# OpenAI (Optional)
VITE_OPENAI_API_KEY=sk-xxxxx
```

### Step 2: Get API Keys

**Supabase** (5 min):
1. Go to https://supabase.com
2. Create project
3. Copy URL + Key from Settings → API

**Razorpay** (5 min):
1. Go to https://razorpay.com
2. Sign up
3. Get test key from Dashboard

**Google Places** (5 min):
1. Google Cloud Console
2. Enable Places API
3. Create API key

### Step 3: Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev
# Server restarts with new env vars
```

## 📱 Key Features to Test

### ✅ Bottom Sheets (Not Modals!)
- Click any item → Sheet slides up from bottom
- Swipe down to close
- All interactions use sheets (Zomato pattern)

### ✅ Guest Mode
- Browse without login
- Add to basket
- See login prompt at checkout

### ✅ Compliance
- Check any total → Shows GST 18%
- Item details → Accordion has HSN 9985
- Scroll to bottom → Velmora Labs footer

### ✅ Mobile Navigation
- Bottom nav always visible
- 4 items: Home, Search, Orders, Profile
- Active state highlights current page

## 🎨 Design Highlights

- **Primary Color**: #CD1C18 (Wyshkit Red)
- **Font**: Inter (16px body)
- **Spacing**: 8px base (tight like Zomato)
- **Icons**: Lucide React
- **Badges**: 🏆 Bestseller, 🔥 Trending

## 📂 Where is Everything?

```
src/pages/customer/mobile/     → All pages
src/components/customer/        → Shared components
src/lib/integrations/           → API integrations
```

## 🚨 Troubleshooting

### Page not loading?
- Check dev server is running on port 8080
- Clear browser cache (Ctrl+Shift+R)

### Bottom sheets not working?
- Make sure you're on `/customer/mobile/*` routes
- Old customer routes use different UI

### Dark mode not working?
- Check `next-themes` is installed: `npm list next-themes`
- Should show version ^0.3.0

## 📚 Full Documentation

- **IMPLEMENTATION_SUMMARY.md** - What was built
- **CUSTOMER_MOBILE_UI_README.md** - Complete guide
- **CUSTOMER_UI_ROUTES.md** - All routes + testing

## ✨ What's Different from Old Customer UI?

### Old (`/` routes):
- Desktop-first
- Traditional navigation
- Standard modals

### New (`/customer/mobile` routes):
- Mobile-first (320px base)
- Bottom navigation
- **Bottom sheets** (Zomato pattern)
- Guest mode
- Tighter spacing
- Modern Material 3 design

## 🎯 Next Actions

1. **Test with mock data** (works now!)
2. **Add API keys** (optional, for real auth/payments)
3. **Replace mock data** with Supabase queries
4. **Deploy** to production

---

**Currently Running:**  
✅ Dev server on http://localhost:8080  
✅ Customer mobile UI accessible  
✅ All features working with mock data

**Ready for:**  
⏳ Real Supabase integration  
⏳ Razorpay payments  
⏳ Google Places autocomplete  
⏳ Production deployment

