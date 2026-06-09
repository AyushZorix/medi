import { useState, type ChangeEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listApplications } from "@/lib/applications";
import {
  FileText,
  Upload,
  Filter,
  MoreHorizontal,
  Download,
  Eye,
  Sparkles,
  RefreshCcw,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileUp,
} from "lucide-react";
import { toast } from "sonner";

import { AppPage } from "@/components/AppPage";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, VisaBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
} from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import { analyzeDocumentOcr, type OcrAnalysisResult } from "@/utils/documentOcr";

export const Route = createFileRoute("/app/documents")({
  head: () => ({ meta: [{ title: "Documents — VisaIQ" }] }),
  component: Documents,
});

const statusMap: Record<string, "approved" | "needs_info" | "rejected" | "processing"> = {
  uploaded: "processing",
  validated: "approved",
  flagged: "rejected",
  missing: "needs_info",
};

const statusLabelMap: Record<string, string> = {
  uploaded: "Uploaded",
  validated: "Validated",
  flagged: "Flagged",
  missing: "Missing",
};

function Documents() {
  const [activeTab, setActiveTab] = useState<"library" | "ocr">("library");
  const [search, setSearch] = useState("");
  const [visaTypeFilter, setVisaTypeFilter] = useState("all");

  const { data: applications = [], isLoading: loadingApps } = useQuery({
    queryKey: ["applications"],
    queryFn: listApplications,
  });

  // Flatten all documents that have been uploaded
  const allDocs = applications.flatMap((app) => {
    return (app.documents ?? [])
      .filter((doc) => doc.fileName) // Only show uploaded files
      .map((doc) => ({
        id: `${app.id}-${doc.docId}`,
        name: doc.label,
        fileName: doc.fileName,
        case: app.applicantName,
        visa: app.visaType,
        type: doc.required ? "Mandatory" : "Optional",
        notes: doc.notes,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        applicationSlug: app.slug,
      }));
  });

  const filteredDocs = allDocs.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.case.toLowerCase().includes(search.toLowerCase()) ||
      d.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesVisa = visaTypeFilter === "all" || d.visa === visaTypeFilter;
    return matchesSearch && matchesVisa;
  });

  const totalFiles = allDocs.length;
  const ocrDoneCount = allDocs.filter((d) => d.notes || d.status === "validated").length;
  const ocrPercentage = totalFiles > 0 ? `${Math.round((ocrDoneCount / totalFiles) * 100)}%` : "100%";
  const flaggedCount = allDocs.filter((d) => d.status === "flagged").length;

  const dynamicMetrics = [
    { label: "Total files", value: String(totalFiles) },
    { label: "OCR complete", value: ocrPercentage },
    { label: "Flagged", value: String(flaggedCount) },
  ];

  // OCR workspace states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<OcrAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setAnalysis(null);
    setError("");
    setCopied(false);
  };

  const handleRunOcr = async () => {
    if (!selectedFile) {
      setError("Choose an image scan before running OCR.");
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const result = await analyzeDocumentOcr(selectedFile);
      setAnalysis(result);
      toast.success("OCR processing complete!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "OCR failed.";
      setError(message);
      setAnalysis(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setError("");
    setCopied(false);
  };

  const handleCopyText = async () => {
    const text = analysis?.bestRotation.text;
    if (!text) return;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Recognized text copied to clipboard!");
  };

  const handleDownloadCorrectedImage = () => {
    const imageUrl = analysis?.bestRotation.imageUrl;
    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `upright-document-${analysis.bestRotation.angle}.jpg`;
    link.click();
  };

  return (
    <AppPage className="space-y-6">
      <PageHeader
        portal="attorney"
        eyebrow="Document library"
        title="Documents Vault"
        description="Unified storage and verification workspace — run AI OCR and orientation correction scans."
      />

      {/* Tabs */}
      <div className="flex border-b border-border/20">
        <button
          onClick={() => setActiveTab("library")}
          className={cn(
            "pb-3 text-sm font-medium px-4 border-b-2 transition-colors cursor-pointer",
            activeTab === "library"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Document Library
        </button>
        <button
          onClick={() => setActiveTab("ocr")}
          className={cn(
            "pb-3 text-sm font-medium px-4 border-b-2 transition-colors cursor-pointer",
            activeTab === "ocr"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          OCR Workspace
        </button>
      </div>

      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Search documents by name or case..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 border-border/60 bg-muted/40"
              />
            </div>
            <Select value={visaTypeFilter} onValueChange={setVisaTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Visa type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All visa types</SelectItem>
                <SelectItem value="F-1">F-1</SelectItem>
                <SelectItem value="O-1">O-1</SelectItem>
                <SelectItem value="B-1/B-2">B-1/B-2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {dynamicMetrics.map((s) => (
              <GlassCard key={s.label}>
                <GlassCardContent className="p-4">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-2xl font-semibold">{s.value}</div>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="overflow-hidden p-0 border-border/40 shadow-glow">
            <ScrollArea className="h-[min(520px,60vh)]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent bg-muted/20">
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4 pl-6">Document Name</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4">Applicant Case</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4">Visa Category</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4">Type</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4">Verification</TableHead>
                    <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 py-4 pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingApps ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                        Loading documents library...
                      </TableCell>
                    </TableRow>
                  ) : filteredDocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                        No uploaded documents found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocs.map((d) => (
                      <TableRow key={d.id} className="border-border/40 hover:bg-muted/30 transition-colors duration-200">
                        <TableCell className="py-3 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 place-items-center rounded-xl border border-border bg-muted/20 text-primary">
                              <FileText className="size-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm max-w-[240px] truncate" title={d.name}>
                                {d.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground/80 max-w-[240px] truncate mt-0.5" title={d.fileName}>
                                {d.fileName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Link
                            to="/app/applications/$id"
                            params={{ id: d.applicationSlug }}
                            className="font-semibold hover:text-primary transition-colors text-primary"
                          >
                            {d.case}
                          </Link>
                        </TableCell>
                        <TableCell className="py-3">
                          <VisaBadge type={d.visa} />
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="secondary" className="bg-muted/30 hover:bg-muted/40 text-xs font-light text-muted-foreground border border-border/40 rounded-full px-2 py-0.5">{d.type}</Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <StatusBadge status={statusMap[d.status] ?? "processing"}>
                            {statusLabelMap[d.status] ?? d.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right py-3 pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-muted rounded-lg">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass">
                              <DropdownMenuItem asChild className="focus:bg-muted cursor-pointer">
                                <Link to="/app/applications/$id" params={{ id: d.applicationSlug }}>
                                  <Eye className="size-4 mr-2" /> View Case
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </GlassCard>
        </div>
      )}

      {activeTab === "ocr" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Workspace Controls */}
          <div className="lg:col-span-1 space-y-4">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="text-base">Scan Workspace</GlassCardTitle>
                <GlassCardDescription className="text-xs">
                  Runs 4-way rotation checks and text recognition directly in your browser.
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                  <Label htmlFor="ocr-upload-input" className="text-xs font-semibold">
                    Upload Scanned Image
                  </Label>
                  <Input
                    id="ocr-upload-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="h-10 bg-background/50 file:bg-primary/20 file:text-primary file:border-0 file:rounded-md file:px-2 file:py-1 cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Supported formats: PNG, JPG, JPEG, WebP. Convert PDF/DOCX pages to images first.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleRunOcr}
                    disabled={!selectedFile || loading}
                    className="flex-1"
                    variant="gradient"
                  >
                    {loading ? (
                      <RotateCw className="size-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="size-4 mr-2" />
                    )}
                    {loading ? "Processing..." : "Run OCR"}
                  </Button>
                  <Button
                    onClick={handleReset}
                    disabled={!selectedFile && !analysis && !error}
                    variant="outline"
                  >
                    <RefreshCcw className="size-4 mr-1" /> Reset
                  </Button>
                </div>

                {error && (
                  <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg flex items-center gap-2 border border-destructive/20 mt-3">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>

            {analysis && (
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="text-sm font-semibold">Rotation Benchmark</GlassCardTitle>
                  <GlassCardDescription className="text-[10px]">
                    Evaluations for each orientation angle based on dictionary density and character clarity.
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent className="pt-0 space-y-2">
                  {analysis.rotations.map((r) => {
                    const isBest = r.angle === analysis.bestRotation.angle;
                    return (
                      <div
                        key={r.angle}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg text-xs border transition-colors",
                          isBest
                            ? "bg-success/10 border-success/30 text-success"
                            : "bg-muted/10 border-border/10 text-muted-foreground"
                        )}
                      >
                        <span className="font-medium">{r.angle}° Orientation</span>
                        <div className="text-right">
                          <span className="font-semibold block text-[11px]">Score: {r.score.toFixed(1)}</span>
                          <span className="text-[9px] opacity-80">{r.confidence.toFixed(1)}% confidence</span>
                        </div>
                      </div>
                    );
                  })}
                </GlassCardContent>
              </GlassCard>
            )}
          </div>

          {/* OCR Result Viewers */}
          <div className="lg:col-span-2 space-y-4">
            <GlassCard className="h-full flex flex-col">
              <GlassCardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b border-border/10">
                <div>
                  <GlassCardTitle className="text-base">Extracted Results</GlassCardTitle>
                  <GlassCardDescription className="text-xs">
                    Automated rotation alignment output and recognized content.
                  </GlassCardDescription>
                </div>
                {analysis ? (
                  <StatusBadge status="approved">Ready</StatusBadge>
                ) : (
                  <StatusBadge status="processing">Awaiting Scan</StatusBadge>
                )}
              </GlassCardHeader>
              <GlassCardContent className="flex-1 p-0 flex flex-col divide-y divide-border/10">
                {analysis ? (
                  <>
                    {/* Header stats */}
                    <div className="p-4 grid grid-cols-3 gap-4 text-center bg-muted/10">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase">Corrected Angle</span>
                        <strong className="text-lg font-semibold">{analysis.bestRotation.angle}°</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase">Rotation Score</span>
                        <strong className="text-lg font-semibold">{analysis.bestRotation.score.toFixed(1)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase">Confidence</span>
                        <strong className="text-lg font-semibold">{analysis.bestRotation.confidence.toFixed(1)}%</strong>
                      </div>
                    </div>

                    {/* Previews and texts */}
                    <div className="p-4 grid gap-4 md:grid-cols-2 flex-1">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Corrected Image</Label>
                        <div className="border border-border/20 rounded-lg overflow-hidden bg-black/40 h-[300px] flex items-center justify-center relative group">
                          <img
                            src={analysis.bestRotation.imageUrl}
                            alt="Corrected orientation"
                            className="max-h-full max-w-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="glass" onClick={handleDownloadCorrectedImage}>
                              <Download className="size-3.5 mr-1" /> Download
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 flex flex-col h-[300px]">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Extracted Text</Label>
                          <Button size="icon" variant="ghost" className="size-7" onClick={handleCopyText}>
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                        <div className="border border-border/20 rounded-lg bg-black/20 p-3 text-xs font-mono overflow-y-auto flex-1 text-muted-foreground whitespace-pre-wrap leading-relaxed select-all">
                          {analysis.bestRotation.text || "No readable text was detected."}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-[400px] space-y-2">
                    <FileUp className="size-8 text-muted-foreground/40 animate-pulse" />
                    <p className="text-sm font-medium">No document uploaded yet</p>
                    <p className="text-xs max-w-sm">
                      Upload a scanned image and run the OCR rotation check on the left panel to begin.
                    </p>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      )}
    </AppPage>
  );
}

