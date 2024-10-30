// app/details/[documentId]/page.jsx
import { Connection } from '@/app/_lib/mongo/models/connection';
import { connectToDatabase } from '@/app/_lib/mongo/connection/connection';
// Connect to the database if not already connected and retrieve document
async function getDocumentData(documentId) {
  await connectToDatabase();

  try {
    // Find the document by ID and return selected fields
    const document = await Connection.findById(documentId).select(
      'firstName lastName companyName companyURL profilePicture'
    );
    return document; // Returns the document object if found, null otherwise
  } catch (error) {
    console.error("Error retrieving document data:", error);
    return null;
  }
}

export default async function DocumentDetails({ params }) {
  const { documentId } = params;

  // Retrieve the document data
  const document = await getDocumentData(documentId);

  if (!document) {
    return <h1>Document not found or invalid ID</h1>;
  }

  // Destructure fields from the document object
  const { firstName, lastName, companyName, companyURL, profilePicture } = document;

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Details for {firstName} {lastName}</h1>
      
      {profilePicture && (
        <img
          src={profilePicture}
          alt={`${firstName} ${lastName}'s profile`}
          style={{ borderRadius: '50%', width: '150px', height: '150px', margin: '10px 0' }}
        />
      )}
      
      <p>
        Works at: 
        <a href={companyURL} target="_blank" rel="noopener noreferrer">
          {companyName}
        </a>
      </p>
    </div>
  );
}
