export const RouteMap = {
  home: () => `/`,
  search: (query?: string) => (query ? `/search?${query}` : `/search`),
  vendor: (id: string) => `/partners/${id}`,
  partner: (id: string) => `/partners/${id}`, // Alias for vendor
  login: () => `/login`,
  signup: () => `/signup`,
  favorites: () => `/favorites`,
  checkout: () => `/checkout`,
  confirmation: (orderId: string) => `/order/${orderId}/confirmed`,
  track: (orderId: string) => `/order/${orderId}/track`,
  orders: () => `/orders`,
  addresses: () => `/account/addresses`,
  addAddress: () => `/account/addresses/add`,
  help: () => `/help`,
  profile: () => `/profile`,
  partnerRoot: () => `/partner`,
  adminRoot: () => `/admin`,
} as const;


