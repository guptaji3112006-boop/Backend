import mongoose from "mongoose";
import app from "./app.js";

import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    const connectionDB = await mongoose.connect(`${process.env.MONGODB_URI}`, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(
      `Connected to the database ${connectionDB.connection.host}:${connectionDB.connection.port}`,
    );
  } catch (error) {
    console.log("Error connecting to the database", error);
    process.exit(1);
  }
};

await connectDB();

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`);
});

export default connectDB;
