import Jimp from 'jimp';
import QrCodeReader from 'qrcode-reader';

export async function scanQR(imageData) {
  try {
    const buffer = Buffer.from(imageData, 'base64');
    const jimpImage = await Jimp.read(buffer);

    const link = await new Promise((resolve, reject) => {
      const qrReader = new QrCodeReader();
      qrReader.callback = (err, value) => {
        if (err || !value) {
          reject(new Error("Failed to decode QR code"));
        } else {
          resolve(value.result);
        }
      };
      qrReader.decode(jimpImage.bitmap);
    });

    return link;
  } catch (error) {
    throw new Error(`Error processing QR code: ${error.message}`);
  }
}
