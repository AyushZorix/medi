import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { runPipelineForApplication } from "../server/applicationService.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";

async function run() {
  await mongoose.connect(MONGO_URL);
  
  const ApplicationSchema = new mongoose.Schema({}, { strict: false });
  const Application = mongoose.model("Application", ApplicationSchema);
  
  const application = await Application.findOne({ slug: "meow-f-1-3922e0" });
  if (!application) {
    console.error("meow application not found in DB");
    await mongoose.disconnect();
    return;
  }
  
  console.log(`Found application for: ${application.get("applicantName")}`);
  console.log("Triggering verification pipeline...");
  
  await runPipelineForApplication(application);
  
  // Reload and verify the saved score
  const reloaded = await Application.findOne({ slug: "meow-f-1-3922e0" });
  console.log("\nPipeline finished successfully!");
  console.log(`Overall Score in DB: ${reloaded.get("score")}%`);
  console.log(`Pipeline Status: ${reloaded.get("pipeline")?.status}`);
  console.log(`Validator Score: ${reloaded.get("pipeline")?.validator?.score}%`);
  console.log(`Consistency Score: ${reloaded.get("pipeline")?.consistency?.score}%`);
  console.log(`Decider Recommendation: ${reloaded.get("pipeline")?.decider?.recommendation}`);
  
  await mongoose.disconnect();
}

run().catch(console.error);
