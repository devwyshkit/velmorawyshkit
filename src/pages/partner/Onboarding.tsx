import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Step1Business } from "./onboarding/Step1Business";
import { Step2KYC } from "./onboarding/Step2KYC";
import { Step3Banking } from "./onboarding/Step3Banking";
import { Step4Review } from "./onboarding/Step4Review";

interface OnboardingData {
  // Step 1: Business
  business_name?: string;
  category?: string;
  business_type?: string;
  address?: any;
  phone?: string;
  website?: string;
  
  // Step 2: KYC
  pan_number?: string;
  pan_document_url?: string;
  gst_number?: string;
  fssai_number?: string;
  fssai_document_url?: string;
  
  // Step 3: Banking
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_account_name?: string;
}

const STEPS = [
  { id: 1, name: "Business Details", description: "Tell us about your business" },
  { id: 2, name: "KYC Documents", description: "Verify your identity" },
  { id: 3, name: "Banking", description: "Setup payout account" },
  { id: 4, name: "Review & Submit", description: "Submit for approval" },
];

/**
 * Partner Onboarding Flow (4 Steps)
 * IDFC First Bank style with conditional FSSAI
 * Follows Swiggy/Zomato partner onboarding pattern
 */
export const PartnerOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = (stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (finalData: Partial<OnboardingData>) => {
    const completeData = { ...onboardingData, ...finalData };
    
    // Save to database and navigate to pending state
    navigate("/partner/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Swiggy 2025 Pattern: Minimal, mobile-first */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Partner Onboarding</h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/partner/login")}>
              Save & Exit
            </Button>
          </div>
          
          {/* Progress Bar */}
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      {/* Steps Indicator - Mobile-first */}
      <div className="max-w-7xl mx-auto w-full p-4">
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                    currentStep > step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center hidden md:block">
                  <p className="text-xs font-medium">{step.name}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content - Full-page mobile-first, no Card wrapper (Swiggy 2025 pattern) */}
        <div className="max-w-3xl mx-auto">
            {currentStep === 1 && (
              <Step1Business
                initialData={onboardingData}
                onNext={handleNext}
              />
            )}
            {currentStep === 2 && (
              <Step2KYC
                initialData={onboardingData}
                category={onboardingData.category}  // Pass category for conditional FSSAI
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <Step3Banking
                initialData={onboardingData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 4 && (
              <Step4Review
                data={onboardingData}
                onSubmit={handleSubmit}
                onBack={handleBack}
              />
            )}
        </div>
      </div>
    </div>
  );
};

