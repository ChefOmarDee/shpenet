// app/api/hi/route.ts

import { NextResponse } from 'next/server';
// import { getLinkedInProfile } from '@/app/_lib/linkedin/getconnection';
import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0";
export const GET = withApiAuthRequired(async function addconnection(req) {
    const session = await getSession(req);
	const userID = await session.user.sub;
    //user.sub is primary key
	console.log(session.user);
    // const data=await getLinkedInProfile("https://www.linkedin.com/in/ethan-prendergast/");
    return NextResponse.json({status:200});

})
