import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  category: string;
  location: string;
  gst: string;
  pan: string;
  documents: {
    type: string;
    url: string;
    verified: boolean;
  }[];
  status: VendorStatus;
  kycScore: number;
  revenue: number;
  rating: number;
  createdAt: Date;
  lastContact?: Date;
}

export const useVendorManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const approveVendor = useCallback(async (vendorId: string, approved: boolean, reason?: string) => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    queryClient.setQueryData(['vendors'], (oldVendors: Vendor[] = []) => {
      return oldVendors.map(vendor => {
        if (vendor.id === vendorId) {
          return {
            ...vendor,
            status: approved ? 'approved' : 'rejected' as VendorStatus
          };
        }
        return vendor;
      });
    });
    
    setIsLoading(false);
    return { success: true };
  }, [queryClient]);

  const updateVendorStatus = useCallback(async (vendorId: string, status: VendorStatus) => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    queryClient.setQueryData(['vendors'], (oldVendors: Vendor[] = []) => {
      return oldVendors.map(vendor => {
        if (vendor.id === vendorId) {
          return {
            ...vendor,
            status
          };
        }
        return vendor;
      });
    });
    
    setIsLoading(false);
    return { success: true };
  }, [queryClient]);

  const verifyDocument = useCallback(async (vendorId: string, documentType: string, verified: boolean) => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    queryClient.setQueryData(['vendors'], (oldVendors: Vendor[] = []) => {
      return oldVendors.map(vendor => {
        if (vendor.id === vendorId) {
          return {
            ...vendor,
            documents: vendor.documents.map(doc => 
              doc.type === documentType ? { ...doc, verified } : doc
            )
          };
        }
        return vendor;
      });
    });
    
    setIsLoading(false);
    return { success: true };
  }, [queryClient]);

  return {
    approveVendor,
    updateVendorStatus,
    verifyDocument,
    isLoading
  };
};