export const RouteMap = {
  home: () => `/`,
  search: (query?: string) => (query ? `/search?${query}` : `/search`),
  store: (id: string) => `/store/${id}`,
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


