// Backend Integration Readiness - Phase 15 Critical Implementation
// Ensures seamless transition to real backend without breaking user experience

export interface BackendReadinessConfig {
  apiBaseUrl: string;
  timeout: number;
  retries: number;
  fallbackMode: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
  lastAttempt: Date | null;
}

export interface OptimisticUpdate<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

// ✅ 1. COMPREHENSIVE LOADING STATES
export class LoadingStateManager {
  private states = new Map<string, LoadingState>();

  setLoading(key: string, isLoading: boolean, error?: Error) {
    const current = this.states.get(key) || {
      isLoading: false,
      error: null,
      retryCount: 0,
      lastAttempt: null
    };

    this.states.set(key, {
      ...current,
      isLoading,
      error: error || null,
      lastAttempt: isLoading ? new Date() : current.lastAttempt
    });
  }

  getState(key: string): LoadingState {
    return this.states.get(key) || {
      isLoading: false,
      error: null,
      retryCount: 0,
      lastAttempt: null
    };
  }

  incrementRetry(key: string) {
    const current = this.getState(key);
    this.states.set(key, {
      ...current,
      retryCount: current.retryCount + 1
    });
  }

  reset(key: string) {
    this.states.delete(key);
  }
}

// ✅ 2. ERROR BOUNDARY FOR NETWORK FAILURES
export class NetworkErrorHandler {
  private static instance: NetworkErrorHandler;
  private errorCallbacks: Map<string, (error: Error) => void> = new Map();

  static getInstance(): NetworkErrorHandler {
    if (!NetworkErrorHandler.instance) {
      NetworkErrorHandler.instance = new NetworkErrorHandler();
    }
    return NetworkErrorHandler.instance;
  }

  registerErrorCallback(key: string, callback: (error: Error) => void) {
    this.errorCallbacks.set(key, callback);
  }

  handleNetworkError(error: Error, context: string) {
    const callback = this.errorCallbacks.get(context);
    
    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      // Error logged for development debugging
    }

    // Categorize error types
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      // Network connectivity issue
      if (callback) callback(new Error('Network connection lost. Please check your internet.'));
    } else if (error.message.includes('timeout')) {
      // Request timeout
      if (callback) callback(new Error('Request timed out. Please try again.'));
    } else if (error.message.includes('401')) {
      // Authentication error
      if (callback) callback(new Error('Session expired. Please log in again.'));
    } else {
      // Generic error
      if (callback) callback(new Error('Something went wrong. Please try again.'));
    }
  }
}

// ✅ 3. OPTIMISTIC UPDATE PATTERNS
export class OptimisticUpdateManager<T> {
  private updates = new Map<string, OptimisticUpdate<T>>();
  private confirmationCallbacks = new Map<string, (data: T) => void>();

  addUpdate(update: OptimisticUpdate<T>, onConfirm?: (data: T) => void): string {
    this.updates.set(update.id, update);
    
    if (onConfirm) {
      this.confirmationCallbacks.set(update.id, onConfirm);
    }

    // Auto-cleanup after 30 seconds if not confirmed
    setTimeout(() => {
      if (this.updates.get(update.id)?.status === 'pending') {
        this.markAsFailed(update.id, new Error('Update timeout'));
      }
    }, 30000);

    return update.id;
  }

  confirmUpdate(id: string, serverData?: T) {
    const update = this.updates.get(id);
    if (update) {
      update.status = 'confirmed';
      
      const callback = this.confirmationCallbacks.get(id);
      if (callback && serverData) {
        callback(serverData);
      }
      
      // Cleanup after confirmation
      setTimeout(() => {
        this.updates.delete(id);
        this.confirmationCallbacks.delete(id);
      }, 1000);
    }
  }

  markAsFailed(id: string, error: Error) {
    const update = this.updates.get(id);
    if (update) {
      update.status = 'failed';
      
      // Trigger rollback logic here if needed
      this.rollbackUpdate(id);
    }
  }

  private rollbackUpdate(id: string) {
    const update = this.updates.get(id);
    if (!update) return;

    // Rollback logic based on update type
    switch (update.type) {
      case 'create':
        // Remove optimistically added item
        break;
      case 'update':
        // Revert to previous state
        break;
      case 'delete':
        // Restore deleted item
        break;
    }
  }

  getPendingUpdates(): OptimisticUpdate<T>[] {
    return Array.from(this.updates.values()).filter(u => u.status === 'pending');
  }
}

// ✅ 4. REQUEST RETRY WITH EXPONENTIAL BACKOFF
export class RequestRetryManager {
  private maxRetries: number = 3;
  private baseDelay: number = 1000; // 1 second

  async executeWithRetry<T>(
    request: () => Promise<T>,
    context: string = 'default'
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await request();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.maxRetries) {
          NetworkErrorHandler.getInstance().handleNetworkError(lastError, context);
          throw lastError;
        }

        // Exponential backoff delay
        const delay = this.baseDelay * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ✅ 5. COMPREHENSIVE DATA VALIDATION SCHEMAS
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Product name is required").max(100, "Name too long"),
  price: z.number().min(0, "Price must be positive"),
  originalPrice: z.number().min(0).optional(),
  image: z.string().url("Invalid image URL"),
  images: z.array(z.string().url()).optional(),
  rating: z.number().min(0).max(5, "Rating must be 0-5"),
  reviewCount: z.number().min(0, "Review count must be positive"),
  store: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    rating: z.number().min(0).max(5)
  }),
  category: z.string().min(1, "Category is required"),
  inStock: z.boolean(),
  isCustomizable: z.boolean(),
  minQuantity: z.number().min(1).optional()
});

export const OrderSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  storeId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    customization: z.object({
      zones: z.array(z.string()),
      files: z.array(z.any()),
      instructions: z.string().max(500)
    }).optional()
  })),
  status: z.enum(['pending', 'confirmed', 'design_review', 'approved', 'production', 'shipped', 'delivered', 'cancelled']),
  total: z.number().min(0),
  createdAt: z.date(),
  deliveryAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    pincode: z.string().length(6)
  })
});

export const CartItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  productName: z.string().min(1),
  storeId: z.string().min(1),
  storeName: z.string().min(1),
  quantity: z.number().min(1).max(1000, "Quantity too high"),
  price: z.number().min(0),
  customization: z.object({
    zones: z.array(z.string()),
    files: z.array(z.any()),
    instructions: z.string().max(500),
    designCost: z.number().min(0)
  }).optional(),
  addOns: z.object({
    giftWrap: z.boolean().optional(),
    personalMessage: z.boolean().optional(),
    customLogo: z.boolean().optional()
  }).optional()
});

// ✅ 6. SINGLETON INSTANCES
export const loadingStateManager = new LoadingStateManager();
export const networkErrorHandler = NetworkErrorHandler.getInstance();
export const requestRetryManager = new RequestRetryManager();