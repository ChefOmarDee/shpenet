// app/api/hi/route.ts

import { NextResponse } from 'next/server';
import { getLinkedInProfile } from '@/app/_lib/linkedin/getconnection';
export async function GET() {
    const data=await getLinkedInProfile("https://www.linkedin.com/in/ethan-prendergast/");
    return NextResponse.json({data}, {status:200});
}
