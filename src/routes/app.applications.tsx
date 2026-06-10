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

      <GlassCard className="overflow-hidden p-0 border-border/40 shadow-glow hover:border-primary/30 transition-all duration-300">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent bg-muted/20">
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-4 pl-6">Applicant</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-4">Visa Category</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-4">Processing Status</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-4">AI Score</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground py-4 pr-6">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-base text-muted-foreground">
                  Loading applications queue…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-base text-muted-foreground">
                  No matching applications found.
                </TableCell>
              </TableRow>
            )}
            {filteredRows.map((r) => (
              <TableRow key={r.id} className="border-border/40 hover:bg-muted/30 transition-colors duration-200">
                <TableCell className="py-4 pl-6">
                  <button
                    onClick={() => setSelectedApp(r)}
                    className="flex items-center gap-3 font-bold hover:text-primary text-left text-sm md:text-base transition-colors duration-200 cursor-pointer"
                  >
                    <Avatar className="size-9 border border-border/50">
                      <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
                        {r.applicantName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {r.applicantName}
                  </button>
                </TableCell>
                <TableCell className="py-4">
                  <VisaBadge type={r.visaType} />
                </TableCell>
                <TableCell className="py-4">
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2.5">
                    <ScoreBar value={r.score} className="w-20" />
                    <span className="text-sm tabular-nums text-muted-foreground/90 font-bold">{r.score}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground/95 py-4 pr-6 font-semibold">{r.updated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>

      {/* Case Details Slide-over Sheet */}
      <Sheet open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <SheetContent className="glass border-border/40 w-[550px] sm:max-w-[550px] overflow-y-auto z-50 flex flex-col h-full bg-background text-foreground">
          <SheetHeader className="shrink-0 pb-4 border-b border-border/50 mt-4">
            <SheetTitle className="text-foreground hidden">Applicant Case Profile</SheetTitle>
            <SheetDescription className="hidden">Detailed submitted checklist and calls console</SheetDescription>
          </SheetHeader>
          
          {selectedApp && (
            <div className="flex flex-col h-full space-y-6 pt-2">
              {/* Profile Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-14 border border-border/60">
                    <AvatarFallback className="bg-gradient-primary text-base font-bold text-primary-foreground">
                      {selectedApp.applicantName.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                      {selectedApp.applicantName}
                      <VisaBadge type={selectedApp.visaType} />
                    </h3>
                    <p className="text-sm text-muted-foreground/80 mt-1">
                      Case slug: {selectedApp.slug}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={selectedApp.status} />
                  <Button variant="glass" size="sm" asChild className="h-8 text-xs cursor-pointer px-3">
                    <Link to="/app/applications/$id" params={{ id: selectedApp.slug }}>
                      <ExternalLink className="size-3.5 mr-1" /> View Full Case
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Stats Card */}
              <div className="grid grid-cols-2 gap-4 bg-muted/20 border border-border/40 rounded-xl p-4">
                <div className="text-center border-r border-border/40">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">AI Verification Score</span>
                  <div className="flex items-center justify-center gap-2.5 mt-2">
                    <Brain className="size-5 text-primary animate-pulse" />
                    <strong className="text-xl font-bold text-foreground">{selectedApp.score}%</strong>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Documents Submitted</span>
                  <strong className="text-xl font-bold text-foreground mt-2 block">
                    {selectedApp.documentsSummary?.mandatoryUploaded ?? 0} / {selectedApp.documentsSummary?.mandatoryTotal ?? 0}
                  </strong>
                </div>
              </div>

              {/* Call Section */}
              {selectedApp.phoneNumber ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
                  <h4 className="text-base font-bold flex items-center gap-2 text-primary">
                    <Phone className="size-4.5" /> Call Applicant
                  </h4>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Outbound call script
                    </Label>
                    <Textarea
                      value={callScript}
                      onChange={(e) => setCallScript(e.target.value)}
                      rows={3}
                      className="bg-muted/30 border-border/50 text-sm font-sans leading-relaxed text-foreground rounded-xl"
                    />
                  </div>
                  <Button
                    variant="gradient"
                    className="w-full flex items-center justify-center gap-2 cursor-pointer h-10 text-sm font-semibold"
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
                <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 text-sm font-medium text-muted-foreground">
                  No registered phone number available for outbound calls.
                </div>
              )}

              {/* Documents & OCR List */}
              <div className="flex-1 space-y-4 min-h-0 flex flex-col">
                <h4 className="text-base font-bold flex items-center gap-2 text-foreground shrink-0">
                  <FileText className="size-4.5 text-primary" /> Submitted Documents & OCR Extracted Text
                </h4>
                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-4 pb-6">
                    {selectedApp.documents.map((doc) => {
                      const uploaded = doc.status !== "missing" && Boolean(doc.fileName);
                      return (
                        <div key={doc.docId} className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {uploaded ? (
                                <CheckCircle2 className="size-5 text-success shrink-0" />
                              ) : (
                                <FileText className="size-5 text-muted-foreground shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-bold truncate max-w-[250px]">{doc.label}</p>
                                {uploaded && (
                                  <p className="text-xs text-muted-foreground/80 truncate max-w-[200px] mt-0.5">
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
                            <div className="space-y-2 border-t border-border/40 pt-2">
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                                Extracted text data
                              </span>
                              <div className="bg-muted/20 border border-border/40 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap text-muted-foreground/90 max-h-[160px] overflow-y-auto leading-relaxed select-all">
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
