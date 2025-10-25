const CACHE_NAME = 'wyshkit-v1';
const CART_CACHE_NAME = 'wyshkit-cart-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== CART_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - enhanced caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle cart data caching for offline functionality
  if (url.pathname.includes('/api/cart') || url.pathname.includes('/customer/cart')) {
    event.respondWith(handleCartRequest(request));
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (request.destination === 'image' || request.destination === 'script' || request.destination === 'style') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default: network-first for other requests
  event.respondWith(handleDefaultRequest(request));
});

// Cart-specific caching for offline functionality
async function handleCartRequest(request) {
  const cache = await caches.open(CART_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for cart
    return new Response(JSON.stringify({
      items: [],
      total: 0,
      offline: true,
      message: 'You are offline. Cart data will sync when connection is restored.'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response(JSON.stringify({
      error: 'Network unavailable',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Default request handling
async function handleDefaultRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Background sync for cart data
self.addEventListener('sync', (event) => {
  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCartData());
  }
});

async function syncCartData() {
  // Sync cart data when connection is restored
  try {
    const cache = await caches.open(CART_CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/cart')) {
        try {
          await fetch(request);
          // Remove from cache after successful sync
          await cache.delete(request);
        } catch (error) {
          console.log('Failed to sync cart data:', error);
        }
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}