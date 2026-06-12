import mongoose from 'mongoose';
import { runAgentPipeline } from '../server/pipeline.mjs';

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";
await mongoose.connect(MONGO_URL);

// Replicate official schema
const applicationSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    applicantName: { type: String, required: true, trim: true },
    visaType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "processing",
    },
    score: { type: Number, default: 0 },
    updatedLabel: { type: String, default: "just now" },
    phoneNumber: { type: String, trim: true, default: "" },
    progress: {
      documentsReceived: { type: Number, default: 0 },
      identityVerification: { type: Number, default: 0 },
      financialReview: { type: Number, default: 0 },
      finalDecision: { type: Number, default: 0 },
    },
    documents: [
      {
        docId: String,
        label: String,
        required: Boolean,
        fileName: String,
        notes: String,
        extractedText: String,
        status: String,
        uploadedAt: Date,
      },
    ],
    pipeline: {
      status: { type: String, default: "idle" },
      ranAt: Date,
      validator: { type: mongoose.Schema.Types.Mixed, default: null },
      consistency: { type: mongoose.Schema.Types.Mixed, default: null },
      decider: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    humanReview: {
      status: { type: String, default: "pending" },
    },
  },
  { versionKey: false, timestamps: true }
);

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

async function runTest() {
  console.log("Starting test for generic scoring logic...");

  // Let's create a mock application for a new user: "John Smith" applying for "F-1" visa.
  const appData = {
    slug: "john-smith-temp",
    applicantName: "John Smith",
    visaType: "F-1",
    status: "processing",
    score: 0,
    documents: [
      { docId: "passport", label: "Passport", required: true, fileName: "", extractedText: "", status: "missing", uploadedAt: null },
      { docId: "i20", label: "Form I-20", required: true, fileName: "", extractedText: "", status: "missing", uploadedAt: null },
      { docId: "sevis_fee", label: "SEVIS Receipt", required: true, fileName: "", extractedText: "", status: "missing", uploadedAt: null },
      { docId: "financial_proof", label: "Financial Proof", required: true, fileName: "", extractedText: "", status: "missing", uploadedAt: null },
      { docId: "transcripts", label: "Transcripts", required: true, fileName: "", extractedText: "", status: "missing", uploadedAt: null },
      { docId: "photo", label: "Photo", required: true, fileName: "", extractedText: "", status: "missing", uploadedAt: null },
    ]
  };

  // Clean up any existing temp app
  await Application.deleteMany({ slug: "john-smith-temp" });

  console.log("\n--- Scenario 1: Documents Uploaded in Correct Checklist Order ---");
  // Upload passport first, then I-20, then SEVIS, then financial, then transcripts, then photo
  const now = Date.now();
  const docsInOrder = appData.documents.map((d, index) => {
    return {
      ...d,
      fileName: `${d.docId}.pdf`,
      status: "uploaded",
      extractedText: `Document for John Smith. Type: ${d.docId}. Identifiers: passport num, sevis id.`,
      uploadedAt: new Date(now + index * 1000) // strictly increasing timestamps
    };
  });

  const appInOrder = new Application({
    ...appData,
    documents: docsInOrder
  });

  const resInOrder = await runAgentPipeline(appInOrder);
  console.log(`Validator Score: ${resInOrder.validator.score}% (Expected: >= 85%)`);
  console.log(`Consistency Score: ${resInOrder.consistency.score}% (Expected: >= 85%)`);
  console.log(`Decider Confidence: ${resInOrder.decider.confidence}% (Expected: >= 85%)`);
  console.log(`AI Recommendation: ${resInOrder.decider.recommendation} (Expected: approve)`);

  console.log("\n--- Scenario 2: Documents Uploaded Out of Checklist Order ---");
  // Upload transcripts first, then Passport (strictly out of order)
  const docsOutOfOrder = appData.documents.map((d, index) => {
    // Reverse the upload timestamps relative to requirements order
    const reverseIndex = appData.documents.length - 1 - index;
    return {
      ...d,
      fileName: `${d.docId}.pdf`,
      status: "uploaded",
      extractedText: `Document for John Smith. Type: ${d.docId}. Identifiers: passport num, sevis id.`,
      uploadedAt: new Date(now + reverseIndex * 1000)
    };
  });

  const appOutOfOrder = new Application({
    ...appData,
    documents: docsOutOfOrder
  });

  const resOutOfOrder = await runAgentPipeline(appOutOfOrder);
  console.log(`Validator Score: ${resOutOfOrder.validator.score}% (Expected: < 85%)`);
  console.log(`Consistency Score: ${resOutOfOrder.consistency.score}% (Expected: < 85%)`);
  console.log(`Decider Confidence: ${resOutOfOrder.decider.confidence}% (Expected: < 85%)`);
  console.log(`AI Recommendation: ${resOutOfOrder.decider.recommendation} (Expected: needs_info)`);

  console.log("\n--- Scenario 3: Identity/Name Mismatch (Upload Daleep's files for John Smith) ---");
  const docsMismatch = appData.documents.map((d, index) => {
    return {
      ...d,
      fileName: `${d.docId}.pdf`,
      status: "uploaded",
      extractedText: `Document for Daleep Singh. Type: ${d.docId}. Identifiers: passport num, sevis id.`,
      uploadedAt: new Date(now + index * 1000)
    };
  });

  const appMismatch = new Application({
    ...appData,
    documents: docsMismatch
  });

  const resMismatch = await runAgentPipeline(appMismatch);
  console.log(`Validator Score: ${resMismatch.validator.score}% (Expected: ~20%)`);
  console.log(`Consistency Score: ${resMismatch.consistency.score}% (Expected: ~15%)`);
  console.log(`Decider Confidence: ${resMismatch.decider.confidence}% (Expected: ~17%)`);
  console.log(`AI Recommendation: ${resMismatch.decider.recommendation} (Expected: deny)`);

  // Clean up
  await Application.deleteMany({ slug: "john-smith-temp" });
}

try {
  await runTest();
} catch (err) {
  console.error("Error running test:", err);
} finally {
  await mongoose.disconnect();
}
