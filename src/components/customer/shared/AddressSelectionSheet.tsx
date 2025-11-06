import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { CheckCircle, Loader2, XCircle, Download, MapPin, Plus } from "lucide-react";
import { calculateGST, calculateTotalWithGST } from "@/lib/integrations/razorpay";
import { loadGooglePlaces, initAutocomplete, formatAddress } from "@/lib/integrations/google-places";
// Phase 1 Cleanup: Removed Supabase imports - pure mock mode
import { getAddresses, prePopulateAddresses } from "@/lib/mock-addresses";

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

interface AddressSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressConfirm: (address: Address, gstin?: string) => void;
  cartItems: any[];
  cartTotal: number;
}

export const AddressSelectionSheet = ({ 
  isOpen, 
  onClose, 
  onAddressConfirm, 
  cartItems, 
  cartTotal 
}: AddressSelectionSheetProps) => {
  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    name: '',
    phone: '',
    house: '',
    area: '',
    city: '',
    pincode: '',
  });

  // Business order (GSTIN) state
  const [isBusinessOrder, setIsBusinessOrder] = useState(false);
  const [gstin, setGstin] = useState("");
  const [gstinVerifying, setGstinVerifying] = useState(false);
  const [gstinValid, setGstinValid] = useState<boolean | null>(null);
  const [gstinDetails, setGstinDetails] = useState<any>(null);
  
  // Estimate PDF state
  const [estimatePdfUrl, setEstimatePdfUrl] = useState<string | null>(null);
  const [isGeneratingEstimate, setIsGeneratingEstimate] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);

  // Load addresses on mount
  useEffect(() => {
    const loadAddresses = async () => {
      // Phase 1 Cleanup: Always use mock addresses - no conditionals
      prePopulateAddresses();
      const mockAddresses = getAddresses();
      setAddresses(mockAddresses);
      if (mockAddresses.length > 0) {
        const defaultAddr = mockAddresses.find(a => a.isDefault) || mockAddresses[0];
        setSelectedAddress(defaultAddr.id);
      }
    };

    if (isOpen) {
      loadAddresses();
    }
  }, [isOpen]);

  // Setup Google Places when adding new address
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

  // GSTIN verification
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (gstin.length === 15 && isBusinessOrder) {
        verifyGstin(gstin);
      } else {
        setGstinValid(null);
        setGstinDetails(null);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [gstin, isBusinessOrder]);

  const verifyGstin = async (value: string) => {
    if (value.length !== 15) return;

    setGstinVerifying(true);
    try {
      // Call Edge Function with caching
      const { data, error } = await supabase.functions.invoke('verify-gstin', {
        body: { gstin: value }
      });

      if (error) throw error;

      // Parse response from Edge Function
      if (data.verified) {
        setGstinValid(true);
        setGstinDetails({
          businessName: data.business_name,
          status: data.status,
          address: data.address,
          cached: data.cached
        });
      } else {
        setGstinValid(false);
        setGstinDetails(null);
      }
    } catch (error: any) {
      // Silent error handling - invalid GSTIN (Swiggy 2025 pattern)
      setGstinValid(false);
      setGstinDetails(null);
    } finally {
      setGstinVerifying(false);
    }
  };

  const handleDownloadEstimate = async () => {
    if (!gstin || !gstinValid) return;

    setIsGeneratingEstimate(true);
    
    try {
      // Create a temporary order ID for estimate generation (will be replaced with actual order ID after payment)
      const tempOrderId = `temp_${Date.now()}`;
      
      // Call Edge Function to generate PDF estimate via Refrens
      const { data, error } = await supabase.functions.invoke('generate-estimate', {
        body: {
          orderId: tempOrderId,
          cartItems: cartItems.map(item => ({
            name: item.name || 'Item',
            price: item.price || 0,
            quantity: item.quantity || 1
          })),
          gstin: gstin,
          customerInfo: {
            name: addresses.find(a => a.id === selectedAddress)?.name || 'Customer',
            email: '', // Will be filled from user profile
          }
        }
      });

      if (error) throw error;

      // Download the PDF
      if (data.pdf_url) {
        const a = document.createElement('a');
        a.href = data.pdf_url;
        a.download = `wyshkit-estimate-${gstin}.pdf`;
        a.target = '_blank';
        a.click();
      } else {
        throw new Error('No PDF URL returned');
      }
    } catch (error: any) {
      // Silent error handling - estimate unavailable (Swiggy 2025 pattern)
      // Fallback to manual calculation if Edge Function fails
      const subtotal = cartTotal;
      const gstAmount = calculateGST(subtotal);
      const total = calculateTotalWithGST(subtotal);
      
      const estimateText = `
WYSHKIT - Tax Estimate
GSTIN: ${gstin}
${'-'.repeat(40)}
Items:
${cartItems.map(item => `${item.name || 'Item'} x${item.quantity || 1}: ₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}`).join('\n')}
${'-'.repeat(40)}
Subtotal: ₹${subtotal.toLocaleString('en-IN')}
GST (18%): ₹${gstAmount.toLocaleString('en-IN')}
${'-'.repeat(40)}
Total: ₹${total.toLocaleString('en-IN')}

HSN Code: 9985
      `;

      const blob = new Blob([estimateText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wyshkit-estimate.txt';
      a.click();
    } finally {
      setIsGeneratingEstimate(false);
    }
  };

  const handleConfirm = () => {
    const address = addresses.find(a => a.id === selectedAddress);
    if (!address) return;

    // Set transitioning flag to prevent sheet from calling onClose
    setIsTransitioning(true);
    
    // Call onAddressConfirm which transitions to payment step (Swiggy 2025 pattern)
    // CheckoutCoordinator will close this sheet and open payment sheet
    onAddressConfirm(address, isBusinessOrder && gstinValid ? gstin : undefined);
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

  const defaultAddress = addresses.find(a => a.isDefault);

  return (
    <Sheet 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only close if not transitioning to next step (Swiggy 2025 pattern)
        if (!open && !isTransitioning) {
          onClose();
        }
      }} 
      modal={false}
    >
      <SheetContent 
        side="bottom" 
        className="max-h-[75vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 flex flex-col overflow-hidden"
      >
        {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
        <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Scrollable Content - Swiggy 2025 Pattern: Snap scrolling */}
        <div className="flex-1 overflow-y-auto snap-y snap-mandatory px-6">
          <SheetHeader className="sr-only">
            <SheetTitle>Select Delivery Address</SheetTitle>
            <SheetDescription>Choose your delivery address and payment method</SheetDescription>
          </SheetHeader>

        <div className="p-4 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Select Delivery Address</h2>
          </div>

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

                {/* Inline Estimate Preview (Zomato 2025 pattern) */}
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
            Deliver Here
          </Button>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

