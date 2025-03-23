const { google } = require('googleapis');
const path = require('path');
const { log } = require('./logger');
const { GOOGLE_SHEETS_ID, GOOGLE_SHEET_NAME, GOOGLE_APPLICATION_CREDENTIALS, CUSTOM_FIELDS } = require('../config/config');
const { formatDealForSheets } = require('../utils/helpers');

async function getGoogleSheetsAuth() {
    log('Authenticating with Google Sheets...');
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(process.cwd(), GOOGLE_APPLICATION_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    log('✓ Authentication with Google Sheets successful.');
    return google.sheets({ version: 'v4', auth: client });
}

async function getSheetId(sheets, sheetName) {
    const response = await sheets.spreadsheets.get({
        spreadsheetId: GOOGLE_SHEETS_ID,
    });

    const sheet = response.data.sheets.find(sheet => sheet.properties.title === sheetName);
    if (!sheet) throw new Error(`Sheet with name "${sheetName}" not found.`);

    return sheet.properties.sheetId;
}

async function saveDealsToGoogleSheets(deals) {
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
        now.setHours(now.getHours() + 2); // add 2 hours offset to local time
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

        const sheetId = await getSheetId(sheets, GOOGLE_SHEET_NAME);

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: GOOGLE_SHEETS_ID,
            resource: {
                requests: [
                    {
                        updateSheetProperties: {
                            properties: {
                                sheetId,
                                gridProperties: {
                                    frozenRowCount: 1
                                }
                            },
                            fields: 'gridProperties.frozenRowCount'
                        }
                    },
                    {
                        setBasicFilter: {
                            filter: {
                                range: {
                                    sheetId,
                                    startRowIndex: 0,
                                    startColumnIndex: 0
                                }
                            }
                        }
                    }
                ]
            }
        });

        log('✓ Enabled Sort & Filter and froze the header row.');

        return true;
    } catch (error) {
        log(`Error saving to Google Sheets: ${error.message}`, true);
        return false;
    }
}

module.exports = { saveDealsToGoogleSheets };