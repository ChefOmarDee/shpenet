// services/deleteConnection.js
import { connectToDatabase } from '../connection/connection';
import { Connection } from '../models/connection';

export async function deleteConnection(documentID, userID) {
  await connectToDatabase();

  try {
    console.log("Attempting to delete connection with ID:", documentID);

    // Retrieve the connection document by its ID
    const connection = await Connection.findById(documentID);

    if (!connection) {
      console.error("Connection not found with ID:", documentID);
      throw new Error("Connection not found.");
    }

    // Authorization check: ensure the user's ID matches the document's UID
    if (connection.UID !== userID) {
      console.error("Unauthorized deletion attempt by user:", userID);
      throw new Error("Unauthorized: You do not have permission to delete this document.");
    }

    // Delete the document if authorized
    const deleteResult = await Connection.deleteOne({ _id: documentID });
    console.log("Connection deleted successfully:", deleteResult);

    return { success: true, message: "Connection deleted successfully." };
  } catch (error) {
    console.error("Error in deleteConnection:", error);
    throw error;
  }
}
