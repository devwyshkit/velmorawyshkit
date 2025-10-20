import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const pickupSchema = z.object({
  date: z.date({
    required_error: "Please select a pickup date",
  }),
  timeSlot: z.enum(['morning', 'afternoon', 'evening'], {
    required_error: "Please select a time slot",
  }),
});

type PickupValues = z.infer<typeof pickupSchema>;

interface PickupSchedulerProps {
  returnId: string;
  customerAddress: string;
  onScheduled: () => void;
}

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', time: '10 AM - 2 PM' },
  { id: 'afternoon', label: 'Afternoon', time: '2 PM - 6 PM' },
  { id: 'evening', label: 'Evening', time: '6 PM - 9 PM' },
];

/**
 * Pickup Scheduler Component
 * Schedules return pickup with Delhivery API
 * Following Swiggy/Zomato return pickup patterns
 */
export const PickupScheduler = ({
  returnId,
  customerAddress,
  onScheduled,
}: PickupSchedulerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<PickupValues>({
    resolver: zodResolver(pickupSchema),
  });

  const onSubmit = async (values: PickupValues) => {
    setLoading(true);

    try {
      // Mock Delhivery API call
      // TODO: Replace with actual Delhivery pickup API
      const pickupRequest = {
        return_id: returnId,
        pickup_date: format(values.date, 'yyyy-MM-dd'),
        time_slot: values.timeSlot,
        address: customerAddress,
      };

      console.log('Mock Delhivery Pickup Request:', pickupRequest);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Pickup scheduled",
        description: `Pickup scheduled for ${format(values.date, 'MMM dd, yyyy')} (${TIME_SLOTS.find(s => s.id === values.timeSlot)?.time})`,
      });

      onScheduled();
    } catch (error: any) {
      toast({
        title: "Scheduling failed",
        description: error.message || "Failed to schedule pickup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate next 7 days for date picker
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);

  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-1">Pickup Address:</p>
        <p className="text-xs text-muted-foreground">{customerAddress}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Date Picker */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Pickup Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < today || date > maxDate
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Available for next 7 days
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Slot Selection */}
          <FormField
            control={form.control}
            name="timeSlot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Slot</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="space-y-3"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <div key={slot.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value={slot.id} id={slot.id} />
                        <Label htmlFor={slot.id} className="flex items-center gap-2 cursor-pointer flex-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{slot.label}</p>
                            <p className="text-xs text-muted-foreground">{slot.time}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Scheduling..." : "Schedule Pickup"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

