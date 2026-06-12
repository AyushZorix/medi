import mongoose from "mongoose";

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";

async function run() {
  await mongoose.connect(MONGO_URL);
  
  const users = await mongoose.connection.db.collection("users").find().toArray();
  const apps = await mongoose.connection.db.collection("applications").find().toArray();
  
  console.log("USERS:");
  users.forEach(u => console.log(`- ID: ${u._id}, Email: ${u.email}, Name: ${u.fullName || u.email}, Role: ${u.role}`));
  
  console.log("\nAPPLICATIONS:");
  apps.forEach(a => {
    console.log(`- Slug: ${a.slug}`);
    console.log(`  Applicant Name: ${a.applicantName}`);
    console.log(`  Applicant User ID: ${a.applicantUserId}`);
    console.log(`  Visa Type: ${a.visaType}`);
    console.log(`  Score: ${a.score}`);
    console.log(`  Documents Uploaded: ${a.documents.filter(d => d.fileName).map(d => `${d.docId}: ${d.fileName}`).join(", ")}`);
    if (a.pipeline) {
      console.log(`  Pipeline Status: ${a.pipeline.status}`);
      console.log(`  Validator Score: ${a.pipeline.validator?.score}`);
      console.log(`  Consistency Score: ${a.pipeline.consistency?.score}`);
      console.log(`  Decider Recommendation: ${a.pipeline.decider?.recommendation}`);
    }
  });
  
  await mongoose.disconnect();
}

run().catch(console.error);
