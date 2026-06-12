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
  
  const apps = await mongoose.connection.db.collection("applications").find({ applicantUserId: meowUser._id }).toArray();
  
  console.log("MEOW APPLICATIONS IN DB:");
  apps.forEach(a => {
    console.log(`- Slug: ${a.slug}`);
    console.log(`  Applicant Name: ${a.applicantName}`);
    console.log(`  Visa Type: ${a.visaType}`);
    console.log(`  Score: ${a.score}`);
    if (a.documents) {
      console.log(`  Documents Uploaded: ${a.documents.filter(d => d.fileName).map(d => `${d.docId}: ${d.fileName} (${d.status}) at ${d.uploadedAt}`).join(", ")}`);
    } else {
      console.log("  No documents array");
    }
    if (a.progress) {
      console.log(`  Progress: ${JSON.stringify(a.progress)}`);
    }
    if (a.pipeline) {
      console.log(`  Pipeline Status: ${a.pipeline.status}`);
      console.log(`  Validator Score: ${a.pipeline.validator?.score}`);
      console.log(`  Consistency Score: ${a.pipeline.consistency?.score}`);
      console.log(`  Decider Rec: ${a.pipeline.decider?.recommendation}`);
    }
  });
  
  await mongoose.disconnect();
}

run().catch(console.error);
