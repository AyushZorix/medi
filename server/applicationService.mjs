import {
  buildDocumentChecklist,
  documentsCompletionRate,
  allMandatoryUploaded,
} from "./visaDocuments.mjs";
import { runAgentPipeline } from "./pipeline.mjs";
import { notifyApplicantByPhone, callApplicantWithCustomScript } from "./calls.mjs";

export function computeProgress(application, documents) {
  const docRate = documentsCompletionRate(documents);
  const pipeline = application.pipeline || {};
  const human = application.humanReview || {};

  const identityVerification = pipeline.validator?.score ?? 0;
  const financialReview = pipeline.consistency?.score ?? 0;

  let finalDecision = 0;
  if (human.status === "approved") finalDecision = 100;
  else if (human.status === "rejected") finalDecision = 100;
  else if (pipeline.status === "awaiting_human") finalDecision = 50;
  else if (pipeline.decider?.recommendation) finalDecision = 30;

  return {
    documentsReceived: docRate,
    identityVerification,
    financialReview,
    finalDecision,
  };
}

export function enrichApplication(application) {
  const documents = buildDocumentChecklist(application.visaType, application.documents);
  const progress = computeProgress(application, documents);
  const values = Object.values(progress);
  const overallProgress = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  const mandatoryTotal = documents.filter((d) => d.required).length;
  const mandatoryUploaded = documents.filter((d) => d.required && d.fileName).length;

  return {
    id: application._id?.toString?.() ?? String(application.id ?? ""),
    slug: application.slug,
    applicantName: application.applicantName,
    visaType: application.visaType,
    phoneNumber: application.phoneNumber || "",
    status: application.status,
    score: application.score ?? 0,
    updated: application.updatedLabel,
    updatedAt: application.updatedAt,
    progress,
    overallProgress,
    documents,
    documentsSummary: {
      mandatoryTotal,
      mandatoryUploaded,
      complete: allMandatoryUploaded(documents),
    },
    pipeline: application.pipeline || { status: "idle" },
    humanReview: application.humanReview || { status: "pending" },
    callLog: application.callLog || [],
    canRunPipeline: allMandatoryUploaded(documents) && application.pipeline?.status !== "running",
    submittedToAttorney: application.submittedToAttorney ?? false,
    submittedAt: application.submittedAt || null,
  };
}

export async function syncApplicationProgress(application) {
  const documents = buildDocumentChecklist(application.visaType, application.documents);
  application.documents = documents;
  application.markModified("documents");

  application.progress = computeProgress(application, documents);
  const p = application.progress;
  application.score = Math.round(
    (p.documentsReceived + p.identityVerification + p.financialReview) / 3,
  );
  application.markModified("progress");
  application.markModified("pipeline");
  application.markModified("humanReview");
  application.updatedLabel = "just now";
  await application.save();
  return application;
}

/** Runs the AI pipeline when all mandatory docs are uploaded and it has not run yet. */
export async function maybeAutoRunPipeline(application) {
  const documents = buildDocumentChecklist(application.visaType, application.documents);
  if (allMandatoryUploaded(documents)) {
    return await runPipelineForApplication(application);
  }
  return application;
}

export async function runPipelineForApplication(application) {
  application.pipeline = { status: "running", ranAt: new Date() };
  application.markModified("pipeline");
  await application.save();

  const pipeline = await runAgentPipeline(application);
  application.pipeline = pipeline;
  application.markModified("pipeline");
  application.status = "needs_info";
  if (pipeline.decider?.recommendation === "approve") {
    application.status = "processing";
  } else if (pipeline.decider?.recommendation === "deny") {
    application.status = "needs_info";
  }

  application.humanReview = {
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    attorneyNotes: "",
  };
  application.markModified("humanReview");

  await syncApplicationProgress(application);
  return application;
}

export async function submitHumanReview(application, { approved, attorneyNotes, attorneyUserId }) {
  const pipeline = application.pipeline || {};
  const aiReasons = pipeline.decider?.reasons || [];

  application.humanReview = {
    status: approved ? "approved" : "rejected",
    reviewedBy: attorneyUserId,
    reviewedAt: new Date(),
    attorneyNotes: attorneyNotes || "",
    aiRecommendation: pipeline.decider?.recommendation,
  };

  application.status = approved ? "approved" : "rejected";
  await syncApplicationProgress(application);

  const callResult = await notifyApplicantByPhone(
    application,
    approved ? "approved" : "rejected",
    [
      ...(aiReasons || []),
      attorneyNotes ? `Attorney note: ${attorneyNotes}` : "",
    ].filter(Boolean),
  );

  application.callLog = [...(application.callLog || []), callResult];
  await application.save();

  return { application, callResult };
}

export async function triggerApplicantCall(application, script) {
  const callResult = await callApplicantWithCustomScript(application, script);
  application.callLog = [...(application.callLog || []), callResult];
  await application.save();
  return application;
}

export { runAgentPipeline, notifyApplicantByPhone, callApplicantWithCustomScript };
