import { connectToDatabase } from '../connection/connection';
import { Connection } from '../models/connection';

export async function archiveDocument(documentID, userID) {
  await connectToDatabase();

  try {
    console.log("Attempting to mark as reminded the document with ID:", documentID);

    // Retrieve the connection document by its ID
    const connection = await Connection.findById(documentID);

    if (!connection) {
      console.error("Document not found with ID:", documentID);
      throw new Error("Document not found.");
    }

    // Authorization check: ensure the user's ID matches the document's UID
    if (connection.UID !== userID) {
      console.error("Unauthorized attempt to mark as reminded by user:", userID);
      throw new Error("Unauthorized: You do not have permission to update this document.");
    }

    // Update the document to mark it as reminded and set remindTime to null
    const updateResult = await Connection.updateOne(
      { _id: documentID },
      { $set: { reminded: true, remindTime: null } } // Set remindTime to null
    );

    console.log("Document marked as reminded and reminder time cleared successfully:", updateResult);

    return { success: true, message: "Document marked as reminded and reminder time cleared successfully." };
  } catch (error) {
    console.error("Error in archiveDocument:", error);
    throw error;
  }
}
