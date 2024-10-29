const https = require('https');

export async function getLinkedInProfile(linkedinUrl) {
  const encodedUrl = encodeURIComponent(linkedinUrl);
  
  const options = {
    method: 'GET',
    hostname: 'linkedin-api8.p.rapidapi.com',
    port: null,
    path: `/get-profile-data-by-url?url=${encodedUrl}`,
    headers: {
      'x-rapidapi-key': '',
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
          resolve(data);
        } catch (error) {
          reject(new Error('Failed to parse response data'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    // Set a timeout of 10 seconds
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.end();
  });
}

