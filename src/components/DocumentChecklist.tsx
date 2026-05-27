import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { uploadDocument, type Application } from "@/lib/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";

type DocumentChecklistProps = {
  application: Application;
};

export function DocumentChecklist({ application }: DocumentChecklistProps) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, { fileName: string; notes: string }>>({});

  const uploadMutation = useMutation({
    mutationFn: ({ docId, fileName, notes }: { docId: string; fileName: string; notes: string }) =>
      uploadDocument(application.slug, { docId, fileName, notes }),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["application", application.slug] });
      if (updated.pipeline?.status === "awaiting_human") {
        toast.success("All documents received — AI review complete");
      } else if (updated.pipeline?.status === "running") {
        toast.success("All documents received — AI review in progress");
      } else {
        toast.success("Document saved");
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Upload failed"),
  });

  const { mandatoryUploaded, mandatoryTotal, complete } = application.documentsSummary ?? {
    mandatoryUploaded: 0,
    mandatoryTotal: 0,
    complete: false,
  };

  const pipelineStatus = application.pipeline?.status ?? "idle";
  const pipelineRunning = pipelineStatus === "running";
  const pipelineDone = pipelineStatus === "awaiting_human";

  return (
    <GlassCard>
      <GlassCardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <GlassCardTitle className="text-base">Mandatory documents</GlassCardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {mandatoryUploaded} of {mandatoryTotal} required for {application.visaType}
          </p>
        </div>
        {pipelineRunning && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-[var(--landing-accent)]" />
            AI review in progress
          </span>
        )}
        {pipelineDone && (
          <span className="inline-flex items-center gap-1.5 text-xs text-success">
            <Sparkles className="size-3.5" />
            AI review complete
          </span>
        )}
      </GlassCardHeader>
      <GlassCardContent className="space-y-4 pt-0">
        {application.documents.map((doc) => {
          const draft = drafts[doc.docId] ?? { fileName: doc.fileName, notes: doc.notes };
          const uploaded = doc.status !== "missing" && Boolean(doc.fileName);

          return (
            <div
              key={doc.docId}
              className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {uploaded ? (
                    <CheckCircle2 className="size-4 text-success shrink-0" />
                  ) : (
                    <FileText className="size-4 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{doc.label}</p>
                    {doc.required && (
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Required</p>
                    )}
                  </div>
                </div>
                {uploaded ? (
                  <StatusBadge status="approved">Uploaded</StatusBadge>
                ) : (
                  <StatusBadge status="needs_info">Missing</StatusBadge>
                )}
              </div>
              {!uploaded && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">File name</Label>
                    <Input
                      placeholder="passport-scan.pdf"
                      value={draft.fileName}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [doc.docId]: { ...draft, fileName: e.target.value },
                        }))
                      }
                      className="h-9 bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Notes (until OCR is added)</Label>
                    <Textarea
                      placeholder="Key details from this document for AI validation…"
                      rows={2}
                      value={draft.notes}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [doc.docId]: { ...draft, notes: e.target.value },
                        }))
                      }
                      className="bg-background/50 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="glass"
                    disabled={uploadMutation.isPending || !draft.fileName.trim()}
                    onClick={() =>
                      uploadMutation.mutate({
                        docId: doc.docId,
                        fileName: draft.fileName.trim(),
                        notes: draft.notes.trim(),
                      })
                    }
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    Mark uploaded
                  </Button>
                </>
              )}
              {uploaded && (
                <p className="text-xs text-muted-foreground">
                  {doc.fileName}
                  {doc.notes ? ` · ${doc.notes}` : ""}
                </p>
              )}
            </div>
          );
        })}
        {complete && pipelineStatus === "idle" && (
          <p className="text-sm text-muted-foreground">
            All mandatory documents uploaded. AI validation runs automatically — results appear below
            once complete.
          </p>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
