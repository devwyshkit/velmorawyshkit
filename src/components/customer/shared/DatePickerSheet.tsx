import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DatePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
}

export const DatePickerSheet = ({ isOpen, onClose, onDateSelect, minDate }: DatePickerSheetProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Min date: 2 days from today (default)
  const minimumDate = minDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  
  // Generate dates for next 30 days
  const generateDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 2; i <= 30; i++) {
      dates.push(new Date(today.getTime() + i * 24 * 60 * 60 * 1000));
    }
    return dates;
  };
  
  const dates = generateDates();
  
  const isDateAvailable = (date: Date) => {
    return date >= minimumDate;
  };
  
  const isSpecialDate = (date: Date) => {
    // Simple check for Valentine's Day example
    return date.getMonth() === 1 && date.getDate() === 14;
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  const handleConfirm = () => {
    if (selectedDate) {
      onDateSelect(selectedDate);
      onClose();
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent side="bottom" className="h-auto rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2">
        {/* Grabber */}
        <div className="flex justify-center pt-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        <div className="p-4 space-y-6">
          <h2 className="text-lg font-semibold">When should we deliver?</h2>
          
          {/* Calendar-style grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Date cells */}
            {dates.map((date, index) => {
              const isDisabled = !isDateAvailable(date);
              const isSelected = selectedDate && 
                date.toDateString() === selectedDate.toDateString();
              
              return (
                <button
                  key={index}
                  onClick={() => !isDisabled && setSelectedDate(date)}
                  disabled={isDisabled}
                  className={cn(
                    "aspect-square rounded-lg text-sm transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold"
                      : isDisabled
                      ? "text-muted-foreground/20 cursor-not-allowed"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          
          {selectedDate && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Selected: <span className="font-semibold">
                  {formatDate(selectedDate)}
                  {isSpecialDate(selectedDate) && " (Valentine's Day)"}
                </span>
              </p>
            </div>
          )}
          
          <Button 
            className="w-full" 
            disabled={!selectedDate}
            onClick={handleConfirm}
          >
            Confirm Date
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

