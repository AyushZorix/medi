import mongoose from 'mongoose';
import { runAgentPipeline } from '../server/pipeline.mjs';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";

await mongoose.connect(MONGO_URL);

const ApplicationSchema = new mongoose.Schema({}, { strict: false });
const Application = mongoose.model('Application', ApplicationSchema);

const app = await Application.findOne({ slug: 'abh-o-1-28bf6f' });
if (app) {
  console.log('Running agent pipeline for', app.get('slug'));
  const res = await runAgentPipeline(app);
  console.log('Result:', JSON.stringify(res, null, 2));
} else {
  console.log('App not found');
}

await mongoose.disconnect();
