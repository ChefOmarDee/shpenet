import { NextResponse } from 'next/server';
import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { connectToDatabase } from '@/app/_lib/mongo/connection/connection';
import { Connection } from '@/app/_lib/mongo/models/connection';

export const GET = withApiAuthRequired(async function getReminders(req) {
    try {
        const session = await getSession(req);
        const userID = session.user.sub;
        // Get query parameters
        const url = new URL(req.url);
        const status = url.searchParams.get('status') || 'active';
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '5');
        console.log(status, page, limit)
        await connectToDatabase();
        
        // Build query based on status
        const query = {
            UID: userID,
            reminded: status !== 'inactive'
        };
        
        // Get total count for pagination
        const total = await Connection.countDocuments(query);

        // Get paginated results, now sorted by createdAt in descending order
        const reminders = await Connection.find(query)
            .sort({ createdAt: -1 }) // Changed from remindTime: 1 to createdAt: -1
            .skip((page - 1) * limit)
            .limit(limit);
        console.log(userID)
        console.log(reminders)
        return NextResponse.json({
            reminders,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: page
            }
        });
        
    } catch (error) {
        console.error('Error fetching reminders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reminders' },
            { status: 500 }
        );
    }
});