import mongoose from 'mongoose';
import { computeProgress } from '../server/applicationService.mjs';
import { buildDocumentChecklist } from '../server/visaDocuments.mjs';

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";
await mongoose.connect(MONGO_URL);

const ApplicationSchema = new mongoose.Schema({}, { strict: false });
const Application = mongoose.model('Application', ApplicationSchema);

const app = await Application.findOne({ slug: 'abh-o-1-28bf6f' });
if (app) {
  console.log('App pipeline object:', JSON.stringify(app.pipeline, null, 2));
  const docs = buildDocumentChecklist(app.visaType, app.documents);
  const prog = computeProgress(app, docs);
  console.log('Computed progress:', JSON.stringify(prog, null, 2));
} else {
  console.log('App not found');
}

await mongoose.disconnect();
