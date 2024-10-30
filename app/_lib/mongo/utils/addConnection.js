// services/addNewConnection.js
import { connectToDatabase } from '../connection/connection';
import { Connection } from '../models/connection';
export async function addNewConnection(connectionData) {
  await connectToDatabase();

  try {
    const newConnection = new Connection(connectionData);
    const savedConnection = await newConnection.save();
    console.log("Connection added:", savedConnection);
    return savedConnection;
  } catch (error) {
    console.error("Error in addNewConnection:", error);
    throw error;
  }
}