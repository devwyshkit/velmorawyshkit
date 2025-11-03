import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";

export const AddAddress = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    house: '',
    area: '',
    landmark: '',
    pincode: '',
    city: 'Bangalore',
    saveAs: 'home',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save address logic
    // Swiggy 2025: Silent operation - navigation confirms success
    navigate(-1);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader title="Add Delivery Address" showBackButton />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="Enter full name"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
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
          
          <div>
            <Label htmlFor="landmark">Landmark (Optional)</Label>
            <Input
              id="landmark"
              placeholder="E.g. Near metro station"
              value={formData.landmark}
              onChange={(e) => handleChange('landmark', e.target.value)}
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
              value={formData.saveAs} 
              onValueChange={(value) => handleChange('saveAs', value)}
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="home" id="home" />
                <Label htmlFor="home" className="cursor-pointer">🏠 Home</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="work" id="work" />
                <Label htmlFor="work" className="cursor-pointer">💼 Work</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="cursor-pointer">📍 Other</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button type="submit" className="w-full" size="lg">
            Save Address
          </Button>
        </form>
      </main>
    </div>
  );
};

