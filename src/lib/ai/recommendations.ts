/**
 * OpenAI Recommendations System
 * Smart product suggestions like Amazon/Flipkart
 */

export interface RecommendationRequest {
  userId?: string;
  productId?: string;
  category?: string;
  orderHistory?: Array<{
    productId: string;
    category: string;
    quantity: number;
    timestamp: string;
  }>;
  searchQuery?: string;
  cartItems?: Array<{
    productId: string;
    category: string;
  }>;
}

export interface RecommendationResult {
  recommendations: Array<{
    productId: string;
    productName: string;
    category: string;
    price: number;
    image: string;
    reason: string;
    confidence: number;
  }>;
  frequentlyBoughtTogether?: Array<{
    products: Array<{
      productId: string;
      productName: string;
      price: number;
    }>;
    savings: number;
    bundlePrice: number;
  }>;
  trendingProducts?: Array<{
    productId: string;
    productName: string;
    category: string;
    price: number;
    image: string;
    trendScore: number;
  }>;
}

export class OpenAIRecommendations {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Get product recommendations based on user behavior
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    try {
      const prompt = this.buildRecommendationPrompt(request);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a product recommendation AI for a gifting marketplace. Provide relevant, personalized product suggestions based on user behavior and preferences. Focus on gifting products, hampers, and services.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      return this.parseRecommendationResponse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getFallbackRecommendations(request);
    }
  }

  /**
   * Get frequently bought together suggestions
   */
  async getFrequentlyBoughtTogether(productId: string, category: string): Promise<Array<{
    products: Array<{
      productId: string;
      productName: string;
      price: number;
    }>;
    savings: number;
    bundlePrice: number;
  }>> {
    try {
      const prompt = `Based on the product category "${category}" and product ID "${productId}", suggest 3-5 products that are frequently bought together in gifting scenarios. Include:
      1. Complementary products (e.g., if someone buys electronics, suggest accessories)
      2. Seasonal combinations (e.g., tech + gourmet for corporate gifting)
      3. Price-conscious bundles (e.g., premium + budget items)
      
      Return as JSON array with products, savings amount, and bundle price.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a product bundling AI for a gifting marketplace. Suggest products that are commonly bought together, focusing on value and complementarity.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.6,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error getting frequently bought together:', error);
      return [];
    }
  }

  /**
   * Get trending products based on current season/events
   */
  async getTrendingProducts(category?: string): Promise<Array<{
    productId: string;
    productName: string;
    category: string;
    price: number;
    image: string;
    trendScore: number;
  }>> {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const season = this.getSeason(month);
      
      const prompt = `Based on current season "${season}" and category "${category || 'all'}", suggest 5 trending gifting products. Consider:
      1. Seasonal relevance (e.g., winter items in December)
      2. Popular gifting occasions (birthdays, anniversaries, corporate events)
      3. Current trends in gifting
      4. Price range: ₹500-₹10,000
      
      Return as JSON array with product details and trend score (1-10).`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a trend analysis AI for a gifting marketplace. Identify trending products based on season, occasions, and current market trends.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.8,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error getting trending products:', error);
      return [];
    }
  }

  /**
   * Get personalized search suggestions
   */
  async getSearchSuggestions(query: string, userId?: string): Promise<Array<{
    suggestion: string;
    category: string;
    confidence: number;
  }>> {
    try {
      const prompt = `Based on the search query "${query}", provide 5 relevant search suggestions for a gifting marketplace. Include:
      1. Exact matches
      2. Related categories
      3. Popular gifting terms
      4. Seasonal suggestions
      
      Return as JSON array with suggestion, category, and confidence score.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a search suggestion AI for a gifting marketplace. Provide relevant, helpful search suggestions based on user queries.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.5,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Build recommendation prompt based on request
   */
  private buildRecommendationPrompt(request: RecommendationRequest): string {
    let prompt = 'Based on the following user data, suggest 5 relevant gifting products:\n\n';

    if (request.userId) {
      prompt += `User ID: ${request.userId}\n`;
    }

    if (request.productId) {
      prompt += `Currently viewing product: ${request.productId}\n`;
    }

    if (request.category) {
      prompt += `Category: ${request.category}\n`;
    }

    if (request.searchQuery) {
      prompt += `Search query: ${request.searchQuery}\n`;
    }

    if (request.orderHistory && request.orderHistory.length > 0) {
      prompt += `Order history:\n`;
      request.orderHistory.forEach(order => {
        prompt += `- ${order.productId} (${order.category}) x${order.quantity} on ${order.timestamp}\n`;
      });
    }

    if (request.cartItems && request.cartItems.length > 0) {
      prompt += `Current cart:\n`;
      request.cartItems.forEach(item => {
        prompt += `- ${item.productId} (${item.category})\n`;
      });
    }

    prompt += `\nPlease suggest 5 relevant gifting products with:
    1. Product name and category
    2. Reason for recommendation
    3. Confidence score (1-10)
    4. Price range
    5. Why it's a good fit for this user

    Return as JSON array.`;

    return prompt;
  }

  /**
   * Parse OpenAI response into structured data
   */
  private parseRecommendationResponse(content: string): RecommendationResult {
    try {
      const parsed = JSON.parse(content);
      return {
        recommendations: parsed.recommendations || [],
        frequentlyBoughtTogether: parsed.frequentlyBoughtTogether || [],
        trendingProducts: parsed.trendingProducts || [],
      };
    } catch (error) {
      console.error('Error parsing recommendation response:', error);
      return {
        recommendations: [],
        frequentlyBoughtTogether: [],
        trendingProducts: [],
      };
    }
  }

  /**
   * Get fallback recommendations when AI fails
   */
  private getFallbackRecommendations(request: RecommendationRequest): RecommendationResult {
    const fallbackProducts = [
      {
        productId: 'fallback-1',
        productName: 'Premium Gift Hamper',
        category: 'gourmet',
        price: 2500,
        image: '/api/placeholder/300/300',
        reason: 'Popular choice for all occasions',
        confidence: 7,
      },
      {
        productId: 'fallback-2',
        productName: 'Tech Gift Set',
        category: 'electronics',
        price: 5000,
        image: '/api/placeholder/300/300',
        reason: 'Trending in electronics category',
        confidence: 6,
      },
    ];

    return {
      recommendations: fallbackProducts,
      frequentlyBoughtTogether: [],
      trendingProducts: [],
    };
  }

  /**
   * Get current season based on month
   */
  private getSeason(month: number): string {
    if (month >= 3 && month <= 5) return 'Spring';
    if (month >= 6 && month <= 8) return 'Summer';
    if (month >= 9 && month <= 11) return 'Autumn';
    return 'Winter';
  }
}

/**
 * Initialize OpenAI recommendations with API key
 */
export function initializeOpenAI(): OpenAIRecommendations {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
  return new OpenAIRecommendations(apiKey);
}

/**
 * Get smart recommendations for a user
 */
export async function getSmartRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
  const openai = initializeOpenAI();
  return await openai.getRecommendations(request);
}

/**
 * Get frequently bought together for a product
 */
export async function getFrequentlyBoughtTogether(productId: string, category: string) {
  const openai = initializeOpenAI();
  return await openai.getFrequentlyBoughtTogether(productId, category);
}

/**
 * Get trending products
 */
export async function getTrendingProducts(category?: string) {
  const openai = initializeOpenAI();
  return await openai.getTrendingProducts(category);
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(query: string, userId?: string) {
  const openai = initializeOpenAI();
  return await openai.getSearchSuggestions(query, userId);
}
