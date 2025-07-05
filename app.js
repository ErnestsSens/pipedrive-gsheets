import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { weatherAnalyzer } from './weather-analyzer.js';
import { sendDiscordMessage, formatWindForecast } from './discord-messenger.js';
import { config } from './config.js';
import { fetchYrXml } from './weather-api.js';

const xmlData = await fetchYrXml();

// For testing
// const xmlData = fs.readFileSync('yr-response-2025-07-05T19-54-29-873Z.xml', 'utf8');

// Parse XML to JSON
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const data = parser.parse(xmlData);

const finalResults = weatherAnalyzer(data);
const formatted = formatWindForecast(finalResults);

// ✅ Send formatted message to Discord with wind data
sendDiscordMessage(formatted, config.windUserIds);
