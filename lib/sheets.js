import { google } from 'googleapis';
import {
  CUSTOM_FIELDS,
  GOOGLE_APPLICATION_CREDENTIALS,
  GOOGLE_SHEETS_ID,
  GOOGLE_SHEET_NAME
} from '../config/config.js';
import { formatDealForSheets } from '../utils/helpers.js';
import { log } from './logger.js';

async function getGoogleSheetsAuth() {
  log('Authenticating with Google Sheets...');
  const auth = new google.auth.GoogleAuth({
    keyFile: GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  log('✓ Authentication with Google Sheets successful.');
  return google.sheets({ version: 'v4', auth: client });
}

export async function saveDealsToGoogleSheets(deals) {
  try {
    const sheets = await getGoogleSheetsAuth();

    log('Sorting deals...');
    deals.sort((a, b) => new Date(a.add_time) - new Date(b.add_time));

    const headers = [
      'Timestamp', 'ID', 'Add Time', 'Won Time', 'Status', 'Stage ID', 'Stage Change Time',
      'Value', 'Title', 'Person Name', 'Person Email', 'Person Phone',
      ...Object.values(CUSTOM_FIELDS)
    ];

    log(`Preparing ${deals.length} deals for Google Sheets...`);
    // Get the timestamp in YYYY-MM-DD HH:mm format
    const now = new Date();
    now.setHours(now.getHours() + 3); // add 3 hours offset to local time
    const timestamp = now.toISOString().slice(0, 16).replace('T', ' ');


    const rows = [headers, ...deals.map(deal => [timestamp, ...formatDealForSheets(deal)])];

    log(`Clearing existing data from sheet "${GOOGLE_SHEET_NAME}"...`);
    await sheets.spreadsheets.values.clear({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${GOOGLE_SHEET_NAME}!L2:AJ`
    });
    log('✓ Sheet cleared successfully.');

    log(`Writing ${rows.length} rows to Google Sheets... (this may take a while)`);
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${GOOGLE_SHEET_NAME}!L2`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows }
    });

    log(`✓ Successfully updated ${response.data.updatedCells} cells in Google Sheets.`);

    return true;
  } catch (error) {
    log(`Error saving to Google Sheets: ${error.message}`, true);
    return false;
  }
}
