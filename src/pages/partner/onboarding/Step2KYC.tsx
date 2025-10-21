import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, ArrowLeft, AlertTriangle, Upload, ExternalLink, CheckCircle2, XCircle, Loader2, Info } from "lucide-react";
import { idfyMock } from "@/lib/api/idfy-mock";
import { useToast } from "@/hooks/use-toast";

// Conditional schema based on category
const createStep2Schema = (requiresFSSAI: boolean) => {
  const base = z.object({
    pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format (e.g., ABCDE1234F)"),
    gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[Z0-9]{1}[A-Z]{1}[0-9]{1}$/, "Invalid GST format"),
  });

  if (requiresFSSAI) {
    return base.extend({
      fssai_number: z.string().regex(/^[0-9]{14}$/, "Invalid FSSAI license (14 digits)"),
    });
  }

  return base;
};

interface Step2KYCProps {
  initialData: any;
  category?: string;
  onNext: (data: any) => void;
  onBack: () => void;
}

/**
 * Onboarding Step 2: KYC Documents
 * CONDITIONAL FSSAI based on category (your brilliant idea!)
 * Swiggy/Zomato pattern: PAN + GST mandatory, FSSAI only for food
 */
export const Step2KYC = ({ initialData, category, onNext, onBack }: Step2KYCProps) => {
  const { toast } = useToast();
  // Determine if FSSAI is required based on category
  const requiresFSSAI = ['food', 'perishables', 'beverages'].includes(category || '');
  
  const schema = createStep2Schema(requiresFSSAI);
  type Step2FormValues = z.infer<typeof schema>;

  const form = useForm<Step2FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pan_number: initialData.pan_number || "",
      gst_number: initialData.gst_number || "",
      ...(requiresFSSAI && { fssai_number: initialData.fssai_number || "" }),
    } as any,
  });

  // IDfy verification states
  const [panVerifying, setPanVerifying] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [panVerificationId, setPanVerificationId] = useState<string | null>(null);
  
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstVerificationId, setGstVerificationId] = useState<string | null>(null);
  
  const [fssaiVerifying, setFssaiVerifying] = useState(false);
  const [fssaiVerified, setFssaiVerified] = useState(false);
  const [fssaiVerificationId, setFssaiVerificationId] = useState<string | null>(null);

  const handleVerifyPAN = async () => {
    const panNumber = form.getValues('pan_number');
    if (!panNumber) {
      toast({
        title: "PAN number required",
        description: "Please enter PAN number to verify",
        variant: "destructive",
      });
      return;
    }

    setPanVerifying(true);
    try {
      const result = await idfyMock.verifyPAN(panNumber, initialData.business_name || '');
      
      if (result.status === 'verified') {
        setPanVerified(true);
        setPanVerificationId(result.verification_id);
        toast({
          title: "PAN verified ✓",
          description: `Verified for ${result.details.registered_name} (₹${result.cost} charged)`,
        });
      } else {
        toast({
          title: "PAN verification failed",
          description: result.error_message || "Please check the PAN number",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPanVerifying(false);
    }
  };

  const handleVerifyGST = async () => {
    const gstNumber = form.getValues('gst_number');
    if (!gstNumber) {
      toast({
        title: "GST number required",
        description: "Please enter GST number to verify",
        variant: "destructive",
      });
      return;
    }

    setGstVerifying(true);
    try {
      const result = await idfyMock.verifyGST(gstNumber);
      
      if (result.status === 'verified' && result.details.status === 'active') {
        setGstVerified(true);
        setGstVerificationId(result.verification_id);
        toast({
          title: "GST verified ✓",
          description: `Verified for ${result.details.business_name} (₹${result.cost} charged)`,
        });
      } else {
        toast({
          title: "GST verification failed",
          description: result.error_message || "Please check the GST number",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGstVerifying(false);
    }
  };

  const handleVerifyFSSAI = async () => {
    const fssaiNumber = (form.getValues() as any).fssai_number;
    if (!fssaiNumber) {
      toast({
        title: "FSSAI license required",
        description: "Please enter FSSAI license number to verify",
        variant: "destructive",
      });
      return;
    }

    setFssaiVerifying(true);
    try {
      const result = await idfyMock.verifyFSSAI(fssaiNumber);
      
      if (result.status === 'verified') {
        setFssaiVerified(true);
        setFssaiVerificationId(result.verification_id);
        toast({
          title: "FSSAI verified ✓",
          description: `Valid until ${new Date(result.details.valid_until).toLocaleDateString('en-IN')} (₹${result.cost} charged)`,
        });
      } else {
        toast({
          title: "FSSAI verification failed",
          description: result.error_message || "Please check the FSSAI license",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFssaiVerifying(false);
    }
  };

  const onSubmit = (values: Step2FormValues) => {
    onNext({
      pan_number: values.pan_number,
      gst_number: values.gst_number,
      ...(requiresFSSAI && { fssai_number: (values as any).fssai_number }),
      // Save IDfy verification IDs for database storage
      pan_verification_id: panVerificationId,
      gst_verification_id: gstVerificationId,
      fssai_verification_id: fssaiVerificationId,
      // Verification status for admin review
      pan_verified: panVerified,
      gst_verified: gstVerified,
      fssai_verified: fssaiVerified,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">KYC Documents</h2>
          <p className="text-sm text-muted-foreground">
            Verify your business identity with government documents
          </p>
        </div>

        {/* Conditional FSSAI Alert (YOUR BRILLIANT IDEA!) */}
        {requiresFSSAI && (
          <Alert variant="default" className="border-primary">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>FSSAI License Required</AlertTitle>
            <AlertDescription className="text-xs space-y-2">
              <p>
                Since you deal with <strong>{category}</strong>, FSSAI license is mandatory as per food safety regulations.
              </p>
              <a
                href="https://foscos.fssai.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                How to get FSSAI license? <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        )}

        {/* PAN Card (Mandatory for all) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">PAN Card</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Info className="h-3 w-3" />
                    Auto-verify with IDfy
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Instant verification (₹10 per check)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <FormField
            control={form.control}
            name="pan_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between">
                  <span>PAN Number</span>
                  {panVerified && (
                    <Badge variant="default" className="bg-green-600 text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className="uppercase"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVerifyPAN}
                    disabled={panVerifying || panVerified || !field.value}
                    className="flex-shrink-0"
                  >
                    {panVerifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : panVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
                <FormDescription className="text-xs">
                  10-character PAN (5 letters, 4 numbers, 1 letter)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label>PAN Card Document</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Upload PAN card image</p>
              <p className="text-xs text-muted-foreground">JPG, PNG (max 5MB)</p>
              <Button type="button" variant="outline" size="sm" className="mt-2">
                Select File
              </Button>
            </div>
          </div>
        </div>

        {/* GST Certificate (Mandatory for all) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">GST Registration</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Info className="h-3 w-3" />
                    Auto-verify with IDfy
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Instant verification (₹15 per check)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <FormField
            control={form.control}
            name="gst_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between">
                  <span>GST Number</span>
                  {gstVerified && (
                    <Badge variant="default" className="bg-green-600 text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      className="uppercase"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVerifyGST}
                    disabled={gstVerifying || gstVerified || !field.value}
                    className="flex-shrink-0"
                  >
                    {gstVerifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : gstVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
                <FormDescription className="text-xs">
                  15-character GSTIN
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* FSSAI License (CONDITIONAL - only if food category) */}
        {requiresFSSAI && (
          <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                FSSAI License (Required for Food)
              </h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Info className="h-3 w-3" />
                      Auto-verify with IDfy
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Instant verification (₹15 per check)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <FormField
              control={form.control}
              name="fssai_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>FSSAI License Number</span>
                    {fssaiVerified && (
                      <Badge variant="default" className="bg-green-600 text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="12345678901234"
                        maxLength={14}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyFSSAI}
                      disabled={fssaiVerifying || fssaiVerified || !field?.value}
                      className="flex-shrink-0"
                    >
                      {fssaiVerifying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : fssaiVerified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                  <FormDescription className="text-xs">
                    14-digit FSSAI license number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>FSSAI Certificate</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Upload FSSAI certificate</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 5MB)</p>
                <Button type="button" variant="outline" size="sm" className="mt-2">
                  Select File
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button type="button" variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button type="submit" className="gap-2">
            Next: Banking Details
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
};
