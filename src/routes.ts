export const RouteMap = {
  home: () => `/`,
  search: (query?: string) => (query ? `/search?${query}` : `/search`),
  vendor: (id: string) => `/partners/${id}`,
  item: (id: string) => `/items/${id}`,
  login: () => `/login`,
  signup: () => `/signup`,
  cart: () => `/cart`,
  wishlist: () => `/wishlist`,
  checkout: () => `/checkout`,
  confirmation: () => `/confirmation`,
  track: (orderId?: string) => (orderId ? `/track/${orderId}` : `/track`),
  profile: () => `/profile`,
  partnerRoot: () => `/partner`,
  adminRoot: () => `/admin`,
} as const;


