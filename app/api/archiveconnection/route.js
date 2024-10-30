import { NextResponse } from 'next/server';
import { archiveDocument } from '@/app/_lib/mongo/utils/archive';
import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0";

export const GET = withApiAuthRequired(async function archiveConnection(req) {
  try {
    // Get the user's session
    const session = await getSession(req);
    const userID = session.user.sub;

    // Parse the query parameters to get the document ID
    const url = new URL(req.url);
    const documentId = url.searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    // Call the archiveDocument function to mark it as reminded
    const result = await archiveDocument(documentId, userID);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error archiving document:", error);
    return NextResponse.json(
      { error: 'Failed to archive document' },
      { status: 500 }
    );
  }
});
