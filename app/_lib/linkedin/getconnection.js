import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const https = require('https');

export async function getLinkedInProfile(linkedinUrl, hoursUntilRemind, UID, email) {
  const encodedUrl = encodeURIComponent(linkedinUrl);

  const options = {
    method: 'GET',
    hostname: 'linkedin-api8.p.rapidapi.com',
    port: null,
    path: `/get-profile-data-by-url?url=${encodedUrl}`,
    headers: {
      'x-rapidapi-key': process.env.RAPID_KEY,
      'x-rapidapi-host': 'linkedin-api8.p.rapidapi.com'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks);
          const data = JSON.parse(body.toString());
          const cleanData = parseLinkedInProfile(data, hoursUntilRemind, UID, email, linkedinUrl)
          resolve(cleanData);
        } catch (error) {
          reject(new Error('Failed to parse response data'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.end();
  });
}


function parseLinkedInProfile(data, hoursUntilRemind, UID, email, linkedinUrl) {
  try {
    // Basic fields
    const profilePicture = data.profilePicture || '';
    const firstName = data.firstName || '';
    const lastName = data.lastName || '';

    // Primary position details (first position in the array)
    const primaryPosition = data.position?.[0] || {};
    const position = primaryPosition.title || '';
    const companyName = primaryPosition.companyName || '';
    const companyURL = primaryPosition.companyURL || '';

    // Set remindTime to current time + 1 hour as an example
    const remindTime = new Date();
    remindTime.setHours(remindTime.getHours() + hoursUntilRemind);
    
    // Default reminded to false
    const reminded = false;

    return {
      UID,
      email,
      profilePicture,
      firstName,
      lastName,
      position,
      companyName,
      companyURL,
      remindTime,
      reminded,
      linkedinUrl
    };
  } catch (error) {
    throw new Error('Error parsing LinkedIn profile data');
  }
}