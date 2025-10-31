import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Plus, Edit2, Trash2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";

interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  house: string;
  area: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export const AddressBook = () => {
  const navigate = useNavigate();

  // Mock addresses
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Home',
      name: 'Amit Kumar',
      phone: '+91 98765 43210',
      house: '#45, 2nd Floor',
      area: 'HSR Layout',
      city: 'Bangalore',
      pincode: '560102',
      isDefault: true,
    },
    {
      id: '2',
      label: 'Work',
      name: 'Amit Kumar',
      phone: '+91 98765 43210',
      house: 'Prestige Tech Park',
      area: 'Koramangala',
      city: 'Bangalore',
      pincode: '560034',
      isDefault: false,
    },
  ]);

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader title="My Addresses" showBackButton />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
        <Button 
          className="w-full" 
          onClick={() => navigate(RouteMap.addAddress())}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
        
        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
            <p className="text-sm text-muted-foreground">
              Add your first delivery address to get started
            </p>
          </div>
        ) : (
          addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Radio 
                    className="mt-1" 
                    checked={address.isDefault}
                    onClick={() => handleSetDefault(address.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{address.label}</span>
                      {address.isDefault && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="ml-8 space-y-1">
                  <p className="font-medium text-sm">{address.name} • {address.phone}</p>
                  <p className="text-sm text-muted-foreground">
                    {address.house}, {address.area}
                    <br />
                    {address.city} - {address.pincode}
                  </p>
                </div>
                
                <div className="flex gap-2 mt-3 ml-8">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {/* TODO: Edit logic */}}
                    className="flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(address.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                  {!address.isDefault && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      Set Default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
      
      <ComplianceFooter />
      <CustomerBottomNav />
    </div>
  );
};

