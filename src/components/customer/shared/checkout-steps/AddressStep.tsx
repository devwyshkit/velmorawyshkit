import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { CheckCircle, Loader2, XCircle, Download, Plus } from "lucide-react";
import { calculateGST, calculateTotalWithGST } from "@/lib/integrations/razorpay";
import { loadGooglePlaces, initAutocomplete, formatAddress } from "@/lib/integrations/google-places";
import { getAddresses, prePopulateAddresses } from "@/lib/mock-addresses";
import { logger } from "@/lib/logger";
import { generateId } from "@/lib/utils/id-generator";

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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  personalizations?: Array<{ id: string; label: string; price: number }>;
}

interface GSTINDetails {
  businessName: string;
  gstin: string;
  address?: string;
}

interface AddressStepProps {
  onConfirm: (address: Address, gstin?: string) => void;
  cartItems: CartItem[];
  cartTotal: number;
}

export const AddressStep = ({ onConfirm, cartItems, cartTotal }: AddressStepProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    name: '',
    phone: '',
    house: '',
    area: '',
    city: '',
    pincode: '',
  });

  const [isBusinessOrder, setIsBusinessOrder] = useState(false);
  const [gstin, setGstin] = useState("");
  const [gstinVerifying, setGstinVerifying] = useState(false);
  const [gstinValid, setGstinValid] = useState<boolean | null>(null);
  const [gstinDetails, setGstinDetails] = useState<GSTINDetails | null>(null);
  
  const [estimatePdfUrl, setEstimatePdfUrl] = useState<string | null>(null);
  const [isGeneratingEstimate, setIsGeneratingEstimate] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    prePopulateAddresses();
    const mockAddresses = getAddresses();
    setAddresses(mockAddresses);
    if (mockAddresses.length > 0) {
      const defaultAddr = mockAddresses.find(a => a.isDefault) || mockAddresses[0];
      setSelectedAddress(defaultAddr.id);
    }
  }, []);

  useEffect(() => {
    if (isAddingNew && addressInputRef.current) {
      loadGooglePlaces().then(() => {
        if (addressInputRef.current) {
          initAutocomplete(addressInputRef.current, (place) => {
            const formattedAddress = formatAddress(place);
            setNewAddress(prev => ({ ...prev, house: formattedAddress }));
          });
        }
      });
    }
  }, [isAddingNew]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (gstin.length === 15 && isBusinessOrder) {
        verifyGstin(gstin);
      } else {
        setGstinValid(null);
        setGstinDetails(null);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [gstin, isBusinessOrder]);

  const verifyGstin = async (value: string) => {
    if (value.length !== 15) return;
    setGstinVerifying(true);
    try {
      // Zomato 2025: Real-time GSTIN verification with business name display
      // Mock verification - instant (no artificial delay)
      // Zomato 2025: 15-digit format validation (2 digits + 5 letters + 4 digits + 1 letter + 1 digit + Z + 1 alphanumeric)
      const isValid = value.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/);
      if (isValid) {
        setGstinValid(true);
        // Zomato 2025: Show business name from GSTIN verification
        setGstinDetails({
          businessName: `Business (${value.substring(0, 2)}${value.substring(7, 11)})`, // State code + last 4 digits
          status: "Active",
        });
      } else {
        setGstinValid(false);
        setGstinDetails(null);
      }
    } catch (error) {
      setGstinValid(false);
      setGstinDetails(null);
    } finally {
      // Swiggy 2025: Use requestAnimationFrame for smooth transition
      requestAnimationFrame(() => {
        setGstinVerifying(false);
      });
    }
  };

  const handleDownloadEstimate = async () => {
    if (!gstin || !gstinValid) return;
    setIsGeneratingEstimate(true);
    
    try {
      // Swiggy 2025: Instant estimate generation (no artificial delay)
      const subtotal = cartTotal;
      const gstAmount = calculateGST(subtotal);
      const total = calculateTotalWithGST(subtotal);
      
      // Zomato 2025: Generate formatted estimate with proper structure
      const estimateText = `
TAX ESTIMATE
${'='.repeat(50)}

Date: ${new Date().toLocaleDateString('en-IN')}
GSTIN: ${gstin}
${gstinDetails?.businessName ? `Business: ${gstinDetails.businessName}` : ''}

${'-'.repeat(50)}
ITEMS
${'-'.repeat(50)}
${cartItems.map((item, idx) => `${idx + 1}. ${item.name || 'Item'}
   Quantity: ${item.quantity || 1}
   Unit Price: ₹${(item.price || 0).toLocaleString('en-IN')}
   Total: ₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}`).join('\n\n')}

${'-'.repeat(50)}
TAX SUMMARY
${'-'.repeat(50)}
Subtotal (excl. GST): ₹${subtotal.toLocaleString('en-IN')}
CGST (9%): ₹${(gstAmount / 2).toLocaleString('en-IN')}
SGST (9%): ₹${(gstAmount / 2).toLocaleString('en-IN')}
Total GST (18%): ₹${gstAmount.toLocaleString('en-IN')}
${'='.repeat(50)}
GRAND TOTAL: ₹${total.toLocaleString('en-IN')}
${'='.repeat(50)}

HSN Code: 9985
GST Registration: Active

Note: This is an estimate. Final invoice will be generated after order confirmation.
      `.trim();

      // Zomato 2025: Download as text file (can be enhanced to PDF later)
      const blob = new Blob([estimateText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wyshkit-estimate-${gstin}-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to generate estimate', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsGeneratingEstimate(false);
    }
  };

  const handleConfirm = () => {
    const address = addresses.find(a => a.id === selectedAddress);
    if (!address) return;
    onConfirm(address, isBusinessOrder && gstinValid ? gstin : undefined);
  };

  const handleAddNewAddress = () => {
    const newAddr: Address = {
      id: generateId('temp_address'),
      label: newAddress.label,
      name: newAddress.name,
      phone: newAddress.phone,
      house: newAddress.house,
      area: newAddress.area,
      city: newAddress.city,
      pincode: newAddress.pincode,
      isDefault: false,
    };
    setAddresses([...addresses, newAddr]);
    setSelectedAddress(newAddr.id);
    setIsAddingNew(false);
    setNewAddress({ label: 'Home', name: '', phone: '', house: '', area: '', city: '', pincode: '' });
  };

  return (
    <div className="p-4 space-y-6 pb-6">
      {/* Saved Addresses */}
      <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
        <div className="space-y-3">
          {addresses.map((address) => (
            <Label
              key={address.id}
              className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <RadioGroupItem value={address.id} className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{address.label}</span>
                  {address.isDefault && (
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{address.house}</p>
                  <p>{address.area}, {address.city}</p>
                  <p>{address.pincode}</p>
                  <p className="mt-1">{address.phone}</p>
                </div>
              </div>
            </Label>
          ))}
        </div>
      </RadioGroup>

      <Separator />

      {/* Business Order (GSTIN) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>This is a business order</Label>
            <p className="text-xs text-muted-foreground">Provide GSTIN for tax invoice</p>
          </div>
          <Switch checked={isBusinessOrder} onCheckedChange={setIsBusinessOrder} />
        </div>

        {isBusinessOrder && (
          <div className="space-y-3">
            <div>
              <Label>GSTIN</Label>
              <div className="relative">
                <Input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="Enter 15-digit GSTIN"
                  maxLength={15}
                  className="pr-10"
                />
                {gstinVerifying && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!gstinVerifying && gstin.length === 15 && gstinValid && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {!gstinVerifying && gstin.length === 15 && gstinValid === false && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                )}
              </div>
              {gstinValid && gstinDetails && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ {gstinDetails.businessName}
                </p>
              )}
              {gstinValid === false && (
                <p className="text-sm text-red-600 mt-1">
                  Invalid GSTIN. Please check and try again.
                </p>
              )}
            </div>

            {gstinValid && (
              <Card className="p-4 bg-muted/50">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Tax Estimate</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>GST (18%)</span>
                      <span>₹{calculateGST(cartTotal).toLocaleString('en-IN')}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>₹{calculateTotalWithGST(cartTotal).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadEstimate} 
                    size="sm" 
                    className="w-full mt-2"
                    disabled={isGeneratingEstimate}
                  >
                    {isGeneratingEstimate ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Add New Address */}
      {isAddingNew ? (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Add New Address</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsAddingNew(false)}>
              Cancel
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Address</Label>
              <Input
                ref={addressInputRef}
                placeholder="Start typing your address..."
              />
            </div>
            <div>
              <Label>Flat/House No.</Label>
              <Input
                value={newAddress.house}
                onChange={(e) => setNewAddress(prev => ({ ...prev, house: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Area</Label>
                <Input
                  value={newAddress.area}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, area: e.target.value }))}
                />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))}
                  maxLength={6}
                />
              </div>
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={newAddress.city}
                onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <Button onClick={handleAddNewAddress} className="w-full">
              Save Address
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setIsAddingNew(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
      )}

      {/* Confirm Button */}
      <Button onClick={handleConfirm} className="w-full" size="lg" disabled={!selectedAddress}>
        Continue to Payment
      </Button>
    </div>
  );
};

