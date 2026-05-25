import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VisaIQ — Explainable AI for visa decisions" },
      { name: "description", content: "Automate visa decisions with explainable AI. Document parsing, reasoning agents, and audit-ready rule engines for F-1, O-1, B-1, B-2." },
      { property: "og:title", content: "VisaIQ — Explainable AI for visa decisions" },
      { property: "og:description", content: "From document parsing to final approval — intelligent agents that read, reason, and recommend." },
    ],
  }),
  component: Landing,
});
