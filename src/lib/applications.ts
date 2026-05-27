import { buildClientDocumentChecklist, computeDocumentsSummary } from "./visaDocuments";

export type ApplicationStatus = "approved" | "processing" | "needs_info" | "rejected";
export type VisaType = "F-1" | "O-1" | "B-1" | "B-2" | "B-1/B-2";
export type ApplicantVisaChoice = "F-1" | "O-1" | "B-1/B-2";
export type DocumentStatus = "missing" | "uploaded" | "validated" | "flagged";
export type PipelineStatus = "idle" | "running" | "awaiting_human" | "completed" | "failed";
export type HumanReviewStatus = "pending" | "approved" | "rejected";
export type AiRecommendation = "approve" | "deny" | "needs_info";

export type ApplicationDocument = {
  docId: string;
  label: string;
  required: boolean;
  fileName: string;
  notes: string;
  extractedText: string;
  status: DocumentStatus;
  uploadedAt: string | null;
};

export type ApplicationProgress = {
  documentsReceived: number;
  identityVerification: number;
  financialReview: number;
  finalDecision: number;
};

export type PipelineAgentResult = {
  agent?: string;
  score?: number;
  summary?: string;
  findings?: { type: string; docId?: string; message: string }[];
  issues?: { severity: string; message: string; docId?: string }[];
  recommendation?: AiRecommendation;
  confidence?: number;
  reasons?: string[];
};

export type ApplicationPipeline = {
  status: PipelineStatus;
  ranAt?: string;
  validator?: PipelineAgentResult;
  consistency?: PipelineAgentResult;
  decider?: PipelineAgentResult;
};

export type HumanReview = {
  status: HumanReviewStatus;
  attorneyNotes?: string;
  aiRecommendation?: string;
  reviewedAt?: string;
};

export type Application = {
  id: string;
  slug: string;
  applicantName: string;
  visaType: VisaType;
  phoneNumber: string;
  status: ApplicationStatus;
  score: number;
  updated: string;
  updatedAt?: string;
  progress: ApplicationProgress;
  overallProgress: number;
  documents: ApplicationDocument[];
  documentsSummary: {
    mandatoryTotal: number;
    mandatoryUploaded: number;
    complete: boolean;
  };
  pipeline: ApplicationPipeline;
  humanReview: HumanReview;
  callLog: Record<string, unknown>[];
  canRunPipeline: boolean;
  attorneyUserId: string | null;
  attorneyName: string | null;
  forwardedToAttorney: boolean;
};

export const APPLICANT_VISA_OPTIONS: {
  id: ApplicantVisaChoice;
  title: string;
  description: string;
}[] = [
  {
    id: "F-1",
    title: "F-1 Student",
    description: "Full-time academic study at a SEVP-certified U.S. school.",
  },
  {
    id: "O-1",
    title: "O-1 Extraordinary ability",
    description: "Individuals with extraordinary ability in sciences, arts, education, business, or athletics.",
  },
  {
    id: "B-1/B-2",
    title: "B-1 / B-2 Visitor",
    description: "Short business visits (B-1) or tourism and medical treatment (B-2).",
  },
];

const API_BASE =
  typeof window === "undefined" ? "http://localhost:4000/api" : "/api";

const EMPTY_PROGRESS: ApplicationProgress = {
  documentsReceived: 0,
  identityVerification: 0,
  financialReview: 0,
  finalDecision: 0,
};

