import dotenv from "";
import path from "path";
import mongoose from "mongoose";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export async function connectToDatabase() {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("Connected to MongoDB with Mongoose");
	} catch (error) {
		console.error("Error connecting to MongoDB:", error);
	}
}
