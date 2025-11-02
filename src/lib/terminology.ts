/**
 * Terminology Constants
 * 
 * Centralized terminology management for Wyshkit.
 * Provides consistent naming across frontend display (UK English) and backend/API (US English).
 * 
 * Display terms use UK English for user-facing text (Indian market standard).
 * API terms use US English for code consistency (global standard).
 */

// ============================================================================
// DISPLAY TERMS (User-Facing, UK English)
// ============================================================================

export const DISPLAY_TERMS = {
  // Features
  STORE: "Store",
  FAVOURITES: "Favourites",
  SAVED: "Saved", // Legacy
  ACCOUNT: "Account",
  ORDERS: "Orders",
  HELP: "Help",
  
  // Customization (UK spelling for display)
  CUSTOMISATION: "Customisation",
  PERSONALISATION: "Personalisation",
  COLOUR: "Colour",
  
  // Actions (UK spelling for verbs)
  FAVOURITE_ACTION: "Favourite",
  ADD_TO_FAVOURITES: "Add to favourites",
  REMOVE_FROM_FAVOURITES: "Remove from favourites",
  
  // Badges & Labels
  GIFT_WRAP: "Gift wrap",
  OFTEN_BOUGHT: "Often bought with",
  SAME_DAY: "Same day",
  READY_IN_24H: "Ready in 24h",
  
  // Status
  ORDER_PLACED: "Order placed",
  OUT_FOR_DELIVERY: "Out for delivery",
  
  // Other
  YOUR_ORDER: "Your order",
  COUPON: "Coupon",
} as const;

// ============================================================================
// API TERMS (Code/Backend, US English)
// ============================================================================

export const API_TERMS = {
  // Entities
  STORE: "store",
  STORE_ID: "store_id",
  STORES: "stores",
  
  FAVORITES: "favorites",
  FAVORITE_ID: "favorite_id",
  SAVED_ITEMS: "saved_items", // Legacy
  SAVED_ITEM_ID: "saved_item_id", // Legacy
  
  CART_ITEMS: "cart_items",
  CART_ITEM_ID: "cart_item_id",
  
  ORDERS: "orders",
  ORDER_ID: "order_id",
  
  // Customization (US spelling in code)
  CUSTOMIZATION: "customization",
  IS_CUSTOMIZABLE: "is_customizable",
  PERSONALIZATION: "personalization",
  PERSONALIZATIONS: "personalizations",
  COLOR: "color",
  COLOR_VARIANTS: "color_variants",
  
  // Other
  ACCOUNT: "account",
  HELP: "help",
} as const;

// ============================================================================
// ROUTE TERMS
// ============================================================================

export const ROUTES = {
  HOME: "/",
  FAVORITES: "/favorites",
  SAVED: "/saved", // Legacy
  CART: "/cart",
  ACCOUNT: "/account",
  ORDERS: "/orders",
  HELP: "/help",
  SEARCH: "/search",
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DisplayTerm = typeof DISPLAY_TERMS[keyof typeof DISPLAY_TERMS];
export type ApiTerm = typeof API_TERMS[keyof typeof API_TERMS];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get display term for feature name
 */
export const getDisplayTerm = (key: keyof typeof DISPLAY_TERMS): string => {
  return DISPLAY_TERMS[key];
};

/**
 * Get API term for database/backend operations
 */
export const getApiTerm = (key: keyof typeof API_TERMS): string => {
  return API_TERMS[key];
};

/**
 * Format UK spelling for display
 */
export const ukSpelling = (word: string): string => {
  const ukMap: Record<string, string> = {
    "Customization": "Customisation",
    "Customizable": "Customisable",
    "Personalization": "Personalisation",
    "Color": "Colour",
    "Favorited": "Favourited",
  };
  return ukMap[word] || word;
};

/**
 * Format US spelling for code
 */
export const usSpelling = (word: string): string => {
  const usMap: Record<string, string> = {
    "Customisation": "Customization",
    "Customisable": "Customizable",
    "Personalisation": "Personalization",
    "Colour": "Color",
    "Favourited": "Favorited",
  };
  return usMap[word] || word;
};

