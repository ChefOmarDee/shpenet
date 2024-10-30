// services/addNewConnection.js
const { connectToDatabase } = require('../connection/connection');
const { Connection } = require('../models/connectionModel');

// Fetch LinkedIn profile data
export async function getLinkedInProfile(linkedinUrl, hoursUntilRemind) {
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
          const cleanData = parseLinkedInProfile(data, hoursUntilRemind)
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


// Parse LinkedIn profile data to required fields
function parseLinkedInProfile(data, hoursUntilRemind) {
  try {
    const UID = data?.data?.id || '';
    const email = ''; // Not available in LinkedIn response
    const profilePicture = data?.data?.profilePicture || '';
    const firstName = data?.data?.firstName || '';
    const lastName = data?.data?.lastName || '';

    const primaryPosition = data?.data?.position?.[0] || {};
    const position = primaryPosition?.title || '';
    const companyName = primaryPosition?.companyName || '';
    const companyURL = primaryPosition?.companyURL || '';

    const remindTime = new Date();
    remindTime.setHours(remindTime.getHours() + hoursUntilRemind);

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
    };
  } catch (error) {
    throw new Error('Error parsing LinkedIn profile data');
  }
}