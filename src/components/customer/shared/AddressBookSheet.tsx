import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Circle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { getAddresses, updateAddress, deleteAddress, type Address } from "@/lib/mock-addresses";
import { AddAddressSheet } from "./AddAddressSheet";

interface AddressBookSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect?: (address: Address) => void;
}

// Helper to load addresses synchronously (Swiggy 2025 pattern)
const loadAddressesSync = (): Address[] => {
  try {
    return getAddresses();
  } catch (error) {
    return [];
  }
};

export const AddressBookSheet = ({ isOpen, onClose, onAddressSelect }: AddressBookSheetProps) => {
  const { user } = useAuth();
  // Swiggy 2025: Initialize addresses synchronously to prevent empty flash
  const [addresses, setAddresses] = useState<Address[]>(() => loadAddressesSync());
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Refresh addresses when sheet opens (Swiggy 2025 pattern)
  useEffect(() => {
    if (isOpen) {
      // Reload addresses synchronously
      const mockAddresses = getAddresses();
      setAddresses(mockAddresses);
    }
  }, [isOpen]);

  const handleSetDefault = async (id: string) => {
    if (!user) return;

    try {
      // Update all addresses to not default first
      const currentAddresses = getAddresses();
      currentAddresses.forEach(addr => {
        if (addr.isDefault) {
          updateAddress(addr.id, { isDefault: false });
        }
      });

      // Set selected address as default
      updateAddress(id, { isDefault: true });

      // Update local state
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      })));
    } catch (error) {
      // Silent error handling (Swiggy 2025 pattern)
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      deleteAddress(id);
      // Update local state
      setAddresses(addresses.filter(addr => addr.id !== id));
    } catch (error) {
      // Silent error handling (Swiggy 2025 pattern)
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsAddAddressOpen(true);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddAddressOpen(true);
  };

  const handleAddressAdded = () => {
    setIsAddAddressOpen(false);
    setEditingAddress(null);
    // Reload addresses
    const mockAddresses = getAddresses();
    setAddresses(mockAddresses);
  };

  const handleSelectAddress = (address: Address) => {
    if (onAddressSelect) {
      onAddressSelect(address);
    }
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
        <SheetContent side="bottom" className="max-h-[75vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 flex flex-col overflow-hidden">
          {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
          <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Scrollable Content - Swiggy 2025 Pattern: Snap scrolling */}
          <div className="flex-1 overflow-y-auto snap-y snap-mandatory px-6">
            <SheetHeader className="text-left pb-4">
              <SheetTitle>My Addresses</SheetTitle>
              <SheetDescription>Manage your saved delivery addresses</SheetDescription>
            </SheetHeader>

            <div className="space-y-4">
            <Button 
              className="w-full" 
              onClick={handleAddAddress}
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
                      <button
                        onClick={() => {
                          handleSetDefault(address.id);
                          if (onAddressSelect) {
                            handleSelectAddress(address);
                          }
                        }}
                        className="mt-1"
                      >
                        {address.isDefault ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
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
                        onClick={() => handleEdit(address)}
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
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AddAddressSheet
        isOpen={isAddAddressOpen}
        onClose={() => {
          setIsAddAddressOpen(false);
          setEditingAddress(null);
        }}
        onAddressAdded={handleAddressAdded}
        editingAddress={editingAddress}
      />
    </>
  );
};

