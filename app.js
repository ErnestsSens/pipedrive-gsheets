import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { weatherAnalyzer } from './weather-analyzer.js';
import { sendDiscordMessage, formatWindForecast } from './discord-messenger.js';
import { config } from './config.js';
import { fetchYrXml } from './weather-api.js';

console.log(`📍 Atrašanās vieta: LAT ${config.latitude}, LON ${config.longitude}`);
console.log(`🔧 Sliekšņi: Vēja brāzmas >${config.windGustThreshold} m/s, Vējš >${config.windSpeedThreshold} m/s, Nokrišņi >${config.precipitationThreshold} mm`);
console.log(`🗓️ Šodien: ${new Date().toISOString().split('T')[0]}`);

const xmlData = await fetchYrXml();

// For testing
// const xmlData = fs.readFileSync('yr-response-2025-07-05T19-54-29-873Z.xml', 'utf8');

// Parse XML to JSON
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const data = parser.parse(xmlData);

const finalResults = weatherAnalyzer(data);
const formatted = formatWindForecast(finalResults);

// ✅ Send formatted message to Discord with wind data
if (!formatted) {
  console.log('ℹ️ Nav datu par vēju — ziņa netiks sūtīta.\n');
  process.exit(0); 
}

sendDiscordMessage(formatted, config.windUserIds);
