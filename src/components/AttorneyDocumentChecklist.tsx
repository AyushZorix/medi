import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Sparkles, AlertTriangle, RefreshCcw, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { uploadDocument, type Application } from "@/lib/applications";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { analyzeDocumentOcr } from "@/utils/documentOcr";

type AttorneyDocumentChecklistProps = {
  application: Application;
};

function getMockOcrText(docId: string, applicantName: string, visaType: string): string {
  const firstName = applicantName.split(" ")[0] || "Applicant";
  const lastName = applicantName.split(" ").slice(1).join(" ") || "Name";
  
  switch (docId) {
    case "passport":
      return `PASSPORT\nType: P\nCountry Code: USA\nPassport No: ${Math.floor(100000000 + Math.random() * 900000000)}\nSurname: ${lastName.toUpperCase()}\nGiven Names: ${firstName.toUpperCase()}\nNationality: UNITED STATES OF AMERICA\nDate of Birth: 12 OCT 1995\nSex: M\nPlace of Birth: CALIFORNIA, USA\nDate of Issue: 18 APR 2021\nDate of Expiration: 17 APR 2031\nAuthority: United States Department of State`;
      
    case "petition_support":
      return `PETITION FOR ${visaType} NONIMMIGRANT WORKER\nPetitioner: TechCorp Inc.\nBeneficiary: ${applicantName}\nClassification: ${visaType} Alien of Extraordinary Ability\nItinerary: June 2026 to June 2029\nDetailed achievements in agentic workflows and AI software development. Standard extraordinary credentials criteria met.`;
      
    case "financial_proof":
      return `CHASE BANK STATEMENT\nAccount Holder: ${applicantName}\nStatement Period: May 1 to May 31, 2026\nBeginning Balance: $84,102.50\nEnding Balance: $92,450.00\nDeposits: $12,400.00\nWithdrawals: $4,052.50\nMonthly average balance is steady and demonstrates sufficient financial support.`;
      
    case "awards_press":
      return `CERTIFICATE OF ACHIEVEMENT\nPresented to: ${applicantName}\nAward: National AI Innovation Award 2025\nFor outstanding contributions to AI agent architectures and automation pipelines.\nSilicon Valley AI Coalition.`;
      
    case "expert_letters":
      return `RECOMMENDATION LETTER\nTo: U.S. Citizenship and Immigration Services\nSubject: Expert support letter for ${applicantName} (${visaType} Visa)\nFrom: Dr. Sarah Jenkins, Director of AI Research at Stanford\nI am writing to express my strongest support for Mr./Ms. ${lastName}'s extraordinary ability petition. His/Her work on agentic code reasoning is of international significance.`;
      
    case "contract":
      return `EMPLOYMENT AGREEMENT\nEmployer: TechCorp Inc., 100 Innovation Way, San Francisco, CA\nEmployee: ${applicantName}\nPosition: Principal AI Software Engineer\nSalary: $185,000 per annum\nTerm: Full-time starting June 15, 2026\nSigned by both parties.`;
      
    case "resume":
      return `${applicantName.toUpperCase()}\nEmail: ${firstName.toLowerCase()}@visaiq.demo\nExperience:\n- Principal AI Software Engineer, TechCorp (2024-Present)\n- Senior Software Engineer, Google (2021-2024)\nEducation:\n- Master of Science in Computer Science, Stanford University (Graduation: June 2021)`;
      
    case "i20":
      return `Form I-20\nCertificate of Eligibility for Nonimmigrant Student Status\nSEVIS ID: N000123456\nSurname: ${lastName}\nGiven Name: ${firstName}\nSchool Name: Stanford University\nProgram of Study: Computer Science\nLevel of Education: Master's\nStart Date: September 20, 2021\nEstimated average Program costs: $75,000/year`;
      
    default:
      return `DOCUMENT TYPE: ${docId.toUpperCase()}\nApplicant: ${applicantName}\nVisa Category: ${visaType}\nVerified document metadata scan. All security features present and verified.`;
  }
}

