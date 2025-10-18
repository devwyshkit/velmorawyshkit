/**
 * Partner Onboarding Flow
 * IDFC-style 4-step progressive disclosure
 * Mobile-first design (consistent with customer UI)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingStepper } from '@/components/partner/OnboardingStepper';
import { Step1Business } from './onboarding/Step1Business';
import { Step2KYC } from './onboarding/Step2KYC';
import { Step3Banking } from './onboarding/Step3Banking';
import { Step4Catalog } from './onboarding/Step4Catalog';
import { fetchPartnerProfile } from '@/lib/integrations/supabase-data';
import { supabase } from '@/lib/integrations/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const profile = await fetchPartnerProfile(user.id);
        
        if (profile) {
          setPartnerId(profile.id);
          
          // Check if already approved - redirect to dashboard
          if (profile.onboarding_status === 'approved') {
            navigate('/partner/dashboard');
            return;
          }
          
          // Resume from last step
          setCurrentStep(profile.onboarding_step || 1);
        }
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
        toast({
          title: 'Error loading progress',
          description: 'Please try refreshing the page',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [navigate, toast]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = () => {
    // Redirect to pending approval page
    navigate('/partner/pending');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header (mobile-first) */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-primary">Partner Onboarding</h1>
        </div>
      </header>

      {/* Stepper */}
      <div className="max-w-2xl mx-auto px-4">
        <OnboardingStepper currentStep={currentStep} totalSteps={4} />
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto px-4 pb-24">
        {currentStep === 1 && (
          <Step1Business 
            onNext={handleNext} 
            partnerId={partnerId}
          />
        )}
        
        {currentStep === 2 && (
          <Step2KYC 
            onNext={handleNext} 
            onBack={handleBack}
            partnerId={partnerId!}
          />
        )}
        
        {currentStep === 3 && (
          <Step3Banking 
            onNext={handleNext} 
            onBack={handleBack}
            partnerId={partnerId!}
          />
        )}
        
        {currentStep === 4 && (
          <Step4Catalog 
            onComplete={handleComplete} 
            onBack={handleBack}
            partnerId={partnerId!}
          />
        )}
      </div>
    </div>
  );
};

