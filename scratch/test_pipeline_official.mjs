import mongoose from 'mongoose';
import { runPipelineForApplication } from '../server/applicationService.mjs';

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";
await mongoose.connect(MONGO_URL);

// Replicate official schema
const applicationSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    applicantName: { type: String, required: true, trim: true },
    visaType: {
      type: String,
      enum: ["F-1", "O-1", "B-1", "B-2", "B-1/B-2"],
      required: true,
    },
    status: {
      type: String,
      enum: ["approved", "processing", "needs_info", "rejected"],
      default: "processing",
    },
    score: { type: Number, min: 0, max: 100, default: 0 },
    updatedLabel: { type: String, default: "just now" },
    phoneNumber: { type: String, trim: true, default: "" },
    progress: {
      documentsReceived: { type: Number, default: 0, min: 0, max: 100 },
      identityVerification: { type: Number, default: 0, min: 0, max: 100 },
      financialReview: { type: Number, default: 0, min: 0, max: 100 },
      finalDecision: { type: Number, default: 0, min: 0, max: 100 },
    },
    documents: [
      {
        docId: String,
        label: String,
        required: Boolean,
        fileName: String,
        notes: String,
        extractedText: String,
        status: {
          type: String,
          enum: ["missing", "uploaded", "validated", "flagged"],
          default: "missing",
        },
        uploadedAt: Date,
      },
    ],
    pipeline: {
      status: {
        type: String,
        enum: ["idle", "running", "awaiting_human", "completed", "failed"],
        default: "idle",
      },
      ranAt: Date,
      validator: { type: mongoose.Schema.Types.Mixed, default: null },
      consistency: { type: mongoose.Schema.Types.Mixed, default: null },
      decider: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    humanReview: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      reviewedAt: Date,
      attorneyNotes: { type: String, default: "" },
      aiRecommendation: String,
    },
    callLog: [{ type: mongoose.Schema.Types.Mixed }],
    applicantUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    attorneyUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    submittedToAttorney: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
  },
  { versionKey: false, timestamps: true },
);

// Get or compile model
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

const app = await Application.findOne({ slug: 'abh-o-1-28bf6f' });
if (app) {
  console.log('Original Application details:');
  console.log(`- Score: ${app.score}, Status: ${app.status}`);
  console.log(`- Progress:`, JSON.stringify(app.progress, null, 2));

  console.log('\nRunning runPipelineForApplication...');
  await runPipelineForApplication(app);

  const reloaded = await Application.findOne({ slug: 'abh-o-1-28bf6f' });
  console.log('\nReloaded Application details:');
  console.log(`- Overall Score: ${reloaded.score}, Status: ${reloaded.status}`);
  console.log(`- Progress:`, JSON.stringify(reloaded.progress, null, 2));
  console.log(`- Validator Score: ${reloaded.pipeline?.validator?.score}`);
  console.log(`- Consistency Score: ${reloaded.pipeline?.consistency?.score}`);
} else {
  console.log('App not found');
}

await mongoose.disconnect();
