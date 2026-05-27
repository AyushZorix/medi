/** Mandatory document checklists per applicant visa category */
export const VISA_DOCUMENT_REQUIREMENTS = {
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
    { docId: "awards_press", label: "Evidence of extraordinary ability (awards, press, memberships)", required: true },
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

export function getRequirementsForVisa(visaType) {
  if (VISA_DOCUMENT_REQUIREMENTS[visaType]) {
    return VISA_DOCUMENT_REQUIREMENTS[visaType];
  }
  if (visaType === "B-1" || visaType === "B-2") {
    return VISA_DOCUMENT_REQUIREMENTS["B-1/B-2"];
  }
  return [];
}

export function buildDocumentChecklist(visaType, existingDocs = []) {
  const requirements = getRequirementsForVisa(visaType);
  const byId = new Map((existingDocs || []).map((d) => [d.docId, d]));

  return requirements.map((req) => {
    const existing = byId.get(req.docId);
    if (existing) {
      return {
        docId: req.docId,
        label: req.label,
        required: req.required,
        fileName: existing.fileName || "",
        notes: existing.notes || "",
        extractedText: existing.extractedText || "",
        status: existing.status || (existing.fileName ? "uploaded" : "missing"),
        uploadedAt: existing.uploadedAt || null,
      };
    }
    return {
      docId: req.docId,
      label: req.label,
      required: req.required,
      fileName: "",
      notes: "",
      extractedText: "",
      status: "missing",
      uploadedAt: null,
    };
  });
}

export function documentsCompletionRate(documents) {
  const required = documents.filter((d) => d.required);
  if (required.length === 0) return 0;
  const uploaded = required.filter((d) => d.status !== "missing" && d.fileName);
  return Math.round((uploaded.length / required.length) * 100);
}

export function allMandatoryUploaded(documents) {
  return documents
    .filter((d) => d.required)
    .every((d) => d.status !== "missing" && d.fileName);
}
