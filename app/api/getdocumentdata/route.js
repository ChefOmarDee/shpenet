import { NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { getDetails } from '@/app/_lib/mongo/utils/getDetails';

export const GET = withApiAuthRequired(async function getDocumentDetails(req) {
    try {
        const session = await getSession(req);
        const userID = session.user.sub;

        // Parse query parameter for documentId
        const url = new URL(req.url);
        const documentId = url.searchParams.get('documentId');
        if (!documentId) {
            return NextResponse.json(
                { error: 'documentId is required' },
                { status: 400 }
            );
        }

        // Retrieve document data using the utility function
        const documentData = await getDetails(documentId, userID);
        console.log(documentData)
        // Return the retrieved document data as JSON response
        return NextResponse.json({ document: documentData });

    } catch (error) {
        console.error('Error fetching document details:', error);
        const status = error.message === 'Unauthorized: You do not have permission to view this document.'
            ? 403
            : 500;

        return NextResponse.json(
            { error: error.message || 'Failed to fetch document details' },
            { status }
        );
    }
});
