import { NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { deleteConnection } from '@/app/_lib/mongo/utils/deleteConnection';
export const GET = withApiAuthRequired(async function deleteDocumentConnection(req) {
    try {
        const session = await getSession(req);
        const userID = session.user.sub;

        // Parse request body for documentID
        const url = new URL(req.url);
        const documentId = url.searchParams.get('documentId');
        if (!documentId) {
            return NextResponse.json(
                { error: 'documentId is required' },
                { status: 400 }
            );
        }

        // Call the deleteConnection function with documentID and userID
        const result = await deleteConnection(documentId, userID);

        // Return the result as a JSON response
        return NextResponse.json(result);

    } catch (error) {
        console.error('Error deleting document connection:', error);
        const status = error.message === 'Unauthorized: You do not have permission to delete this document.'
            ? 403
            : 500;

        return NextResponse.json(
            { error: error.message || 'Failed to delete connection' },
            { status }
        );
    }
});
