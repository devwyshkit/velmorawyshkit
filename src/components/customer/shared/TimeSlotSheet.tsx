import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TimeSlotSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onTimeSelect: (slot: string) => void;
}

export const TimeSlotSheet = ({ isOpen, onClose, selectedDate, onTimeSelect }: TimeSlotSheetProps) => {
  const [selectedSlot, setSelectedSlot] = useState('morning');
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  const handleConfirm = () => {
    onTimeSelect(selectedSlot);
    onClose();
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2">
        {/* Grabber */}
        <div className="flex justify-center pt-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        <div className="p-4 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Pick delivery time</h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(selectedDate)}
            </p>
          </div>
          
          <RadioGroup value={selectedSlot} onValueChange={setSelectedSlot}>
            <div className="space-y-3">
              <Label className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  <RadioGroupItem value="morning" id="morning" />
                  <div>
                    <span className="font-medium text-sm">Morning (9 AM - 12 PM)</span>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2">Most popular</Badge>
              </Label>
              
              <Label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  <RadioGroupItem value="afternoon" id="afternoon" />
                  <span className="font-medium text-sm">Afternoon (12 PM - 3 PM)</span>
                </div>
              </Label>
              
              <Label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  <RadioGroupItem value="evening" id="evening" />
                  <span className="font-medium text-sm">Evening (4 PM - 7 PM)</span>
                </div>
              </Label>
              
              <Label className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  <RadioGroupItem value="surprise" id="surprise" />
                  <div>
                    <span className="font-medium text-sm">Surprise Me 🎁</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Don't tell recipient exact time (Adds mystery!)
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          <Button 
            className="w-full"
            onClick={handleConfirm}
          >
            Confirm Time Slot
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

