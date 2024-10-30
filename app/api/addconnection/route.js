// import { NextResponse } from "next/server";
import { getLinkedInProfile } from "@/app/_lib/linkedin/getconnection";
import { NextResponse } from "next/server";
import { addNewConnection } from "@/app/_lib/mongo/utils/addConnection";
import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0";
export const POST = withApiAuthRequired(async function addconnection(req) {
  const session = await getSession(req);
  const userID = await session.user.sub
  const userEmail = await session.user.email
  try {
    const { qrCode, hours } = await req.json();

    // Validate the input
    if (!qrCode || !hours || Number(hours) % 1 !== 0) {
      return NextResponse.json(
        { error: "Invalid input. QR code and whole number of hours required." },
        { status: 400 }
      );
    }
    const cleanUrl = qrCode.split('?')[0];
    const data=await getLinkedInProfile(cleanUrl, hours, userID, userEmail);
    console.log(data);
    const newConnection = await addNewConnection(data);
    console.log("New connection added:", newConnection);
    // const deleteCon = await deleteConnection("6721c42ca7c014288c2690fb", userID)
    // console.log(deleteCon)
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
});