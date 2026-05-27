import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gavel, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";

import { submitHumanReview, type Application } from "@/lib/applications";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";
import { PipelineResults } from "@/components/PipelineResults";

type HumanReviewPanelProps = {
  application: Application;
};

export function HumanReviewPanel({ application }: HumanReviewPanelProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: (approved: boolean) =>
      submitHumanReview(application.slug, { approved, attorneyNotes: notes }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["application", application.slug] });
      const mock = data.call?.mock;
      toast.success(
        mock
          ? "Decision recorded (call simulated — configure Twilio + ElevenLabs)"
          : "Decision recorded — applicant will be called",
      );
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Review failed"),
  });

  if (application.humanReview.status !== "pending") {
    return (
      <>
        <PipelineResults application={application} />
        {application.callLog.length > 0 && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2 text-base">
                <Phone className="size-4" /> Call log
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="pt-0 text-xs text-muted-foreground space-y-2">
              {application.callLog.map((entry, i) => (
                <pre key={i} className="whitespace-pre-wrap rounded-lg bg-muted/30 p-3">
                  {JSON.stringify(entry, null, 2)}
                </pre>
              ))}
            </GlassCardContent>
          </GlassCard>
        )}
      </>
    );
  }

  if (application.pipeline.status !== "awaiting_human") {
    return <PipelineResults application={application} />;
  }

  return (
    <div className="space-y-4">
      <PipelineResults application={application} />
      <GlassCard className="border-primary/40">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2 text-base">
            <Gavel className="size-4" /> Attorney decision
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4 pt-0">
          <p className="text-sm text-muted-foreground">
            Review the AI recommendation and reasons above. Your decision triggers a status call to{" "}
            <strong>{application.phoneNumber || "applicant"}</strong> via ElevenLabs + Twilio.
          </p>
          <div className="space-y-2">
            <Label>Notes to applicant (included in call script)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional message for the applicant…"
              rows={3}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(true)}
            >
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Approve application
            </Button>
            <Button
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(false)}
            >
              Decline application
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
