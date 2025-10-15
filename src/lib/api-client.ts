// Production API Client with retry logic and error handling
interface APIClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data?: any): Promise<T>;
  put<T>(url: string, data?: any): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

class WyshkitAPIClient implements APIClient {
  private baseURL: string;
  private maxRetries: number = 3;
  private timeout: number = 15000;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  }

  private async request<T>(
    url: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Client-Version': '1.0.0',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status >= 500 && retryCount < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return this.request<T>(url, options, retryCount + 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      if (retryCount < this.maxRetries && error instanceof Error && 
          (error.message.includes('network') || error.message.includes('timeout'))) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.request<T>(url, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

// API Service Layer
export const apiClient = new WyshkitAPIClient();

// API Endpoints
export const api = {
  // Products
  products: {
    search: (query: string, filters?: any) => 
      apiClient.get(`/products/search?q=${encodeURIComponent(query)}&${new URLSearchParams(filters)}`),
    getById: (id: string) => apiClient.get(`/products/${id}`),
    getByVendor: (vendorId: string, page = 1) => 
      apiClient.get(`/vendors/${vendorId}/products?page=${page}`)
  },

  // Orders
  orders: {
    create: (orderData: any) => apiClient.post('/orders', orderData),
    getById: (id: string) => apiClient.get(`/orders/${id}`),
    getUserOrders: (userId: string) => apiClient.get(`/users/${userId}/orders`),
    updateStatus: (id: string, status: string) => 
      apiClient.put(`/orders/${id}/status`, { status })
  },

  // Cart
  cart: {
    get: () => apiClient.get('/cart'),
    add: (item: any) => apiClient.post('/cart/items', item),
    update: (itemId: string, updates: any) => 
      apiClient.put(`/cart/items/${itemId}`, updates),
    remove: (itemId: string) => apiClient.delete(`/cart/items/${itemId}`),
    clear: () => apiClient.delete('/cart')
  },

  // Users
  users: {
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (data: any) => apiClient.put('/users/profile', data),
    addAddress: (address: any) => apiClient.post('/users/addresses', address),
    updateAddress: (id: string, address: any) => 
      apiClient.put(`/users/addresses/${id}`, address)
  }
};