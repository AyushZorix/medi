export type VisaType = "F-1" | "O-1" | "B-1" | "B-2" | "B-1/B-2";

export type ApplicationDocument = {
  docId: string;
  label: string;
  required: boolean;
  fileName: string;
  notes: string;
  extractedText: string;
  status: "missing" | "uploaded" | "validated" | "flagged";
  uploadedAt: string | null;
};

const REQUIREMENTS: Record<string, { docId: string; label: string; required: boolean }[]> = {
  "F-1": [
    { docId: "passport", label: "Valid passport (bio page)", required: true },
    { docId: "i20", label: "Form I-20 from SEVP-certified school", required: true },
    { docId: "sevis_fee", label: "SEVIS fee payment receipt (I-901)", required: true },
    { docId: "financial_proof", label: "Bank statements / financial support (last 3 months)", required: true },
    { docId: "transcripts", label: "Academic transcripts & admission letter", required: true },
    { docId: "photo", label: "Passport-style photo (US visa specs)", required: true },
  ],
  "O-1": [
    { docId: "passport", label: "Valid passport (bio page)", required: true },
    { docId: "petition_support", label: "Employer/agent support letter & itinerary", required: true },
    { docId: "awards_press", label: "Evidence of extraordinary ability", required: true },
    { docId: "expert_letters", label: "Expert opinion letters", required: true },
    { docId: "contract", label: "Employment contract or engagement agreement", required: true },
    { docId: "resume", label: "Detailed CV / resume", required: true },
  ],
  "B-1/B-2": [
    { docId: "passport", label: "Valid passport (bio page)", required: true },
    { docId: "ds160", label: "DS-160 confirmation page", required: true },
    { docId: "financial_proof", label: "Proof of funds for trip", required: true },
    { docId: "travel_itinerary", label: "Travel itinerary / invitation letter", required: true },
    { docId: "ties_home", label: "Evidence of ties to home country", required: true },
    { docId: "photo", label: "Passport-style photo (US visa specs)", required: true },
  ],
};

function requirementsFor(visaType: string) {
  if (REQUIREMENTS[visaType]) return REQUIREMENTS[visaType];
  if (visaType === "B-1" || visaType === "B-2") return REQUIREMENTS["B-1/B-2"];
  return [];
}

export function buildClientDocumentChecklist(
  visaType: VisaType | string,
  existing: ApplicationDocument[] = [],
): ApplicationDocument[] {
  const byId = new Map(existing.map((d) => [d.docId, d]));
  return requirementsFor(visaType).map((req) => {
    const ex = byId.get(req.docId);
    if (ex) return ex;
    return {
      docId: req.docId,
      label: req.label,
      required: req.required,
      fileName: "",
      notes: "",
      extractedText: "",
      status: "missing" as const,
      uploadedAt: null,
    };
  });
}

export function computeDocumentsSummary(documents: ApplicationDocument[]) {
  const required = documents.filter((d) => d.required);
  const mandatoryTotal = required.length;
  const mandatoryUploaded = required.filter((d) => d.fileName).length;
  return {
    mandatoryTotal,
    mandatoryUploaded,
    complete: mandatoryTotal > 0 && mandatoryUploaded === mandatoryTotal,
  };
}
