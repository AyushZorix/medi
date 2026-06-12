import mongoose from 'mongoose';
import { runAgentPipeline } from '../server/pipeline.mjs';
import { syncApplicationProgress } from '../server/applicationService.mjs';

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";
await mongoose.connect(MONGO_URL);

const ApplicationSchema = new mongoose.Schema({}, { strict: false });
const Application = mongoose.model('Application', ApplicationSchema);

const app = await Application.findOne({ slug: 'abh-o-1-28bf6f' });
if (app) {
  console.log('Original Application details:');
  console.log(`- Score: ${app.get('score')}, Status: ${app.get('status')}`);

  // Simulate attorney running OCR for all documents
  const docs = app.get('documents') || [];
  for (const doc of docs) {
    if (doc.fileName) {
      doc.status = 'uploaded';
      // Mock the OCR text using the O-1 format
      if (doc.docId === 'passport') {
        doc.notes = `PASSPORT\nType: P\nCountry Code: USA\nSurname: BHANDARI\nGiven Names: ABHI\nNationality: USA\nSex: M`;
      } else if (doc.docId === 'petition_support') {
        doc.notes = `PETITION FOR O-1 NONIMMIGRANT WORKER\nPetitioner: TechCorp Inc.\nBeneficiary: abhi\nClassification: O-1 Alien of Extraordinary Ability\nItinerary: June 2026 to June 2029`;
      } else if (doc.docId === 'financial_proof') {
        doc.notes = `CHASE BANK STATEMENT\nAccount Holder: abhi\nStatement Period: May 2026\nEnding Balance: $92,450.00`;
      } else if (doc.docId === 'awards_press') {
        doc.notes = `CERTIFICATE OF ACHIEVEMENT\nPresented to: abhi\nAward: National AI Innovation Award 2025`;
      } else if (doc.docId === 'expert_letters') {
        doc.notes = `RECOMMENDATION LETTER\nSubject: Expert support letter for abhi (O-1 Visa)\nFrom: Dr. Sarah Jenkins\nI support Mr. abhi's petition.`;
      } else if (doc.docId === 'contract') {
        doc.notes = `EMPLOYMENT AGREEMENT\nEmployer: TechCorp Inc.\nEmployee: abhi\nSalary: $185,000 per annum`;
      } else if (doc.docId === 'resume') {
        doc.notes = `ABHI\nEmail: abhi@visaiq.demo\nExperience:\n- Principal AI Software Engineer, TechCorp (2024-Present)\n- Senior Software Engineer, Google (2021-2024)\nEducation:\n- Master of Science, Stanford University (Graduation: June 2021)`;
      } else {
        doc.notes = `DOCUMENT TYPE: ${doc.docId}\nApplicant: abhi\nVisa: O-1`;
      }
    }
  }

  app.set('documents', docs);
  app.markModified('documents');
  await app.save();

  console.log('\nRunning agent pipeline with mocked OCR text...');
  const res = await runAgentPipeline(app);
  
  app.set('pipeline', res);
  app.set('status', res.decider?.recommendation === 'approve' ? 'processing' : 'needs_info');
  app.markModified('pipeline');
  await app.save();

  await syncApplicationProgress(app);

  // Reload from database to verify save
  const reloaded = await Application.findOne({ slug: 'abh-o-1-28bf6f' });
  console.log('\nReloaded Application details:');
  console.log(`- Overall Score: ${reloaded.get('score')}, Status: ${reloaded.get('status')}`);
  console.log(`- Progress:`, JSON.stringify(reloaded.get('progress'), null, 2));
  console.log(`- Validator Score: ${reloaded.get('pipeline')?.validator?.score}`);
  console.log(`- Consistency Score: ${reloaded.get('pipeline')?.consistency?.score}`);
} else {
  console.log('App not found');
}

await mongoose.disconnect();
