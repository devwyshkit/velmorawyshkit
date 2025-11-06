export const RouteMap = {
  home: () => `/`,
  catalog: (storeId: string) => `/catalog/${storeId}`,
  search: (query?: string) => (query ? `/search?${query}` : `/search`),
  login: () => `/login`,
  signup: () => `/signup`,
  favorites: () => `/favorites`,
  track: (orderId: string) => `/order/${orderId}/track`,
  // preview route removed - now inline bottom sheet in Track page (Swiggy 2025 pattern)
  orders: () => `/orders`,
  orderDetails: (orderId: string) => `/order/${orderId}`,
  orderCancellation: (orderId: string) => `/order/${orderId}/cancel`,
  returnRequest: (orderId: string) => `/order/${orderId}/return`,
  addresses: () => `/account/addresses`,
  addAddress: () => `/account/addresses/add`,
  help: () => `/help`,
  profile: () => `/profile`,
  paymentMethods: () => `/account/payment-methods`,
  settings: () => `/account/settings`,
  supportChat: () => `/support/chat`,
  myReviews: () => `/account/reviews`,
  partnerRoot: () => `/partner`,
  adminRoot: () => `/admin`,
} as const;


