import { useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { uploadDocument, submitApplicationToAttorney, type Application } from "@/lib/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { analyzeDocumentOcr } from "@/utils/documentOcr";

type DocumentChecklistProps = {
  application: Application;
};

export function DocumentChecklist({ application }: DocumentChecklistProps) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, { fileName: string; file?: File }>>({});
  const [ocrLoading, setOcrLoading] = useState<Record<string, boolean>>({});
  const [reuploading, setReuploading] = useState<Record<string, boolean>>({});

  const uploadMutation = useMutation({
    mutationFn: ({ docId, fileName, notes, extractedText }: { docId: string; fileName: string; notes: string; extractedText: string }) =>
      uploadDocument(application.slug, { docId, fileName, notes, extractedText }),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["application", application.slug] });
      toast.success("Document uploaded successfully");
      setReuploading((prev) => ({ ...prev, [variables.docId]: false }));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Upload failed"),
  });

  const submitMutation = useMutation({
    mutationFn: () => submitApplicationToAttorney(application.slug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["application", application.slug] });
      toast.success("Application successfully submitted to attorney!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Submission failed"),
  });

  const handleFileSelect = (docId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      setDrafts((prev) => ({
        ...prev,
        [docId]: { fileName: file.name, file },
      }));
    }
  };

  const handleUpload = async (docId: string) => {
    const draft = drafts[docId];
    if (!draft || !draft.fileName.trim()) return;

    let extractedText = "";
    if (draft.file) {
      setOcrLoading((prev) => ({ ...prev, [docId]: true }));
      if (draft.file.type.startsWith("image/")) {
        toast.info(`Running AI OCR on ${draft.fileName}...`);
        try {
          const result = await analyzeDocumentOcr(draft.file);
          extractedText = result.bestRotation.text || "";
          toast.success("OCR text extracted successfully!");
        } catch (err) {
          console.error("OCR failed:", err);
          toast.error("OCR failed, uploading document without text extraction.");
        }
      } else if (draft.file.type.startsWith("text/")) {
        try {
          extractedText = await draft.file.text();
        } catch (err) {
          console.error("Failed to read text file:", err);
        }
      }
      setOcrLoading((prev) => ({ ...prev, [docId]: false }));
    }

    uploadMutation.mutate({
      docId,
      fileName: draft.fileName.trim(),
      notes: extractedText,
      extractedText,
    });
  };

  const { mandatoryUploaded, mandatoryTotal, complete } = application.documentsSummary ?? {
    mandatoryUploaded: 0,
    mandatoryTotal: 0,
    complete: false,
  };

  const pipelineStatus = application.pipeline?.status ?? "idle";
  const pipelineRunning = pipelineStatus === "running";
  const pipelineDone = pipelineStatus === "awaiting_human";
  const isLocked = application.humanReview?.status === "approved";

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
        {/* Submission banners */}
        {application.submittedToAttorney && (
          <div className="bg-success/10 border border-success/30 p-4 rounded-xl flex items-start gap-3 mb-2">
            <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-success">Submitted to Attorney</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Your application and uploaded documents were successfully submitted to <strong>{application.attorneyName || "your attorney"}</strong>.
                They are currently reviewing your documents and running AI verification checks. You will receive a status call once their decision is recorded.
              </p>
            </div>
          </div>
        )}

        {application.documents.map((doc) => {
          const isReuploading = reuploading[doc.docId];
          const draft = drafts[doc.docId] ?? (isReuploading ? { fileName: "" } : { fileName: doc.fileName });
          const uploaded = doc.status !== "missing" && Boolean(doc.fileName);
          const showUploadForm = (!uploaded || isReuploading) && !isLocked;

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

              {showUploadForm && (
                <div className="space-y-3 pt-2">
                  {/* File Upload Zone */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Upload Document (Any file format: PDF, Word, JPG, PNG, TXT)</Label>
                    <Input
                      type="file"
                      accept="*/*"
                      onChange={(e) => handleFileSelect(doc.docId, e)}
                      className="h-9 bg-background/50 text-xs flex-1 file:bg-primary/20 file:text-primary file:border-0 file:rounded-md file:px-2 file:py-1 cursor-pointer"
                    />
                  </div>

                  {/* Inputs */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">File name</Label>
                    <Input
                      placeholder="document-file-name.pdf"
                      value={draft.fileName}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [doc.docId]: { ...d[doc.docId], fileName: e.target.value },
                        }))
                      }
                      className="h-9 bg-background/50"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="glass"
                      disabled={uploadMutation.isPending || ocrLoading[doc.docId] || !draft.fileName.trim()}
                      onClick={() => handleUpload(doc.docId)}
                    >
                      {uploadMutation.isPending || ocrLoading[doc.docId] ? (
                        <Loader2 className="size-3.5 animate-spin mr-1" />
                      ) : (
                        <Upload className="size-3.5 mr-1" />
                      )}
                      {ocrLoading[doc.docId]
                        ? "Running OCR..."
                        : uploadMutation.isPending
                          ? "Uploading..."
                          : "Upload Document"}
                    </Button>
                    {uploaded && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={uploadMutation.isPending || ocrLoading[doc.docId]}
                        onClick={() => {
                          setReuploading((prev) => ({ ...prev, [doc.docId]: false }));
                          setDrafts((prev) => {
                            const copy = { ...prev };
                            delete copy[doc.docId];
                            return copy;
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {(uploaded || isLocked) && !isReuploading && (
                <div className="bg-muted/10 border border-border/60 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs truncate max-w-[300px]">
                    <span className="font-semibold truncate text-muted-foreground">
                      {doc.fileName || "Not uploaded"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  {uploaded && !isLocked && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-muted"
                      onClick={() => {
                        setReuploading((prev) => ({ ...prev, [doc.docId]: true }));
                        setDrafts((prev) => ({
                          ...prev,
                          [doc.docId]: { fileName: "" }
                        }));
                      }}
                    >
                      Re-upload
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit to Attorney Panel */}
        {complete && !isLocked && !application.submittedToAttorney && (
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-3 mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="size-4" />
              Ready for Attorney Review
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All mandatory documents have been uploaded. Submit your application to <strong>{application.attorneyName || "your attorney"}</strong> to start the formal validation check.
            </p>
            <Button
              variant="gradient"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full sm:w-auto transition-transform active:scale-98"
            >
              {submitMutation.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
              Submit Application to Attorney
            </Button>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
