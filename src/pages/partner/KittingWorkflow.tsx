import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Upload,
  Calendar,
  ArrowLeft,
  Loader2,
  Camera,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";

interface KittingStep {
  id: string;
  step_number: number;
  instruction: string;
  completed: boolean;
  qc_photo_url?: string;
}

interface KittingJobDetail {
  id: string;
  order_number: string;
  customer_name: string;
  total_units: number;
  units_completed: number;
  status: string;
  assembly_instructions: string[];
}

/**
 * KittingWorkflow - Unit-by-unit assembly tracking
 * QC photos, checklist, and pickup scheduling
 */
export const KittingWorkflow = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<KittingJobDetail | null>(null);
  const [currentUnit, setCurrentUnit] = useState(1);
  const [steps, setSteps] = useState<KittingStep[]>([]);
  const [qcPhotos, setQcPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [schedulingPickup, setSchedulingPickup] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");

  useEffect(() => {
    loadKittingJob();
  }, [jobId, currentUnit]);

  const loadKittingJob = async () => {
    if (!jobId) return;

    setLoading(true);
    try {
      const { data: jobData, error: jobError } = await supabase
        .from('kitting_jobs')
        .select(`
          *,
          orders(order_number, customer_name:delivery_address),
          assembly_instructions(instruction_text)
        `)
        .eq('id', jobId)
        .single();

      if (jobError) {
        console.warn('Job fetch failed, using mock:', jobError);
        setJob({
          id: jobId,
          order_number: '#WK-8742',
          customer_name: 'Rahul Enterprises',
          total_units: 20,
          units_completed: 0,
          status: 'in_progress',
          assembly_instructions: [
            'Verify all components are present',
            'Place Boat Rockerz in gift box',
            'Add chocolate box beside headphones',
            'Insert greeting card',
            'Close and seal gift box',
            'Apply quality control sticker',
          ],
        });

        setSteps(
          [
            'Verify all components are present',
            'Place Boat Rockerz in gift box',
            'Add chocolate box beside headphones',
            'Insert greeting card',
            'Close and seal gift box',
            'Apply quality control sticker',
          ].map((inst, idx) => ({
            id: `step-${idx}`,
            step_number: idx + 1,
            instruction: inst,
            completed: false,
          }))
        );
      } else {
        const jobInfo = {
          id: jobData.id,
          order_number: jobData.orders?.order_number || 'N/A',
          customer_name: jobData.orders?.customer_name || 'Customer',
          total_units: jobData.total_units,
          units_completed: jobData.units_completed,
          status: jobData.status,
          assembly_instructions: (jobData.assembly_instructions || []).map((ai: any) => ai.instruction_text),
        };
        setJob(jobInfo);

        // Load steps for current unit
        const { data: stepsData } = await supabase
          .from('kitting_steps')
          .select('*')
          .eq('kitting_job_id', jobId)
          .eq('unit_number', currentUnit)
          .order('step_number');

        setSteps(
          (stepsData || []).map((s: any) => ({
            id: s.id,
            step_number: s.step_number,
            instruction: s.instruction,
            completed: s.completed,
            qc_photo_url: s.qc_photo_url,
          }))
        );

        // Load QC photos for current unit
        const { data: photosData } = await supabase
          .from('kitting_qc_photos')
          .select('photo_url')
          .eq('kitting_job_id', jobId)
          .eq('unit_number', currentUnit);

        setQcPhotos((photosData || []).map((p: any) => p.photo_url));
      }
    } catch (error) {
      console.error('Load kitting job error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepToggle = async (stepId: string, completed: boolean) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, completed } : s));

    // Update in database
    await supabase
      .from('kitting_steps')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', stepId);
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      // Mock upload for now (would use Cloudinary in production)
      const mockUrl = URL.createObjectURL(file);
      setQcPhotos([...qcPhotos, mockUrl]);

      await supabase.from('kitting_qc_photos').insert({
        kitting_job_id: jobId,
        unit_number: currentUnit,
        photo_url: mockUrl,
        uploaded_by: user?.id,
      });

      toast({
        title: "QC photo uploaded",
        description: "Quality control photo saved",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload photo",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleMarkUnitComplete = async () => {
    const allStepsCompleted = steps.every(s => s.completed);
    
    if (!allStepsCompleted) {
      toast({
        title: "Complete all steps",
        description: "Please complete all assembly steps for this unit",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update units_completed
      await supabase
        .from('kitting_jobs')
        .update({
          units_completed: currentUnit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      toast({
        title: `Unit ${currentUnit} completed! ✓`,
        description: `${job!.total_units - currentUnit} units remaining`,
      });

      // Move to next unit or mark job complete
      if (currentUnit < job!.total_units) {
        setCurrentUnit(currentUnit + 1);
      } else {
        // All units complete
        await supabase
          .from('kitting_jobs')
          .update({
            status: 'completed',
            kitting_completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        toast({
          title: "All units completed! 🎉",
          description: "Schedule pickup to complete the order",
        });

        loadKittingJob();
      }
    } catch (error) {
      console.error('Mark unit complete error:', error);
    }
  };

  const handleSchedulePickup = async () => {
    if (!selectedTimeSlot) {
      toast({
        title: "Select a time slot",
        variant: "destructive",
      });
      return;
    }

    setSchedulingPickup(true);
    try {
      await supabase
        .from('kitting_jobs')
        .update({
          pickup_scheduled_time: selectedTimeSlot,
          status: 'shipped',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      toast({
        title: "Pickup scheduled!",
        description: "Logistics partner will collect the order",
      });

      navigate('/partner/orders');
    } catch (error) {
      toast({
        title: "Scheduling failed",
        description: "Could not schedule pickup",
        variant: "destructive",
      });
    } finally {
      setSchedulingPickup(false);
    }
  };

  if (loading || !job) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const allUnitsComplete = job.units_completed === job.total_units;
  const progressPercent = Math.round((job.units_completed / job.total_units) * 100);

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/partner/kitting')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            Kitting: {job.order_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {job.customer_name} • {job.total_units} hampers
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completed Units</span>
              <span className="font-bold">{job.units_completed}/{job.total_units}</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {progressPercent}% complete
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Unit Assembly (if not all complete) */}
      {!allUnitsComplete && (
        <>
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-base">
                Unit {currentUnit} of {job.total_units}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assembly Checklist */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Assembly Steps:</p>
                {steps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted">
                    <Checkbox
                      id={step.id}
                      checked={step.completed}
                      onCheckedChange={(checked) => handleStepToggle(step.id, checked as boolean)}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={step.id}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {step.step_number}. {step.instruction}
                    </Label>
                  </div>
                ))}
              </div>

              {/* QC Photo Upload */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Quality Control Photos</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {qcPhotos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`QC ${idx + 1}`}
                      className="w-full aspect-square rounded object-cover border"
                    />
                  ))}
                </div>
                <label htmlFor="qc-photo-upload">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={uploadingPhoto}
                    onClick={() => document.getElementById('qc-photo-upload')?.click()}
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Upload QC Photo
                      </>
                    )}
                  </Button>
                </label>
                <input
                  id="qc-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }}
                />
              </div>

              {/* Mark Unit Complete */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleMarkUnitComplete}
                disabled={!steps.every(s => s.completed)}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Mark Unit {currentUnit} Complete
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Pickup Scheduling (when all units complete) */}
      {allUnitsComplete && (
        <Card className="border-green-600 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              All Units Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                Great job! All {job.total_units} hampers are assembled. Schedule pickup to complete the order.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label htmlFor="time-slot">Pickup Time Slot</Label>
              <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                <SelectTrigger id="time-slot">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={new Date(Date.now() + 3600000 * 4).toISOString()}>
                    Today 4:00 PM - 8:00 PM
                  </SelectItem>
                  <SelectItem value={new Date(Date.now() + 86400000).toISOString()}>
                    Tomorrow 10:00 AM - 2:00 PM
                  </SelectItem>
                  <SelectItem value={new Date(Date.now() + 86400000 + 3600000 * 6).toISOString()}>
                    Tomorrow 4:00 PM - 8:00 PM
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSchedulePickup}
                disabled={schedulingPickup || !selectedTimeSlot}
              >
                {schedulingPickup ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 mr-2" />
                    Schedule Pickup
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

