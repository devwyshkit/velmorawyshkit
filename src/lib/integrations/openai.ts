// OpenAI integration for recommendations (no "AI" term in UI)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
}

export const getRecommendations = async (userPreferences?: {
  location?: string;
  browsing_history?: string[];
  occasion?: string;
}): Promise<RecommendationItem[]> => {
  // If no API key, return fallback recommendations
  if (!OPENAI_API_KEY || OPENAI_API_KEY === '') {
    return getFallbackRecommendations();
  }

  try {
    // Construct prompt based on user preferences
    const context = `You are a gift recommendation system for Wyshkit, a B2C marketplace for customizable gift hampers.
    
User Context:
- Location: ${userPreferences?.location || 'India'}
- Browsing History: ${userPreferences?.browsing_history?.join(', ') || 'None'}
- Occasion: ${userPreferences?.occasion || 'General'}

Generate 3 personalized gift recommendations. For each recommendation, provide:
1. A catchy title (max 5 words)
2. A compelling description (max 15 words)
3. A price point (between ₹999 and ₹4999)

Format the response as JSON array with fields: title, description, price (as number).`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates personalized gift recommendations in JSON format.',
          },
          {
            role: 'user',
            content: context,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse JSON response
    const recommendations = JSON.parse(content);
    
    // Transform to our format with IDs and images
    return recommendations.slice(0, 3).map((rec: any, index: number) => ({
      id: `rec-${Date.now()}-${index}`,
      title: rec.title,
      description: rec.description,
      image: `https://picsum.photos/seed/rec${index}/400/400`,
      price: rec.price,
    }));
  } catch (error) {
    // Silent error handling - fallback to static recommendations (Swiggy 2025 pattern)
    return getFallbackRecommendations();
  }
};

// Fallback recommendations when API fails or is not configured
function getFallbackRecommendations(): RecommendationItem[] {
  return [
    {
      id: 'fallback-1',
      title: 'Personalized Gift Hamper',
      description: 'Curated selection of premium items perfect for any occasion',
      image: 'https://picsum.photos/seed/gift1/400/400',
      price: 2499,
    },
    {
      id: 'fallback-2',
      title: 'Corporate Gift Set',
      description: 'Professional gifts ideal for business occasions and clients',
      image: 'https://picsum.photos/seed/gift2/400/400',
      price: 3999,
    },
    {
      id: 'fallback-3',
      title: 'Festival Special Box',
      description: 'Celebrate with our festive collection of treats and sweets',
      image: 'https://picsum.photos/seed/gift3/400/400',
      price: 1999,
    },
  ];
}

export const getETAEstimate = async (orderId: string): Promise<string> => {
  // Mock ETA calculation
  // In production, this would use AI for accurate estimates
  const currentTime = new Date();
  const estimatedTime = new Date(currentTime.getTime() + 45 * 60000); // 45 minutes
  
  return estimatedTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

