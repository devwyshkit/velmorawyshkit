/**
 * Mock catalog: stores and items for demo flow without backend.
 * Keep data minimal and realistic for add-to-cart, addons, and preview flow.
 */

import type { Store, Item } from '@/lib/integrations/supabase-data';

const mockStore: Store = {
	id: 'mock-store-1',
	name: 'Sweet Delights',
	image: 'https://picsum.photos/seed/store-banner/1200/300',
	rating: 4.7,
	delivery: '3-5 days',
	tagline: 'Handcrafted gifts for every occasion',
	location: 'Bangalore',
	category: 'Gourmet & Gifts',
	ratingCount: 324,
	startingPrice: 299
};

const mockItems: Item[] = [
	{
		id: 'mock-item-1',
		name: 'Custom Birthday Cake',
		description: 'Delicious vanilla sponge with buttercream frosting. Perfect for birthdays. Personalize with your message.',
		image: 'https://picsum.photos/seed/item-1/800/800',
		images: [
			'https://picsum.photos/seed/item-1/800/800',
			'https://picsum.photos/seed/item-1b/800/800'
		],
		price: 899,
		rating: 4.8,
		store_id: mockStore.id,
		shortDesc: '2kg vanilla sponge with custom message',
		isCustomizable: true,
		personalizations: [
			{ id: 'gift-wrap', label: 'Gift Wrap', price: 49 },
			{ id: 'msg-card', label: 'Personal Message Card', price: 0, instructions: 'Add your message after checkout' }
		],
		category: 'Cakes',
		ratingCount: 122,
		preparationTime: '24 hours',
		deliveryTime: '2-3 days'
	},
	{
		id: 'mock-item-2',
		name: 'Anniversary Gift Box',
		description: 'Curated hamper with chocolates, scented candle, and a keepsake. Ideal for anniversaries.',
		image: 'https://picsum.photos/seed/item-2/800/800',
		images: [
			'https://picsum.photos/seed/item-2/800/800',
			'https://picsum.photos/seed/item-2b/800/800'
		],
		price: 1499,
		rating: 4.6,
		store_id: mockStore.id,
		shortDesc: 'Premium hamper with chocolates and candle',
		isCustomizable: false,
		personalizations: [
			{ id: 'gift-wrap', label: 'Gift Wrap', price: 49 }
		],
		category: 'Hampers',
		ratingCount: 86,
		preparationTime: 'Same day',
		deliveryTime: '2-4 days'
	},
	{
		id: 'mock-item-3',
		name: 'Custom Wedding Gift',
		description: 'Elegant personalized frame with couple names. Vendor provides preview for approval.',
		image: 'https://picsum.photos/seed/item-3/800/800',
		images: [
			'https://picsum.photos/seed/item-3/800/800',
			'https://picsum.photos/seed/item-3b/800/800'
		],
		price: 2999,
		rating: 4.9,
		store_id: mockStore.id,
		shortDesc: 'Personalized wedding keepsake with preview',
		isCustomizable: true,
		personalizations: [
			{ id: 'engraving', label: 'Custom Engraving', price: 199, instructions: 'Upload names after checkout' }
		],
		category: 'Personalized',
		ratingCount: 58,
		preparationTime: '48 hours',
		deliveryTime: '4-6 days'
	}
];

export const getMockStoreById = (id: string): Store | null => {
	if (id === mockStore.id) return mockStore;
	return null;
};

export const getMockItemsByStore = (storeId: string): Item[] => {
	if (storeId === mockStore.id) return mockItems;
	return [];
};

export const getMockItemById = (id: string): Item | null => {
	return mockItems.find(i => i.id === id) || null;
};

// Mock banners for home page
export const getMockBanners = () => [
	{
		id: 'mock-banner-1',
		title: 'New Year Special',
		subtitle: 'Up to 30% off on all products',
		image_url: 'https://picsum.photos/seed/banner-1/1200/400',
		cta_text: 'Shop Now',
		cta_link: '/search?q=new+year',
		link: '/search?q=new+year',
		store_id: mockStore.id,
		is_active: true,
		position: 1
	},
	{
		id: 'mock-banner-2',
		title: 'Corporate Gifting',
		subtitle: 'Bulk orders get special discounts',
		image_url: 'https://picsum.photos/seed/banner-2/1200/400',
		cta_text: 'Learn More',
		cta_link: `/catalog/${mockStore.id}`,
		link: `/catalog/${mockStore.id}`,
		store_id: mockStore.id,
		is_active: true,
		position: 2
	}
];

// Mock occasions for home page
export const getMockOccasions = () => [
	{ id: 'mock-occ-1', name: 'Birthday', image_url: 'https://picsum.photos/seed/birthday/300/300', icon_emoji: '🎂', slug: 'birthday', is_active: true, position: 1 },
	{ id: 'mock-occ-2', name: 'Anniversary', image_url: 'https://picsum.photos/seed/anniversary/300/300', icon_emoji: '💍', slug: 'anniversary', is_active: true, position: 2 },
	{ id: 'mock-occ-3', name: 'Wedding', image_url: 'https://picsum.photos/seed/wedding/300/300', icon_emoji: '💒', slug: 'wedding', is_active: true, position: 3 },
	{ id: 'mock-occ-4', name: 'Corporate', image_url: 'https://picsum.photos/seed/corporate/300/300', icon_emoji: '💼', slug: 'corporate', is_active: true, position: 4 },
	{ id: 'mock-occ-5', name: 'Festival', image_url: 'https://picsum.photos/seed/festival/300/300', icon_emoji: '🎉', slug: 'festival', is_active: true, position: 5 },
	{ id: 'mock-occ-6', name: 'Thank You', image_url: 'https://picsum.photos/seed/thankyou/300/300', icon_emoji: '🙏', slug: 'thank-you', is_active: true, position: 6 }
];

// Mock stores list for home page
export const getMockStores = (): Store[] => [
	mockStore,
	{
		id: 'mock-store-2',
		name: 'Gourmet Gifts Co',
		image: 'https://picsum.photos/seed/store-2/400/400',
		rating: 4.5,
		delivery: '2-4 days',
		tagline: 'Premium gourmet experiences',
		location: 'Mumbai',
		category: 'Gourmet',
		ratingCount: 189,
		startingPrice: 499,
		badge: 'trending'
	},
	{
		id: 'mock-store-3',
		name: 'Artisan Crafts',
		image: 'https://picsum.photos/seed/store-3/400/400',
		rating: 4.8,
		delivery: '5-7 days',
		tagline: 'Handmade with love',
		location: 'Delhi',
		category: 'Handmade',
		ratingCount: 45,
		startingPrice: 199
	}
];

// Mock offers for home page
export const getMockOffers = () => [
	{
		id: 'mock-offer-1',
		title: 'New Year Special',
		discount_type: 'percentage',
		discount_value: 30,
		description: 'Get 30% off on all products',
		end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
		created_at: new Date().toISOString()
	},
	{
		id: 'mock-offer-2',
		title: 'Free Delivery',
		discount_type: 'fixed',
		discount_value: 50,
		description: 'Free delivery on orders above ₹500',
		end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
		created_at: new Date().toISOString()
	}
];

