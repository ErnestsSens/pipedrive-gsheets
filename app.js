import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { weatherAnalyzer } from './weather-analyzer.js';
import { sendDiscordMessage, formatWindForecast } from './discord-messenger.js';
import { config } from './config.js';
import { fetchYrXml } from './weather-api.js';

console.log(`\n📍 Atrašanās vieta: LAT ${config.latitude}, LON ${config.longitude}`);
console.log(`🔧 Sliekšņi: Vēja brāzmas >${config.windGustThreshold} m/s, Vējš >${config.windSpeedThreshold} m/s, Nokrišņi >${config.precipitationThreshold} mm`);
console.log(`🗓️ Šodien: ${new Date().toISOString().split('T')[0]}`);

const testing = true;
const needTestingData = true;

let xmlData;

if (testing) {
  if (needTestingData) {
    const xml = await fetchYrXml();
    fs.writeFileSync('yr-response.xml', xml, 'utf8');
    xmlData = xml;
  } else {
    xmlData = fs.readFileSync('yr-response.xml', 'utf8');
  }
} else {
  xmlData = await fetchYrXml();
}


// Parse XML to JSON
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const data = parser.parse(xmlData);

// Save parsed JSON to file (for inspection/testing)
if (needTestingData) {
  fs.writeFileSync('yr-response-JSON.txt', JSON.stringify(data, null, 2), 'utf8');
}

const results = weatherAnalyzer(data);
const formattedWindResults = formatWindForecast(results);

// ✅ Send formatted message to Discord with wind data
if (!formattedWindResults) {
  console.log('ℹ️ Nav datu par vēju — ziņa netiks sūtīta.\n');
  process.exit(0);
}

sendDiscordMessage(formattedWindResults, config.windUserIds);
