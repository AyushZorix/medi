import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  Phone,
  FileText,
  CheckCircle2,
  ExternalLink,
  Brain,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { listApplications, triggerOutboundCall, type Application } from "@/lib/applications";

import { AppPage } from "@/components/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScoreBar } from "@/components/ScoreBar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlassCard } from "@/components/GlassCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/app/applications")({
  head: () => ({ meta: [{ title: "Applications — VisaIQ" }] }),
  component: Applications,
});

function Applications() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [visaFilter, setVisaFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [callScript, setCallScript] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: listApplications,
  });

  // Keep selectedApp updated when rows query invalidates/refreshes
  useEffect(() => {
    if (selectedApp) {
      const updated = rows.find((r) => r.id === selectedApp.id);
      if (updated) {
        setSelectedApp(updated);
      }
    }
  }, [rows, selectedApp]);

  // Update call script when selectedApp changes
  useEffect(() => {
    if (selectedApp) {
      const name = selectedApp.applicantName?.split(" ")[0] || "there";
      const statusText =
        selectedApp.status === "approved"
          ? "approved"
          : selectedApp.status === "rejected"
            ? "not approved at this time"
            : selectedApp.status === "needs_info"
              ? "in need of additional information"
              : "currently processing";

      const scoreText = selectedApp.score > 0
        ? ` with an AI confidence rating of ${selectedApp.score} percent`
        : "";

      setCallScript(
        `Hello ${name}, this is VisaIQ calling to update you on your ${selectedApp.visaType} visa application status. Your application is currently ${statusText}${scoreText}. Please log in to your applicant portal to review any updates. Thank you.`
      );
    }
  }, [selectedApp]);

  const callMutation = useMutation({
    mutationFn: () => triggerOutboundCall(selectedApp!.slug, callScript),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      const mock = data.call?.mock;
      const skipped = data.call?.skipped;
      if (skipped) {
        toast.info(`Call simulated: configure ElevenLabs / Twilio keys to dial ${selectedApp?.phoneNumber}`);
      } else {
        toast.success(
          mock
            ? "Call simulated successfully"
            : "Call placed successfully via ElevenLabs/Twilio!",
        );
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to place call"),
  });

  const filteredRows = rows.filter((r) => {
    const matchesSearch =
      r.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVisa =
      visaFilter === "all" ||
      r.visaType === visaFilter ||
      (visaFilter === "B-1" && r.visaType === "B-1/B-2") ||
      (visaFilter === "B-2" && r.visaType === "B-1/B-2");

    return matchesSearch && matchesVisa;
  });

  return (
    <AppPage>
      <PageHeader portal="attorney" eyebrow="Case management" title="All applications" description="Search, filter, and open any applicant case in your queue." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, case ID, or country…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 border-border/60 bg-muted/40 pl-9"
          />
        </div>
        <Tabs value={visaFilter} onValueChange={setVisaFilter} className="w-auto">
          <TabsList className="glass h-10">
            {(["All", "F-1", "O-1", "B-1", "B-2"] as const).map((t) => (
              <TabsTrigger key={t} value={t === "All" ? "all" : t}>
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="glass" className="h-10 shrink-0">
          <SlidersHorizontal className="size-3.5" /> Filters
        </Button>
      </div>

      <GlassCard className="overflow-hidden p-0 border-white/[0.04] shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.05] hover:bg-transparent bg-white/[0.01]">
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4 pl-6">Applicant</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4">Visa Category</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4">Processing Status</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4">AI Score</TableHead>
              <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4 pr-6">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  Loading applications queue…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No matching applications found.
                </TableCell>
              </TableRow>
            )}
            {filteredRows.map((r) => (
              <TableRow key={r.id} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-200">
                <TableCell className="py-3.5 pl-6">
                  <button
                    onClick={() => setSelectedApp(r)}
                    className="flex items-center gap-3 font-semibold hover:text-primary text-left transition-colors duration-200 cursor-pointer"
                  >
                    <Avatar className="size-8 border border-white/[0.08]">
                      <AvatarFallback className="bg-gradient-primary text-[11px] font-bold text-primary-foreground">
                        {r.applicantName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {r.applicantName}
                  </button>
                </TableCell>
                <TableCell className="py-3.5">
                  <VisaBadge type={r.visaType} />
                </TableCell>
                <TableCell className="py-3.5">
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="py-3.5">
                  <div className="flex items-center gap-2.5">
                    <ScoreBar value={r.score} className="w-16" />
                    <span className="text-xs tabular-nums text-muted-foreground font-medium">{r.score}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground/80 py-3.5 pr-6 font-light">{r.updated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>

      {/* Case Details Slide-over Sheet */}
      <Sheet open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <SheetContent className="glass border-white/10 w-[550px] sm:max-w-[550px] overflow-y-auto z-50 flex flex-col h-full bg-black/95 text-white">
          <SheetHeader className="shrink-0 pb-4 border-b border-white/10 mt-4">
            <SheetTitle className="text-white hidden">Applicant Case Profile</SheetTitle>
            <SheetDescription className="hidden">Detailed submitted checklist and calls console</SheetDescription>
          </SheetHeader>
          
          {selectedApp && (
            <div className="flex flex-col h-full space-y-6 pt-2">
              {/* Profile Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 border border-white/[0.08]">
                    <AvatarFallback className="bg-gradient-primary text-[14px] font-bold text-primary-foreground">
                      {selectedApp.applicantName.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {selectedApp.applicantName}
                      <VisaBadge type={selectedApp.visaType} />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Case slug: {selectedApp.slug}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={selectedApp.status} />
                  <Button variant="glass" size="sm" asChild className="h-7 text-[10px] cursor-pointer">
                    <Link to="/app/applications/$id" params={{ id: selectedApp.slug }}>
                      <ExternalLink className="size-3 mr-1" /> View Full Case
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Stats Card */}
              <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3.5">
                <div className="text-center border-r border-white/5">
                  <span className="text-[10px] text-muted-foreground uppercase block">AI Verification Score</span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Brain className="size-4 text-primary animate-pulse" />
                    <strong className="text-lg font-semibold">{selectedApp.score}%</strong>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-muted-foreground uppercase block">Documents Submitted</span>
                  <strong className="text-lg font-semibold mt-1 block">
                    {selectedApp.documentsSummary?.mandatoryUploaded ?? 0} / {selectedApp.documentsSummary?.mandatoryTotal ?? 0}
                  </strong>
                </div>
              </div>

              {/* Call Section */}
              {selectedApp.phoneNumber ? (
                <div className="bg-primary/5 border border-primary/25 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Phone className="size-4" /> Call Applicant
                  </h4>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Outbound call script
                    </Label>
                    <Textarea
                      value={callScript}
                      onChange={(e) => setCallScript(e.target.value)}
                      rows={3}
                      className="bg-black/30 border-white/10 text-xs font-sans leading-relaxed"
                    />
                  </div>
                  <Button
                    variant="gradient"
                    className="w-full flex items-center justify-center gap-2 cursor-pointer"
                    disabled={callMutation.isPending || !callScript.trim()}
                    onClick={() => callMutation.mutate()}
                  >
                    {callMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin text-primary-foreground mr-1" />
                    ) : (
                      <Phone className="size-4 mr-1 text-primary-foreground animate-pulse" />
                    )}
                    {callMutation.isPending ? "Placing Call..." : `Call ${selectedApp.applicantName} (${selectedApp.phoneNumber})`}
                  </Button>
                </div>
              ) : (
                <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 text-xs text-muted-foreground">
                  No registered phone number available for outbound calls.
                </div>
              )}

              {/* Documents & OCR List */}
              <div className="flex-1 space-y-3 min-h-0 flex flex-col">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-white shrink-0">
                  <FileText className="size-4 text-primary" /> Submitted Documents & OCR Extracted Text
                </h4>
                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-3 pb-6">
                    {selectedApp.documents.map((doc) => {
                      const uploaded = doc.status !== "missing" && Boolean(doc.fileName);
                      return (
                        <div key={doc.docId} className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {uploaded ? (
                                <CheckCircle2 className="size-4 text-success shrink-0" />
                              ) : (
                                <FileText className="size-4 text-muted-foreground shrink-0" />
                              )}
                              <div>
                                <p className="text-xs font-semibold truncate max-w-[250px]">{doc.label}</p>
                                {uploaded && (
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                    File: {doc.fileName}
                                  </p>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={uploaded ? "approved" : "needs_info"}>
                              {uploaded ? "Uploaded" : "Missing"}
                            </StatusBadge>
                          </div>

                          {uploaded && (
                            <div className="space-y-1 border-t border-white/[0.04] pt-2">
                              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                Extracted text data
                              </span>
                              <div className="bg-black/40 border border-white/[0.05] rounded-lg p-2.5 text-xs font-mono whitespace-pre-wrap text-muted-foreground/90 max-h-[140px] overflow-y-auto leading-relaxed select-all">
                                {doc.notes || doc.extractedText || "OCR check has not been run or extracted no text."}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppPage>
  );
}
