import { createFileRoute } from "@tanstack/react-router";
import { FileText, Upload, Filter, MoreHorizontal, Download, Eye } from "lucide-react";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlassCard, GlassCardContent } from "@/components/GlassCard";

export const Route = createFileRoute("/app/documents")({
  head: () => ({ meta: [{ title: "Documents — VisaIQ" }] }),
  component: Documents,
});

const docs = [
  { name: "Passport scan", case: "Rohan Patel", visa: "O-1", type: "Identity", pages: 9, status: "approved" as const },
  { name: "I-20 certificate", case: "Amelia Chen", visa: "F-1", type: "Academic", pages: 2, status: "approved" as const },
  { name: "Bank statement", case: "Sofia Marquez", visa: "B-2", type: "Financial", pages: 4, status: "needs_info" as const },
  { name: "Employment letter", case: "Rohan Patel", visa: "O-1", type: "Employment", pages: 1, status: "processing" as const },
  { name: "SEVIS receipt", case: "Daniel Okafor", visa: "F-1", type: "Academic", pages: 1, status: "approved" as const },
  { name: "Travel itinerary", case: "Wei Zhang", visa: "B-2", type: "Travel", pages: 3, status: "approved" as const },
];

function Documents() {
  return (
    <AppPage>
      <PageHeader
        portal="attorney"
        eyebrow="Document library"
        title="All documents"
        description="Unified vault across every case — OCR-ready and fully indexed."
        actions={
          <Button variant="gradient" size="sm">
            <Upload className="size-3.5" /> Upload
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input placeholder="Search documents…" className="h-10 border-border/60 bg-muted/40" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Visa type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All visa types</SelectItem>
            <SelectItem value="f1">F-1</SelectItem>
            <SelectItem value="o1">O-1</SelectItem>
            <SelectItem value="b1">B-1</SelectItem>
            <SelectItem value="b2">B-2</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="size-3.5" /> Filters
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total files", value: "1,284" },
          { label: "OCR complete", value: "98.2%" },
          { label: "Flagged", value: "23" },
        ].map((s) => (
          <GlassCard key={s.label}>
            <GlassCardContent className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-semibold">{s.value}</div>
            </GlassCardContent>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="overflow-hidden p-0">
        <ScrollArea className="h-[min(520px,60vh)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Document</TableHead>
                <TableHead>Case</TableHead>
                <TableHead>Visa</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.name + d.case} className="border-border/30 hover:bg-white/[0.03]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-lg bg-primary/10">
                        <FileText className="size-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.pages} pages</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{d.case}</TableCell>
                  <TableCell>
                    <VisaBadge type={d.visa} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{d.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="size-4" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="size-4" /> Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </GlassCard>
    </AppPage>
  );
}