/** Normalize API payloads (including legacy records missing new fields) */
export function normalizeApplication(raw: Partial<Application> & Record<string, unknown>): Application {
  const visaType = (raw.visaType as VisaType) || "F-1";
  const documents = buildClientDocumentChecklist(
    visaType,
    Array.isArray(raw.documents) ? (raw.documents as ApplicationDocument[]) : [],
  );
  const documentsSummary =
    raw.documentsSummary && typeof raw.documentsSummary === "object"
      ? {
          mandatoryTotal: Number(raw.documentsSummary.mandatoryTotal) || 0,
          mandatoryUploaded: Number(raw.documentsSummary.mandatoryUploaded) || 0,
          complete: Boolean(raw.documentsSummary.complete),
        }
      : computeDocumentsSummary(documents);

  const pipeline = (raw.pipeline as ApplicationPipeline) || { status: "idle" as const };
  const humanReview = (raw.humanReview as HumanReview) || { status: "pending" as const };

  const progress: ApplicationProgress = {
    documentsReceived:
      raw.progress?.documentsReceived ?? documentsSummary.mandatoryTotal
        ? Math.round((documentsSummary.mandatoryUploaded / documentsSummary.mandatoryTotal) * 100)
        : 0,
    identityVerification: raw.progress?.identityVerification ?? pipeline.validator?.score ?? 0,
    financialReview: raw.progress?.financialReview ?? pipeline.consistency?.score ?? 0,
    finalDecision:
      raw.progress?.finalDecision ??
      (humanReview.status === "approved" || humanReview.status === "rejected"
        ? 100
        : pipeline.status === "awaiting_human"
          ? 50
          : 0),
  };

  const overallProgress =
    typeof raw.overallProgress === "number"
      ? raw.overallProgress
      : Math.round(
          (progress.documentsReceived +
            progress.identityVerification +
            progress.financialReview +
            progress.finalDecision) /
            4,
        );

  const canRunPipeline =
    typeof raw.canRunPipeline === "boolean"
      ? raw.canRunPipeline
      : documentsSummary.complete && pipeline.status !== "running";

  return {
    id: String(raw.id ?? ""),
    slug: String(raw.slug ?? ""),
    applicantName: String(raw.applicantName ?? "Applicant"),
    visaType,
    phoneNumber: String(raw.phoneNumber ?? ""),
    status: (raw.status as ApplicationStatus) || "processing",
    score: typeof raw.score === "number" ? raw.score : 0,
    updated: String(raw.updated ?? "—"),
    updatedAt: raw.updatedAt as string | undefined,
    progress,
    overallProgress,
    documents,
    documentsSummary,
    pipeline,
    humanReview,
    callLog: Array.isArray(raw.callLog) ? raw.callLog : [],
    canRunPipeline,
    attorneyUserId: raw.attorneyUserId ? String(raw.attorneyUserId) : null,
    attorneyName: raw.attorneyName ? String(raw.attorneyName) : null,
    forwardedToAttorney: Boolean(raw.forwardedToAttorney ?? raw.attorneyUserId),
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const data = await parseJson<{ message?: string }>(res);
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return parseJson<T>(res);
}

export async function listApplications(): Promise<Application[]> {
  const data = await apiRequest<{ applications?: Application[] }>("/applications");
  return (data.applications ?? []).map((a) => normalizeApplication(a));
}

export async function getMyApplications(): Promise<Application[]> {
  const data = await apiRequest<{
    applications?: Application[];
    application?: Application;
  }>("/applications/me");

  if (Array.isArray(data.applications)) {
    return data.applications.map((a) => normalizeApplication(a));
  }
  if (data.application) {
    return [normalizeApplication(data.application)];
  }
  return [];
}

export async function startApplication(
  visaType: ApplicantVisaChoice,
  phoneNumber: string,
  attorneyUserId: string,
): Promise<Application> {
  const data = await apiRequest<{ application: Application }>("/applications/start", {
    method: "POST",
    body: JSON.stringify({ visaType, phoneNumber, attorneyUserId }),
  });
  return normalizeApplication(data.application);
}

export async function getApplicationBySlug(slug: string): Promise<Application> {
  const data = await apiRequest<{ application: Application }>(`/applications/${slug}`);
  return normalizeApplication(data.application);
}

export async function uploadDocument(
  slug: string,
  payload: { docId: string; fileName: string; notes?: string },
): Promise<Application> {
  const data = await apiRequest<{ application: Application }>(`/applications/${slug}/documents`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeApplication(data.application);
}

export async function runPipeline(slug: string): Promise<Application> {
  const data = await apiRequest<{ application: Application }>(`/applications/${slug}/pipeline/run`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return normalizeApplication(data.application);
}

export async function submitHumanReview(
  slug: string,
  payload: { approved: boolean; attorneyNotes?: string },
): Promise<{ application: Application; call: Record<string, unknown> }> {
  const data = await apiRequest<{
    application: Application;
    call: Record<string, unknown>;
  }>(`/applications/${slug}/human-review`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    application: normalizeApplication(data.application),
    call: data.call,
  };
}

export function progressSteps(app: Application) {
  const progress = app.progress ?? EMPTY_PROGRESS;
  return [
    { label: "Mandatory documents", val: progress.documentsReceived },
    { label: "Document validation (AI)", val: progress.identityVerification },
    { label: "Consistency check (AI)", val: progress.financialReview },
    { label: "Final decision", val: progress.finalDecision },
  ];
}
