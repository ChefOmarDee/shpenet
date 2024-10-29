import { NextResponse } from "next/server";
import { getLinkedInProfile } from "@/app/_lib/linkedin/getconnection";

export async function GET(request) {
  try {
    const data=await getLinkedInProfile("https://www.linkedin.com/in/ethan-prendergast/");
    return NextResponse.json({data}, {status:200});
  } catch (err) {
    console.error("Error processing QR code:", err);
    return new NextResponse.json({ error: "Error processing QR code" }, { status: 500 });
  }
}
