import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowRight, ArrowLeft, AlertTriangle, Upload, ExternalLink } from "lucide-react";

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

  const onSubmit = (values: Step2FormValues) => {
    onNext({
      pan_number: values.pan_number,
      gst_number: values.gst_number,
      ...(requiresFSSAI && { fssai_number: (values as any).fssai_number }),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          <h3 className="font-medium text-sm">PAN Card</h3>
          
          <FormField
            control={form.control}
            name="pan_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PAN Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="uppercase"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
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
          <h3 className="font-medium text-sm">GST Registration</h3>
          
          <FormField
            control={form.control}
            name="gst_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className="uppercase"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
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
            <h3 className="font-medium text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              FSSAI License (Required for Food)
            </h3>
            
            <FormField
              control={form.control}
              name="fssai_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>FSSAI License Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="12345678901234"
                      maxLength={14}
                      {...field}
                    />
                  </FormControl>
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

// Import Label for file upload sections
import { Label } from "@/components/ui/label";

