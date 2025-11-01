import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { MessageCircle, Phone, Mail } from "lucide-react";

export const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader title="Help & Support" showBackButton />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <Input 
          placeholder="🔍 Search your issue..." 
          className="w-full"
        />
        
        <div>
          <h3 className="font-semibold mb-3">🔥 Common Questions</h3>
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="track" className="border rounded-lg px-4">
              <AccordionTrigger>How to track my order?</AccordionTrigger>
              <AccordionContent>
                Go to Profile → Past Orders, then tap on any order to view tracking details. 
                You can also track from the order confirmation page.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="preview" className="border rounded-lg px-4">
              <AccordionTrigger>What is design approval process?</AccordionTrigger>
              <AccordionContent>
                For customisable items, partners will send a preview within 2 hours. 
                Review the mockup and either approve to start production or request changes.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="refund" className="border rounded-lg px-4">
              <AccordionTrigger>Refund and return policy</AccordionTrigger>
              <AccordionContent>
                You can return items within 7 days of delivery. Approved custom items 
                cannot be returned once production starts. Contact support for assistance.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="change-date" className="border rounded-lg px-4">
              <AccordionTrigger>How to change delivery date/time?</AccordionTrigger>
              <AccordionContent>
                Contact support before the item goes into production. Once production 
                has started, we cannot change the delivery schedule.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="cancel" className="border rounded-lg px-4">
              <AccordionTrigger>Cancel order</AccordionTrigger>
              <AccordionContent>
                Orders can be cancelled before production starts. For custom items, 
                this is typically within 2 hours of order placement.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="upload" className="border rounded-lg px-4">
              <AccordionTrigger>Upload design guidelines</AccordionTrigger>
              <AccordionContent>
                Supported formats: JPG, PNG, PDF. Max size: 10MB. Ensure your design 
                is high resolution (at least 300 DPI) for best print quality.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div>
          <h3 className="font-semibold mb-3">📞 Contact Us</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat with us
              </div>
              <Badge variant="secondary">Available</Badge>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Phone className="h-4 w-4 mr-2" />
              Call: 1800-123-4567
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Email: help@wyshkit.com
            </Button>
          </div>
          
          <div className="mt-3 text-sm text-muted-foreground">
            Business Hours: 9 AM - 9 PM
            <br />
            Average response time: 2 mins
          </div>
        </div>
      </main>
      
      <CustomerBottomNav />
    </div>
  );
};

