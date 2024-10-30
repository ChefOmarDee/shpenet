// services/addNewConnection.js
import { connectToDatabase } from '../connection/connection';
import { Connection } from '../models/connection';
export async function addNewConnection(connectionData) {
  await connectToDatabase();

  try {
    console.log("Adding new connection with data:", connectionData);
    const newConnection = new Connection(connectionData);
    const savedConnection = await newConnection.save();
    console.log("Connection saved successfully:", savedConnection);
    return savedConnection;
  } catch (error) {
    console.error("Error in addNewConnection:", error);
    throw error;
  }
}