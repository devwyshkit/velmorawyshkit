import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Clock } from "lucide-react";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { FloatingCartButton } from "@/components/customer/shared/FloatingCartButton";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ItemSheetContent } from "@/components/customer/ItemSheetContent";

interface Item {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  badge?: 'bestseller' | 'trending';
}

interface PartnerInfo {
  id: string;
  name: string;
  rating: number;
  delivery: string;
  image: string;
}

export const Partner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isItemSheetOpen, setIsItemSheetOpen] = useState(false);

  // Mock data - replace with actual Supabase query
  const partner: PartnerInfo = {
    id: id || '1',
    name: 'Premium Gifts Co',
    rating: 4.5,
    delivery: '30-45 mins',
    image: '/placeholder.svg',
  };

  const items: Item[] = [
    {
      id: '1',
      name: 'Premium Gift Hamper',
      image: '/placeholder.svg',
      price: 2499,
      rating: 4.6,
      badge: 'bestseller',
    },
    {
      id: '2',
      name: 'Artisan Chocolate Box',
      image: '/placeholder.svg',
      price: 1299,
      rating: 4.8,
      badge: 'trending',
    },
    {
      id: '3',
      name: 'Luxury Spa Set',
      image: '/placeholder.svg',
      price: 3499,
      rating: 4.5,
    },
    {
      id: '4',
      name: 'Gourmet Coffee Collection',
      image: '/placeholder.svg',
      price: 1899,
      rating: 4.7,
    },
    {
      id: '5',
      name: 'Personalized Photo Frame',
      image: '/placeholder.svg',
      price: 899,
      rating: 4.4,
    },
    {
      id: '6',
      name: 'Wireless Earbuds',
      image: '/placeholder.svg',
      price: 4999,
      rating: 4.9,
      badge: 'bestseller',
    },
  ];

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsItemSheetOpen(true);
  };

  const handleCloseItemSheet = () => {
    setIsItemSheetOpen(false);
    setSelectedItemId(null);
  };

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader showBackButton title={partner.name} />

        {/* Partner Info */}
        <section className="px-4 py-4 bg-card border-b border-border">
          <div className="flex gap-3">
            <img
              src={partner.image}
              alt={partner.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h2 className="text-base font-semibold mb-1">{partner.name}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {partner.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {partner.delivery}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Items Grid - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
        <main className="space-y-3">
          <h2 className="text-lg font-semibold px-4">Browse Items</h2>
          <div className="grid grid-cols-2 gap-4 px-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <CustomerItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                image={item.image}
                price={item.price}
                rating={item.rating}
                badge={item.badge}
                onClick={() => handleItemClick(item.id)}
              />
            ))}
          </div>
        </main>

        <ComplianceFooter />
        <FloatingCartButton />
        <CustomerBottomNav />
      </div>

      {/* Item Bottom Sheet */}
      <Sheet open={isItemSheetOpen} onOpenChange={setIsItemSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[75vh] rounded-t-xl p-0 overflow-y-auto sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
        >
          {selectedItemId && (
            <ItemSheetContent
              itemId={selectedItemId}
              onClose={handleCloseItemSheet}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