export function AttorneyDocumentChecklist({ application }: AttorneyDocumentChecklistProps) {
  const queryClient = useQueryClient();
  const [ocrLoading, setOcrLoading] = useState<Record<string, boolean>>({});
  const [editableNotes, setEditableNotes] = useState<Record<string, string>>({});
  const [draftFiles, setDraftFiles] = useState<Record<string, File>>({});

  const saveMutation = useMutation({
    mutationFn: ({ docId, fileName, notes }: { docId: string; fileName: string; notes: string }) =>
      uploadDocument(application.slug, { docId, fileName, notes, extractedText: notes }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["application", application.slug] });
      toast.success("Document text saved successfully");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  const handleRunOcr = async (docId: string, currentFileName: string) => {
    const selectedFile = draftFiles[docId];
    setOcrLoading((prev) => ({ ...prev, [docId]: true }));
    
    try {
      let ocrText = "";
      let fileName = currentFileName;

      if (selectedFile) {
        fileName = selectedFile.name;
        if (selectedFile.type.startsWith("image/")) {
          toast.info(`Running Tesseract OCR on ${selectedFile.name}...`);
          const result = await analyzeDocumentOcr(selectedFile);
          ocrText = result.bestRotation.text || "";
          toast.success("OCR text extracted successfully!");
        } else if (selectedFile.type.startsWith("text/")) {
          ocrText = await selectedFile.text();
          toast.success("Text read successfully!");
        } else {
          toast.error("Unsupported file type. Use PNG, JPG, WebP, or TXT.");
          setOcrLoading((prev) => ({ ...prev, [docId]: false }));
          return;
        }
      } else {
        // Only generate mock check text as a demo fallback if no file is provided
        toast.info("No local file selected, generating mock valid check text...");
        ocrText = getMockOcrText(docId, application.applicantName, application.visaType);
      }

      setEditableNotes((prev) => ({ ...prev, [docId]: ocrText }));
      
      await saveMutation.mutateAsync({
        docId,
        fileName,
        notes: ocrText,
      });
      
      toast.success("AI OCR scan and text extraction complete!");
    } catch (err) {
      console.error(err);
      toast.error("OCR scan failed");
    } finally {
      setOcrLoading((prev) => ({ ...prev, [docId]: false }));
    }
  };

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="text-base">Submitted documents & OCR</GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4 pt-0">
        {application.documents.map((doc) => {
          const uploaded = doc.status !== "missing" && Boolean(doc.fileName);
          const loading = ocrLoading[doc.docId];
          const hasOcrText = Boolean(doc.notes);
          
          // Get the current notes value (prefer unsaved local edits if exist, otherwise DB notes)
          const currentNotesValue = editableNotes[doc.docId] !== undefined ? editableNotes[doc.docId] : (doc.notes || "");
          const isSaveDisabled = saveMutation.isPending || currentNotesValue === (doc.notes || "");

          return (
            <div
              key={doc.docId}
              className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{doc.label}</p>
                    {uploaded && (
                      <p className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                        File: {doc.fileName}
                      </p>
                    )}
                  </div>
                </div>
                {uploaded ? (
                  <StatusBadge status="approved">Uploaded</StatusBadge>
                ) : (
                  <StatusBadge status="needs_info">Missing</StatusBadge>
                )}
              </div>

              {uploaded && (
                <div className="space-y-3 pt-1">
                  {/* File selection for OCR scanning */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Select local file to run actual OCR scan (Optional)
                    </Label>
                    <Input
                      type="file"
                      accept="image/*,text/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          setDraftFiles((prev) => ({ ...prev, [doc.docId]: file }));
                        }
                      }}
                      className="h-8 bg-background/50 text-[11px] file:bg-primary/20 file:text-primary file:border-0 file:rounded-md file:px-2 file:py-0.5 cursor-pointer"
                    />
                  </div>

                  {/* OCR control row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {hasOcrText ? (
                        <span className="text-success inline-flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" />
                          OCR Scan Complete
                        </span>
                      ) : (
                        "No OCR text extracted yet"
                      )}
                    </span>
                    
                    <Button
                      size="sm"
                      variant="gradient"
                      disabled={loading || saveMutation.isPending}
                      onClick={() => handleRunOcr(doc.docId, doc.fileName)}
                      className="h-8 text-xs cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Sparkles className="size-3.5 mr-1.5" />
                      )}
                      {loading ? "Scanning..." : hasOcrText ? "Re-run OCR" : "Run OCR"}
                    </Button>
                  </div>

                  {/* Extracted Text Editor */}
                  {(hasOcrText || loading) && (
                    <div className="space-y-2 border-t border-border/10 pt-3">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Extracted text (Editable)
                      </Label>
                      {loading ? (
                        <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg flex items-center gap-2 border border-border/20">
                          <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                          <span>Running AI document verification scan and text extraction...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Textarea
                            value={currentNotesValue}
                            onChange={(e) => setEditableNotes(prev => ({ ...prev, [doc.docId]: e.target.value }))}
                            rows={4}
                            className="bg-background/50 text-xs font-mono leading-relaxed"
                          />
                          <Button
                            size="sm"
                            variant="glass"
                            disabled={isSaveDisabled}
                            onClick={() => saveMutation.mutate({
                              docId: doc.docId,
                              fileName: doc.fileName,
                              notes: currentNotesValue,
                            })}
                            className="h-8 text-xs"
                          >
                            {saveMutation.isPending ? (
                              <Loader2 className="size-3.5 animate-spin mr-1.5" />
                            ) : (
                              <Save className="size-3.5 mr-1.5" />
                            )}
                            Save Text Changes
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </GlassCardContent>
    </GlassCard>
  );
}
