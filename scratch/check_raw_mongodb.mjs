import { MongoClient } from 'mongodb';

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";
const client = new MongoClient(MONGO_URL);

try {
  await client.connect();
  const db = client.db('medico');
  const collection = db.collection('applications');
  const doc = await collection.findOne({ slug: 'abh-o-1-28bf6f' });
  if (doc) {
    console.log('Raw MongoDB doc:');
    console.log(JSON.stringify(doc, null, 2));
  } else {
    console.log('Doc not found in raw MongoDB');
  }
} finally {
  await client.close();
}
