import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, ArrowLeft, Info } from "lucide-react";

const step3Schema = z.object({
  bank_account_number: z.string().regex(/^[0-9]{9,18}$/, "Invalid account number (9-18 digits)"),
  confirm_account_number: z.string(),
  bank_ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code (e.g., HDFC0001234)"),
  bank_account_name: z.string().min(3, "Account holder name is required"),
  account_type: z.enum(["savings", "current"]),
}).refine((data) => data.bank_account_number === data.confirm_account_number, {
  message: "Account numbers don't match",
  path: ["confirm_account_number"],
});

type Step3FormValues = z.infer<typeof step3Schema>;

interface Step3BankingProps {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

/**
 * Onboarding Step 3: Banking Details
 * For weekly payouts (Swiggy/Zomato pattern)
 */
export const Step3Banking = ({ initialData, onNext, onBack }: Step3BankingProps) => {
  const form = useForm<Step3FormValues>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      bank_account_number: initialData.bank_account_number || "",
      confirm_account_number: "",
      bank_ifsc: initialData.bank_ifsc || "",
      bank_account_name: initialData.bank_account_name || "",
      account_type: initialData.account_type || "current",
    },
  });

  const onSubmit = (values: Step3FormValues) => {
    onNext({
      bank_account_number: values.bank_account_number,
      bank_ifsc: values.bank_ifsc,
      bank_account_name: values.bank_account_name,
      account_type: values.account_type,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Banking Details</h2>
          <p className="text-sm text-muted-foreground">
            Setup your bank account for weekly payouts
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Account holder name must match PAN card name. Payouts are processed every Friday.
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="bank_account_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Holder Name</FormLabel>
              <FormControl>
                <Input placeholder="As per bank records" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                Must match name on PAN card
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bank_account_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Account Number</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="123456789012"
                  maxLength={18}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm_account_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Account Number</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Re-enter account number"
                  maxLength={18}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="bank_ifsc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IFSC Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="HDFC0001234"
                    maxLength={11}
                    className="uppercase"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  11-character IFSC code
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="savings">Savings Account</SelectItem>
                    <SelectItem value="current">Current Account</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Current account recommended for business
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button type="button" variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button type="submit" className="gap-2">
            Next: Review & Submit
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
};

