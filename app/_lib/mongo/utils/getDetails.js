// utils/getDetails.js
import { connectToDatabase } from '../connection/connection';
import { Connection } from '../models/connection';
export async function getDetails(documentId, userId) {
  await connectToDatabase();

  try {
    // Find the document by its ID
    const document = await Connection.findById(documentId);

    // Check if the document exists
    if (!document) {
      throw new Error("Document not found.");
    }

    // Authorization check: ensure the user's ID matches the document's UID
    if (document.UID !== userId) {
      throw new Error("Unauthorized: You do not have permission to view this document.");
    }

    // Return document data if authorized
    return {
      firstName: document.firstName,
      lastName: document.lastName,
      position: document.position,
      companyName: document.companyName,
      companyURL: document.companyURL,
      profilePicture: document.profilePicture,
      createdAt: document.createdAt,
      remindTime: document.remindTime,
      reminded: document.reminded,
      linkedinUrl: document.linkedinUrl
    };
  } catch (error) {
    console.error("Error in getDetails:", error);
    throw error;
  }
}
