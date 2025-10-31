import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { AlertCircle, FileImage, Download, ZoomIn, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";

interface PreviewApprovalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  deadline?: Date;
  deliveryDate?: Date;
  productionDays?: number;
  freeRevisionsLeft?: number;
  revisionCost?: number;
}

export const PreviewApprovalSheet = ({ 
  isOpen, 
  onClose, 
  orderId,
  deadline,
  deliveryDate,
  productionDays = 3,
  freeRevisionsLeft = 2,
  revisionCost = 100
}: PreviewApprovalSheetProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [revisions, setRevisions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  
  // Mock proof data
  const proof = {
    orderId: orderId || 'ORD-123',
    itemName: 'Custom Gift Hamper',
    mockups: [
      `https://picsum.photos/seed/proof-${orderId || 'ORD-123'}-1/800/600`,
      `https://picsum.photos/seed/proof-${orderId || 'ORD-123'}-2/800/600`,
      `https://picsum.photos/seed/proof-${orderId || 'ORD-123'}-3/800/600`,
    ],
  };

  // Set default deadline if not provided
  const approvalDeadline = deadline || new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h default
  const targetDelivery = deliveryDate || new Date(Date.now() + (productionDays + 3) * 24 * 60 * 60 * 1000);

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = approvalDeadline.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("Overdue");
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h left`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [approvalDeadline]);

  const revisionOptions = [
    { id: 'color', label: 'Adjust colors' },
    { id: 'text', label: 'Fix text/typography' },
    { id: 'layout', label: 'Change layout' },
    { id: 'images', label: 'Replace images' },
  ];

  const handleRevisionToggle = (revisionId: string) => {
    setRevisions(prev =>
      prev.includes(revisionId)
        ? prev.filter(id => id !== revisionId)
        : [...prev, revisionId]
    );
  };

  const handleDownloadAll = () => {
    toast({
      title: "Downloading mockups",
      description: "Your files will be downloaded shortly",
    });
    // Mock download - in production, trigger actual download
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "File uploaded",
        description: file.name,
      });
    }
  };

  const handleApprove = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);

    try {
      // Submit approval to backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Proof Approved! ✅",
        description: "Your item will now be produced",
      });

      onClose();
      navigate(`${RouteMap.track(proof.orderId)}`);
    } catch (error) {
      toast({
        title: "Approval failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleSubmitRevisions = async () => {
    if (revisions.length === 0 && !feedback && !uploadedFile) {
      toast({
        title: "No changes requested",
        description: "Please select revisions, add feedback, or upload a file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Submit revisions to backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Changes requested",
        description: "Partner will send updated preview within 24h",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-xl p-0 overflow-hidden flex flex-col sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
        >
          {/* Grabber */}
          <div className="flex justify-center pt-2">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Review Your Design</h2>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Item Info */}
            <div>
              <h3 className="font-semibold mb-1">{proof.itemName}</h3>
              <p className="text-sm text-muted-foreground">
                Order ID: {proof.orderId}
              </p>
            </div>

            {/* Deadline Warning */}
            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning rounded-lg">
              <Clock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-warning-foreground">
                  Respond by {formatDate(approvalDeadline)}
                </p>
                <p className="text-xs text-warning-foreground/70 mt-1">
                  {timeLeft} • Must approve by {approvalDeadline.toLocaleDateString('en-IN')} for {targetDelivery.toLocaleDateString('en-IN')} delivery
                </p>
              </div>
            </div>

            {/* Production Timeline */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">📅 Production Timeline</p>
              <p className="text-xs text-muted-foreground">
                Once approved, production starts immediately ({productionDays} days). 
                Must approve by {approvalDeadline.toLocaleDateString('en-IN')} for {targetDelivery.toLocaleDateString('en-IN')} delivery.
              </p>
            </div>

            {/* Mockup Carousel with Download */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-sm font-medium">Design Mockups</Label>
                <Button variant="ghost" size="sm" onClick={handleDownloadAll}>
                  <Download className="h-4 w-4 mr-1" />
                  Download All
                </Button>
              </div>
              <Carousel className="w-full">
                <CarouselContent>
                  {proof.mockups.map((mockup, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                        <img
                          src={mockup}
                          alt={`Mockup ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setFullscreenImage(mockup)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {/* Fallback icon */}
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                          <FileImage className="w-16 h-16" />
                        </div>
                        {/* Zoom indicator */}
                        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
                          <ZoomIn className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>

            {/* Revision Options with Count */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-sm font-medium">Request Changes (Optional)</Label>
                <Badge variant="secondary">{freeRevisionsLeft} free revisions left</Badge>
              </div>
              {freeRevisionsLeft > 0 && (
                <p className="text-xs text-muted-foreground mb-2">
                  Additional revisions: ₹{revisionCost} each
                </p>
              )}
              <div className="space-y-3">
                {revisionOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={revisions.includes(option.id)}
                      onCheckedChange={() => handleRevisionToggle(option.id)}
                    />
                    <Label
                      htmlFor={option.id}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="upload" className="text-sm font-medium mb-2 block">
                Upload Revised Design (Optional)
              </Label>
              <Input
                id="upload"
                type="file"
                accept=".jpg,.png,.pdf,.psd"
                onChange={handleFileUpload}
                className="text-sm"
              />
              {uploadedFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  ✓ {uploadedFile.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                If you've made changes to the design file
              </p>
            </div>

            {/* Feedback */}
            <div>
              <Label htmlFor="feedback" className="text-sm font-medium mb-2 block">
                Additional Feedback (Optional)
              </Label>
              <Textarea
                id="feedback"
                placeholder="Provide specific details about changes you'd like..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="resize-none"
                rows={4}
              />
            </div>

            {/* Non-refundable Warning */}
            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning rounded-lg">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning-foreground">
                <strong>Important:</strong> Once you approve this design, the item will be produced and 
                cannot be refunded or modified.
              </p>
            </div>
          </div>

          {/* Footer with Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-border p-4 space-y-3">
            {showConfirm ? (
              <div className="p-3 bg-muted rounded-lg space-y-3">
                <p className="font-medium text-sm">Start production?</p>
                <p className="text-xs text-muted-foreground">
                  Cannot be cancelled once started
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConfirm(false)}
                    className="flex-1"
                  >
                    Review Again
                  </Button>
                  <Button 
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1"
                  >
                    Yes, Start Production
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {(revisions.length > 0 || feedback || uploadedFile) && (
                  <Button
                    onClick={handleSubmitRevisions}
                    variant="outline"
                    className="w-full h-12"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Request Changes"}
                  </Button>
                )}
                <Button
                  onClick={handleApprove}
                  className="w-full h-12"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Approving..." : "Approve & Proceed"}
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <img 
            src={fullscreenImage} 
            alt="Fullscreen view" 
            className="max-w-full max-h-full object-contain"
          />
          <Button
            className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-black"
            onClick={() => setFullscreenImage(null)}
          >
            Close
          </Button>
        </div>
      )}
    </>
  );
};
