import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { addAddress, updateAddress, type Address } from "@/lib/mock-addresses";
import { logger } from "@/lib/logger";

interface AddressInput {
  label: string;
  name: string;
  phone: string;
  house: string;
  area: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

interface AddAddressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressAdded: () => void;
  editingAddress?: Address | null;
}

export const AddAddressSheet = ({ isOpen, onClose, onAddressAdded, editingAddress }: AddAddressSheetProps) => {
  const [formData, setFormData] = useState({
    label: editingAddress?.label || 'Home',
    name: editingAddress?.name || '',
    phone: editingAddress?.phone || '',
    house: editingAddress?.house || '',
    area: editingAddress?.area || '',
    city: editingAddress?.city || 'Bangalore',
    pincode: editingAddress?.pincode || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAddress) {
        // Update existing address
        updateAddress(editingAddress.id, {
          label: formData.label,
          name: formData.name,
          phone: formData.phone,
          house: formData.house,
          area: formData.area,
          city: formData.city,
          pincode: formData.pincode,
        });
      } else {
        // Add new address
        addAddress({
          label: formData.label,
          name: formData.name,
          phone: formData.phone,
          house: formData.house,
          area: formData.area,
          city: formData.city,
          state: 'Karnataka', // Default state
          pincode: formData.pincode,
          isDefault: false,
        });
      }
      
      // Swiggy 2025: Silent operation - sheet close confirms success
      onAddressAdded();
    } catch (error) {
      // Silent error handling (Swiggy 2025 pattern)
      logger.error('Failed to save address', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 flex flex-col overflow-hidden">
        {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
        <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Scrollable Content - Swiggy 2025 Pattern: Snap scrolling */}
        <div className="flex-1 overflow-y-auto snap-y snap-mandatory px-6">

        <SheetHeader className="text-left pb-4">
          <SheetTitle>{editingAddress ? 'Edit Address' : 'Add Delivery Address'}</SheetTitle>
          <SheetDescription>
            {editingAddress ? 'Update your delivery address details' : 'Add a new delivery address'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="house">House/Flat/Building *</Label>
            <Input
              id="house"
              placeholder="Enter house/flat number"
              value={formData.house}
              onChange={(e) => handleChange('house', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="area">Area/Street/Sector *</Label>
            <Input
              id="area"
              placeholder="Enter area"
              value={formData.area}
              onChange={(e) => handleChange('area', e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                type="number"
                placeholder="560001"
                value={formData.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                disabled
              />
            </div>
          </div>
          
          <div>
            <Label>Save As</Label>
            <RadioGroup 
              value={formData.label} 
              onValueChange={(value) => handleChange('label', value)}
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="Home" id="home" />
                <Label htmlFor="home" className="cursor-pointer">🏠 Home</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="Work" id="work" />
                <Label htmlFor="work" className="cursor-pointer">💼 Work</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="Other" id="other" />
                <Label htmlFor="other" className="cursor-pointer">📍 Other</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button type="submit" className="w-full" size="lg">
            {editingAddress ? 'Update Address' : 'Save Address'}
          </Button>
        </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

