import { scanQR } from "@/app/_lib/qr/scanqr";

export async function POST(request) {
  try {
    const { image } = await request.json();
    const link = await scanQR(image);
    console.log(link);
    return new Response(JSON.stringify({ link }), { status: 200 });
  } catch (err) {
    console.error("Error processing QR code:", err);
    return new Response(JSON.stringify({ error: "Error processing QR code" }), { status: 500 });
  }
}
