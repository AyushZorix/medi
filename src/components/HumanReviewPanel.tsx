import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gavel, Loader2, Phone, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { submitHumanReview, runPipeline, triggerOutboundCall, type Application } from "@/lib/applications";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
} from "@/components/GlassCard";
import { PipelineResults } from "@/components/PipelineResults";

type HumanReviewPanelProps = {
  application: Application;
};

export function HumanReviewPanel({ application }: HumanReviewPanelProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [statusScript, setStatusScript] = useState("");
  const [phoneVal, setPhoneVal] = useState(application.phoneNumber || "");
  const [pendingCallTrigger, setPendingCallTrigger] = useState(false);
  const [shouldCallUserAfterPipeline, setShouldCallUserAfterPipeline] = useState(false);

  useEffect(() => {
    if (application) {
      setPhoneVal(application.phoneNumber || "");
    }
  }, [application?.phoneNumber]);

  useEffect(() => {
    if (pendingCallTrigger && application) {
      setPendingCallTrigger(false);
      const name = application.applicantName?.split(" ")[0] || "there";
      const statusText =
        application.status === "approved"
          ? "approved"
          : application.status === "rejected"
            ? "not approved at this time"
            : application.status === "needs_info"
              ? "in need of additional information"
              : "currently processing";

      const scoreText = application.score > 0
        ? ` with an AI confidence rating of ${application.score} percent`
        : "";

      const updatedScript = `Hello ${name}, this is VisaIQ calling to update you on your ${application.visaType} visa application status. Your application is currently ${statusText}${scoreText}. Please log in to your applicant portal to review any updates. Thank you.`;
      
      toast.info("Placing outbound status call with updated AI score...");
      triggerOutboundCall(application.slug, updatedScript, phoneVal)
        .then((data) => {
          queryClient.invalidateQueries({ queryKey: ["applications"] });
          queryClient.invalidateQueries({ queryKey: ["application", application.slug] });
          const call = data.call;
          if (call?.skipped) {
            toast.error(call.reason || "Call skipped. Configure ElevenLabs to place calls.");
            return;
          }
          if (call?.error) {
            toast.error(call.error || "Call failed");
            return;
          }
          toast.success("Call placed successfully via ElevenLabs agent!");
        })
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : "Failed to place call");
        });
    }
  }, [application, pendingCallTrigger, queryClient]);

  useEffect(() => {
    if (application) {
      const name = application.applicantName?.split(" ")[0] || "there";
      const statusText =
        application.status === "approved"
          ? "approved"
          : application.status === "rejected"
            ? "not approved at this time"
            : application.status === "needs_info"
              ? "in need of additional information"
              : "currently processing";

      const scoreText = application.score > 0
        ? ` with an AI confidence rating of ${application.score} percent`
        : "";

      setStatusScript(
        `Hello ${name}, this is VisaIQ calling to update you on your ${application.visaType} visa application status. Your application is currently ${statusText}${scoreText}. Please log in to your applicant portal to review any updates. Thank you.`
      );
    }
  }, [application]);

  const callMutation = useMutation({
    mutationFn: () => triggerOutboundCall(application.slug, statusScript, phoneVal),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["application", application.slug] });
      const call = data.call;
      if (call?.skipped) {
        toast.error(call.reason || "Call skipped. Configure ElevenLabs to place calls.");
        return;
      }
      if (call?.error) {
        toast.error(call.error || "Call failed");
        return;
      }
      toast.success("Call placed successfully via ElevenLabs agent!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to place call"),
  });

  const reviewMutation = useMutation({
    mutationFn: (approved: boolean) =>
      submitHumanReview(application.slug, { approved, attorneyNotes: notes }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["application", application.slug] });
      const call = data.call;
      if (call?.skipped) {
        toast.error(call.reason || "Decision recorded, but call was skipped.");
        return;
      }
      if (call?.error) {
        toast.error(call.error || "Decision recorded, but call failed.");
        return;
      }
      toast.success("Decision recorded — applicant will be called via ElevenLabs agent");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Review failed"),
  });

  const pipelineMutation = useMutation({
    mutationFn: () => runPipeline(application.slug),
    onSuccess: async (updatedApp) => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["application", application.slug] });
      toast.success("AI Pipeline completed successfully!");

      if (shouldCallUserAfterPipeline) {
        setShouldCallUserAfterPipeline(false);
        if (updatedApp) {
          const name = updatedApp.applicantName?.split(" ")[0] || "there";
          const statusText =
            updatedApp.status === "approved"
              ? "approved"
              : updatedApp.status === "rejected"
                ? "not approved at this time"
                : updatedApp.status === "needs_info"
                  ? "in need of additional information"
                  : "currently processing";

          const scoreText = updatedApp.score > 0
            ? ` with an AI confidence rating of ${updatedApp.score} percent`
            : "";

          const updatedScript = `Hello ${name}, this is VisaIQ calling to update you on your ${updatedApp.visaType} visa application status. Your application is currently ${statusText}${scoreText}. Please log in to your applicant portal to review any updates. Thank you.`;
          
          toast.info("Placing outbound status call with updated AI score...");
          triggerOutboundCall(updatedApp.slug, updatedScript, phoneVal)
            .then((data) => {
              queryClient.invalidateQueries({ queryKey: ["applications"] });
              queryClient.invalidateQueries({ queryKey: ["application", updatedApp.slug] });
              const call = data.call;
              if (call?.skipped) {
                toast.error(call.reason || "Call skipped. Configure ElevenLabs to place calls.");
                return;
              }
              if (call?.error) {
                toast.error(call.error || "Call failed");
                return;
              }
              toast.success("Call placed successfully via ElevenLabs agent!");
            })
            .catch((err) => {
              toast.error(err instanceof Error ? err.message : "Failed to place call");
            });
        }
      }
    },
    onError: (err) => {
      setShouldCallUserAfterPipeline(false);
      toast.error(err instanceof Error ? err.message : "AI Pipeline execution failed");
    },
  });

  const renderMainContent = () => {
    if (application.humanReview.status !== "pending") {
      return <PipelineResults application={application} />;
    }

    if (application.pipeline.status === "idle" || application.pipeline.status === "failed") {
      return (
        <GlassCard className="border-[var(--landing-accent)]/35 shadow-glow">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-base">
              <Brain className="size-4 text-primary" /> Run AI Verification
            </GlassCardTitle>
            <GlassCardDescription className="text-xs">
              Review case files. Run the automated multi-agent AI verification checks to evaluate document alignment.
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4 pt-0">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Running the pipeline triggers the Validator agent, consistency checks, and decider recommendations.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="gradient"
                disabled={pipelineMutation.isPending}
                onClick={() => {
                  setShouldCallUserAfterPipeline(false);
                  pipelineMutation.mutate();
                }}
                className="w-full transition-transform active:scale-98"
              >
                {pipelineMutation.isPending && !shouldCallUserAfterPipeline ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="size-4 mr-2" />
                )}
                {pipelineMutation.isPending && !shouldCallUserAfterPipeline ? "Executing AI agents..." : "Run AI Verification Pipeline"}
              </Button>

              <Button
                variant="gradient"
                disabled={pipelineMutation.isPending}
                onClick={() => {
                  setShouldCallUserAfterPipeline(true);
                  pipelineMutation.mutate();
                }}
                className="w-full transition-transform active:scale-98 bg-gradient-to-r from-violet to-indigo hover:from-violet/90 hover:to-indigo/90"
              >
                {pipelineMutation.isPending && shouldCallUserAfterPipeline ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Phone className="size-4 mr-2 animate-pulse" />
                )}
                {pipelineMutation.isPending && shouldCallUserAfterPipeline ? "Executing & Calling..." : "Run AI Pipeline & Call User"}
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      );
    }

    if (application.pipeline.status === "running") {
      return (
        <GlassCard className="border-teal/30">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-base">
              <Loader2 className="size-4 animate-spin text-teal" /> AI Evaluation In Progress
            </GlassCardTitle>
            <GlassCardDescription className="text-xs">
              The AI verification pipeline is analyzing document validity and checking cross-document consistency...
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="pt-0 text-xs text-muted-foreground">
            Please wait, LLM analysis is active. This can take 5-15 seconds.
          </GlassCardContent>
        </GlassCard>
      );
    }

    return (
      <div className="space-y-4">
        <PipelineResults application={application} />
        <GlassCard className="border-primary/40">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-base">
              <Gavel className="size-4" /> Attorney Decision & Notes
            </GlassCardTitle>
            <GlassCardDescription className="text-xs">
              Submit formal approval or request changes, providing notes explaining what is correct or what needs correcting.
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4 pt-0">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your notes will be included in the automated call script to explain decision details clearly to the applicant.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Notes to applicant (e.g. what is wrong/right)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain what documents are valid and what evidence requires corrections..."
                rows={4}
                className="bg-background/50 text-sm font-sans"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="success"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate(true)}
              >
                {reviewMutation.isPending && <Loader2 className="size-4 animate-spin mr-1" />}
                Approve case
              </Button>
              <Button
                variant="destructive"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate(false)}
              >
                Decline & request changes
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderMainContent()}

      {/* Call Applicant Card */}
      <GlassCard className="border-primary/20 bg-primary/[0.01]">
        <GlassCardHeader className="pb-3">
          <GlassCardTitle className="flex items-center gap-2 text-base font-bold">
            <Phone className="size-4 text-primary" /> Call Applicant
          </GlassCardTitle>
          <GlassCardDescription className="text-xs">
            Trigger an automated phone call via ElevenLabs agent to inform the applicant of their current case status.
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-3 pt-0">
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Recipient Phone Number
            </Label>
            <Input
              type="tel"
              value={phoneVal}
              onChange={(e) => setPhoneVal(e.target.value)}
              placeholder="e.g. +1234567890"
              className="bg-background/40 text-sm font-sans"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Call script (customise if needed)
            </Label>
            <Textarea
              value={statusScript}
              onChange={(e) => setStatusScript(e.target.value)}
              placeholder="Script to read to the applicant..."
              rows={3}
              className="bg-background/40 text-sm font-sans"
            />
          </div>
          <Button
            variant="outline"
            type="button"
            disabled={callMutation.isPending || !statusScript.trim() || !phoneVal.trim()}
            onClick={() => callMutation.mutate()}
            className="w-full flex items-center justify-center gap-2 border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
          >
            {callMutation.isPending ? (
              <Loader2 className="size-4 animate-spin text-primary mr-1" />
            ) : (
              <Phone className="size-4 mr-1 text-primary animate-pulse" />
            )}
            {callMutation.isPending ? "Calling..." : `Call ${application.applicantName} (${phoneVal || "no number"})`}
          </Button>
        </GlassCardContent>
      </GlassCard>

      {/* Call Logs */}
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
    </div>
  );
}
