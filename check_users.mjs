import mongoose from "mongoose";

const MONGO_URL = "mongodb://127.0.0.1:27017/medico";

async function run() {
  await mongoose.connect(MONGO_URL);
  
  const users = await mongoose.connection.db.collection("users").find().toArray();
  const apps = await mongoose.connection.db.collection("applications").find().toArray();
  
  console.log("ALL USERS IN DB:");
  console.log(JSON.stringify(users, null, 2));
  
  console.log("\nALL APPLICATIONS IN DB:");
  console.log(JSON.stringify(apps, null, 2));
  
  await mongoose.disconnect();
}

run().catch(console.error);
