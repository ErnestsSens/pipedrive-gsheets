import https from 'https';
import { config } from './config.js'; // assume config.apiUrl is defined

/**
 * Fetch raw XML weather data from YR.no API
 * @returns {Promise<string>} XML string
 */
export const fetchYrXml = () => {
  return new Promise((resolve, reject) => {
    const url = new URL(config.apiUrl);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': `WeatherChecker/1.0 (${config.email})`, // required by YR API
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch XML: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`HTTPS error: ${err.message}`));
    });

    req.end();
  });
};
