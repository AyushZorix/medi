import mongoose from "mongoose";

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";

async function run() {
  await mongoose.connect(MONGO_URL);
  
  const meowUser = await mongoose.connection.db.collection("users").findOne({ email: "meow@g.com" });
  if (!meowUser) {
    console.error("meow user not found");
    await mongoose.disconnect();
    return;
  }
  
  const application = await mongoose.connection.db.collection("applications").findOne({ applicantUserId: meowUser._id });
  if (!application) {
    console.error("meow application not found");
    await mongoose.disconnect();
    return;
  }
  
  console.log(`Resetting application for: ${application.applicantName} (${application.slug})`);
  
  // Reset checklist documents to default missing state
  const resetDocs = application.documents.map(d => ({
    docId: d.docId,
    label: d.label,
    required: d.required,
    fileName: "",
    notes: "",
    extractedText: "",
    status: "missing",
    uploadedAt: null
  }));
  
  const resetProgress = {
    documentsReceived: 0,
    identityVerification: 0,
    financialReview: 0,
    finalDecision: 0
  };
  
  const resetPipeline = {
    status: "idle",
    ranAt: null,
    validator: null,
    consistency: null,
    decider: null
  };
  
  const resetHumanReview = {
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    attorneyNotes: ""
  };
  
  const result = await mongoose.connection.db.collection("applications").updateOne(
    { _id: application._id },
    {
      $set: {
        documents: resetDocs,
        progress: resetProgress,
        pipeline: resetPipeline,
        humanReview: resetHumanReview,
        score: 0,
        status: "processing",
        submittedToAttorney: false,
        submittedAt: null
      }
    }
  );
  
  console.log("Database update result:", result);
  console.log("meow application successfully reset.");
  
  await mongoose.disconnect();
}

run().catch(console.error);
