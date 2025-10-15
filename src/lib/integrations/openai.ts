// OpenAI integration for recommendations (no "AI" term in UI)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export const getRecommendations = async (userPreferences?: any): Promise<any[]> => {
  // Mock recommendations for now
  // In production, this would call OpenAI API
  return [
    {
      id: '1',
      title: 'Personalized Gift Hamper',
      description: 'Curated selection of premium items',
      image: '/placeholder.svg',
      price: 2499,
    },
    {
      id: '2',
      title: 'Corporate Gift Set',
      description: 'Professional gifts for business occasions',
      image: '/placeholder.svg',
      price: 3999,
    },
    {
      id: '3',
      title: 'Festival Special Box',
      description: 'Celebrate with our festive collection',
      image: '/placeholder.svg',
      price: 1999,
    },
  ];
};

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

