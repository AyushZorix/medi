import mongoose from 'mongoose';

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";
await mongoose.connect(MONGO_URL);

const ApplicationSchema = new mongoose.Schema({}, { strict: false });
const Application = mongoose.model('Application', ApplicationSchema);

const app = await Application.findOne({ slug: 'abh-o-1-28bf6f' });
if (app) {
  console.log('Database verification details (RAW JSON):');
  console.log(JSON.stringify(app.toObject(), null, 2));
} else {
  console.log('App not found');
}

await mongoose.disconnect();
