import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Smartphone } from "lucide-react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
  error?: boolean;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, onBlur, placeholder, disabled, className, id = "phone", required, error }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow digits
      const digits = e.target.value.replace(/\D/g, '');
      // Limit to 10 digits (Indian format)
      if (digits.length <= 10) {
        onChange(digits);
      }
    };

    return (
      <div className="relative w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">+91</span>
        </div>
        <Input
          ref={ref}
          id={id}
          type="tel"
          inputMode="numeric"
          placeholder={placeholder || "Enter your mobile number"}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={cn(
            "pl-[68px] text-base h-14", // Larger height for prominence (Swiggy pattern)
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          maxLength={10}
          aria-label="Mobile number"
          aria-invalid={error ? "true" : "false"}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";


