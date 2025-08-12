import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { weatherAnalyzer } from './weather-analyzer.js';
import { sendDiscordMessage, formatWindForecast, formatPrecipForecast } from './discord-messenger.js';
import { config } from './config.js';
import { fetchYrXml } from './weather-api.js';
import { log } from './helpers.js';

console.log('='.repeat(60));
const startTime = Date.now();

log(`📍 Atrašanās vieta: LAT ${config.latitude}, LON ${config.longitude}`);
log(`🔧 Sliekšņi: Vēja brāzmas >${config.windGustThreshold} m/s, Vējš >${config.windSpeedThreshold} m/s, Nokrišņi >${config.precipitationThreshold} mm, Super lieli nokrišņi >${config.superHighPrecipitationThreshold} mm`);
log(`🗓️ Šodien: ${new Date().toISOString().split('T')[0]}`);

const testing = false;
const needTestingData = false;

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

const { finalWindResults: windResults, resultsPrecipitation, resultsSuperHighPrecipitation } = weatherAnalyzer(data);
const formattedWindResults = formatWindForecast(windResults);
const formattedPrecipResults = formatPrecipForecast(resultsPrecipitation);
const formattedSuperHighPrecipResults = formatPrecipForecast(resultsSuperHighPrecipitation, true);

// ✅ Send formatted message to Discord with wind data
const shouldSendWind = !!formattedWindResults; // !! in JavaScript are used to convert any value to a strict boolean (true or false).
const shouldSendPrecip = !!formattedPrecipResults;
const shouldSendSHPrecip = !!formattedSuperHighPrecipResults;

if (!shouldSendWind) {
  log('ℹ️ Nav datu par vēju — ziņa netiks sūtīta.');
}
if (!shouldSendPrecip) {
  log('ℹ️ Nav datu par nokrišņiem — ziņa netiks sūtīta.');
}
if (!shouldSendSHPrecip) {
  log('ℹ️ Nav datu par SUPER LIELIEM nokrišņiem — ziņa netiks sūtīta.');
}

if (!shouldSendWind && !shouldSendPrecip && !shouldSendSHPrecip) process.exit(0);

if (shouldSendWind) await sendDiscordMessage(formattedWindResults, config.windUserIds);
if (shouldSendPrecip) await sendDiscordMessage(formattedPrecipResults, config.precipitationUserIds);
if (shouldSendSHPrecip) await sendDiscordMessage(formattedSuperHighPrecipResults, config.superHighPrecipitationUserIds);

log(`Process completed in ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`, '\n' + '='.repeat(60));