import mongoose from 'mongoose';

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";

await mongoose.connect(MONGO_URL);

const ApplicationSchema = new mongoose.Schema({}, { strict: false });
const Application = mongoose.model('Application', ApplicationSchema);

const apps = await Application.find({});
console.log(`Found ${apps.length} applications:`);
for (const app of apps) {
  console.log(`- Slug: ${app.get('slug')}, Name: ${app.get('applicantName')}, Visa: ${app.get('visaType')}, Score: ${app.get('score')}, Status: ${app.get('status')}`);
  const pipeline = app.get('pipeline') || {};
  console.log(`  Pipeline Status: ${pipeline.status}`);
  if (pipeline.validator) {
    console.log(`  Validator Score: ${pipeline.validator.score}`);
  }
  if (pipeline.consistency) {
    console.log(`  Consistency Score: ${pipeline.consistency.score}`);
  }
}

await mongoose.disconnect();
