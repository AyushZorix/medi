import mongoose from 'mongoose';

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";

await mongoose.connect(MONGO_URL);

const ApplicationSchema = new mongoose.Schema({}, { strict: false });
const Application = mongoose.model('Application', ApplicationSchema);

const app = await Application.findOne({ slug: 'abh-o-1-28bf6f' });
if (app) {
  console.log('Application slug:', app.get('slug'));
  console.log('Visa Type:', app.get('visaType'));
  console.log('Applicant Name:', app.get('applicantName'));
  console.log('Overall Score:', app.get('score'));
  console.log('Pipeline:', JSON.stringify(app.get('pipeline'), null, 2));
  console.log('Documents:');
  for (const doc of (app.get('documents') || [])) {
    console.log(`- docId: ${doc.docId}, fileName: ${doc.fileName}, notes length: ${doc.notes?.length || 0}`);
    console.log(`  notes snippet: ${doc.notes ? doc.notes.substring(0, 100) : 'none'}`);
  }
} else {
  console.log('Application not found');
}

await mongoose.disconnect();
