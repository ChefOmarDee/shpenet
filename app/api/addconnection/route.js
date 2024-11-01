// import { NextResponse } from "next/server";
import { getLinkedInProfile } from "@/app/_lib/linkedin/getconnection";
import { NextResponse } from "next/server";
import { addNewConnection } from "@/app/_lib/mongo/utils/addConnection";
import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0";
export const POST = withApiAuthRequired(async function addconnection(req) {
  const session = await getSession(req);
  const userID = await session.user.sub;
  const userEmail = await session.user.email;
  
  try {
    const { qrCode, hours, notes } = await req.json();

    // Validate the input
    if (!qrCode || !hours || Number(hours) % 1 !== 0) {
      return NextResponse.json(
        { error: "Invalid input. QR code and whole number of hours required." },
        { status: 400 }
      );
    }
    
    const cleanUrl = qrCode.split('?')[0];
    const linkedInData = await getLinkedInProfile(cleanUrl, hours, userID, userEmail);
    
    // Add the LinkedIn URL to the connection data
    const connectionData = {
      ...linkedInData,
      linkedinUrl: cleanUrl,  // Add the LinkedIn URL to the data
      hours: hours,
      userID: userID,
      userEmail: userEmail,
      notes
    };
    console.log(connectionData)
    const newConnection = await addNewConnection(connectionData);
    console.log("New connection added:", newConnection);

    return NextResponse.json(
      { 
        message: "Connection saved successfully",
        data: newConnection
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Connection creation error:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
});