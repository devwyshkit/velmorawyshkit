export const RouteMap = {
  home: () => `/`,
  catalog: (storeId: string) => `/catalog/${storeId}`,
  search: (query?: string) => (query ? `/search?${query}` : `/search`),
  login: () => `/login`,
  signup: () => `/signup`,
  favorites: () => `/favorites`,
  track: (orderId: string) => `/order/${orderId}/track`,
  preview: (orderId: string) => `/order/${orderId}/preview`,
  orders: () => `/orders`,
  addresses: () => `/account/addresses`,
  addAddress: () => `/account/addresses/add`,
  help: () => `/help`,
  profile: () => `/profile`,
  partnerRoot: () => `/partner`,
  adminRoot: () => `/admin`,
} as const;


