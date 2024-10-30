// import { NextResponse } from "next/server";
import { getLinkedInProfile } from "@/app/_lib/linkedin/getconnection";

// export async function GET(request) {
//   try {
//     const data=await getLinkedInProfile("https://www.linkedin.com/in/ethan-prendergast/");
//     return NextResponse.json({data}, {status:200});
//   } catch (err) {
//     console.error("Error processing QR code:", err);
//     return new NextResponse.json({ error: "Error processing QR code" }, { status: 500 });
//   }
// }

// app/api/reminders/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { qrCode, hours } = await request.json();

    // Validate the input
    if (!qrCode || !hours || Number(hours) % 1 !== 0) {
      return NextResponse.json(
        { error: "Invalid input. QR code and whole number of hours required." },
        { status: 400 }
      );
    }
    const cleanUrl = qrCode.split('?')[0];
    const data=await getLinkedInProfile(cleanUrl);
    console.log(data);
    return NextResponse.json(
      { 
        message: "Reminder set successfully",
        data: { cleanUrl, hours }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reminder creation error:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}