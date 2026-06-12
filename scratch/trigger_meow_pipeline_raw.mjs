import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { runAgentPipeline } from "../server/pipeline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URL = "mongodb://127.0.0.1:27017";

async function run() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db("medico");
  
  const application = await db.collection("applications").findOne({ slug: "meow-f-1-3922e0" });
  if (!application) {
    console.error("meow application not found in DB");
    await client.close();
    return;
  }
  
  console.log(`Found application for: ${application.applicantName}`);
  console.log("Running AI agent pipeline...");
  
  const pipelineResult = await runAgentPipeline(application);
  
  const docRate = 100; // All 6 uploaded
  const identityVerification = pipelineResult.validator?.score ?? 0;
  const financialReview = pipelineResult.consistency?.score ?? 0;
  const finalDecision = 50; // awaiting_human
  
  const score = Math.round((docRate + identityVerification + financialReview) / 3);
  const status = pipelineResult.decider?.recommendation === "approve" ? "processing" : "needs_info";
  
  const progress = {
    documentsReceived: docRate,
    identityVerification,
    financialReview,
    finalDecision
  };
  
  console.log(`Computed Scores: Validator=${identityVerification}%, Consistency=${financialReview}%, Overall=${score}%`);
  
  const result = await db.collection("applications").updateOne(
    { _id: application._id },
    {
      $set: {
        pipeline: pipelineResult,
        progress: progress,
        score: score,
        status: status,
        updatedLabel: "just now"
      }
    }
  );
  
  console.log("Database update result:", result);
  
  // Reload and verify
  const reloaded = await db.collection("applications").findOne({ slug: "meow-f-1-3922e0" });
  console.log("\nPipeline results successfully saved via raw MongoDB update!");
  console.log(`Overall Score in DB: ${reloaded.score}%`);
  console.log(`Pipeline Status: ${reloaded.pipeline?.status}`);
  console.log(`Validator Score: ${reloaded.pipeline?.validator?.score}%`);
  console.log(`Consistency Score: ${reloaded.pipeline?.consistency?.score}%`);
  console.log(`Decider Recommendation: ${reloaded.pipeline?.decider?.recommendation}`);
  
  await client.close();
}

run().catch(console.error);
