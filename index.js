require('dotenv').config();
const axios = require('axios');
const { google } = require('googleapis');
const path = require('path');

// Fix environment variable names to match .env file
const PIPEDRIVE_API_KEY = process.env.API_KEY;
const PIPEDRIVE_BASE_URL = process.env.BASE_URL;

// Google Sheets configuration
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Deals';

// Custom field ID mapping to readable names
const CUSTOM_FIELDS = {
    '86a1fc588c923c430530fdec1b1b2a5fc2d2f926': 'Product',
    'b5092c2c117cc38a3d4a61bb6809de9577896c50': 'Location',
    'fb10aeee72b7cf0a457fc22dee11c5c037fb4197': 'Number of Participants',
    'cc1fb341ec0cc21ee9bf3ba9f8299ad7b07a7cbc': 'How many 10min rides wants to use?',
    '9b5f305015d7f74b68ca16409b1f60030a3f3b1e': 'Event type for client (leisure, family, etc)',
    '3afedc793ac95a0fce29fcfdde4392448d5efaf7': 'Owner (owner in Details)',
    '39632ac9033da77551618f1f02766d0947bdebd4': 'Campaign Source',
    '1ac07917f28d3a1cab6075cde4b3db9d93b8ae00': 'Campaign Medium',
    '1ee85c1647fc878a21575c0c280df316f736a8cb': 'Campaign Name',
    '0908043ad2bfeb643b18dddd62f9257fa63daf87': 'Campaign Term',
    'd410096824022a39dfa2434857191a8ae7271985': 'Campaign Content',
    '2c789a7a891c6c44facd7a2d008573bb30b89aa8': "Reason why didn't close the deal"
};

// Google Sheets authorization
async function getGoogleSheetsAuth() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS || 'service-account.json'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const client = await auth.getClient();
        return google.sheets({ version: 'v4', auth: client });
    } catch (error) {
        console.error('Error authenticating with Google Sheets:', error.message);
        throw error;
    }
}

// Format deal for Google Sheets (preparing row data)
function formatDealForSheets(deal) {
    const row = [
        deal.id,
        deal.add_time,
        deal.won_time || '',
        deal.status,
        deal.stage_id,
        deal.stage_change_time || '',
        deal.value,
        deal.title,
        getNested(deal, ['person_id', 'name']) || '',
        getNested(deal, ['person_id', 'email', 0, 'value']) || '',
        getNested(deal, ['person_id', 'phone', 0, 'value']) || '',
    ];

    // Add custom fields
    for (const fieldId of Object.keys(CUSTOM_FIELDS)) {
        row.push(deal[fieldId] || '');
    }

    return row;
}

// Save deals to Google Sheets
async function saveDealsToGoogleSheets(deals) {
    if (!GOOGLE_SHEETS_ID) {
        throw new Error('Google Sheets ID is not defined in environment variables');
    }

    try {
        const sheets = await getGoogleSheetsAuth();
        
        // Sort deals by add_time (newest first)
        deals.sort((a, b) => new Date(b.add_time) - new Date(a.add_time));
        
        // Prepare header row
        const headers = [
            'ID', 'Add Time', 'Won Time', 'Status', 'Stage ID', 'Stage Change Time',
            'Value', 'Title', 'Person Name', 'Person Email', 'Person Phone'
        ];
        
        // Add custom field names to headers
        Object.values(CUSTOM_FIELDS).forEach(fieldName => {
            headers.push(fieldName);
        });
        
        // Prepare rows for Google Sheets
        const rows = [headers];
        deals.forEach(deal => {
            rows.push(formatDealForSheets(deal));
        });
        
        // Clear the existing content
        await sheets.spreadsheets.values.clear({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: `${GOOGLE_SHEET_NAME}!A1:Z`
        });
        
        // Write the new data
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: `${GOOGLE_SHEET_NAME}!A1`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: rows
            }
        });
        
        console.log(`✓ ${response.data.updatedCells} cells updated in Google Sheets`);
        return true;
    } catch (error) {
        console.error(`✗ Error saving to Google Sheets: ${error.message}`);
        return false;
    }
}

// Helper function to safely get nested values
function getNested(data, keys, defaultValue = null) {
    let result = data;
    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            return defaultValue;
        }
    }
    return result;
}

async function fetchDeals(options = {}) {
    try {
        let allDeals = [];
        let hasMoreItems = true;
        let start = 0;
        const limit = 500; // Always use the maximum allowed page size
        let pageCount = 0;

        // Build query parameters
        const baseQueryParams = {
            api_token: PIPEDRIVE_API_KEY,
            limit: limit,
            start: start
        };

        // Add additional filters if specified
        if (options.status) baseQueryParams.status = options.status;
        if (options.user_id) baseQueryParams.user_id = options.user_id;
        if (options.stage_id) baseQueryParams.stage_id = options.stage_id;
        if (options.since) baseQueryParams.start_date = options.since;
        if (options.until) baseQueryParams.end_date = options.until;

        console.log('Fetching deals with filters:', JSON.stringify(options));
        
        while (hasMoreItems) {
            pageCount++;
            
            // Update start parameter for each request
            baseQueryParams.start = start;
            
            console.log(`Fetching page ${pageCount} with start=${start}...`);
            
            const response = await axios.get(`${PIPEDRIVE_BASE_URL}/deals`, {
                params: baseQueryParams
            });
            
            const deals = response.data.data || [];
            console.log(`Retrieved ${deals.length} deals on this page.`);
            
            if (deals.length === 0) {
                hasMoreItems = false;
            } else {
                // Add all deals from this page
                allDeals = [...allDeals, ...deals];
                
                // Check if there are more items to fetch
                hasMoreItems = response.data.additional_data?.pagination?.more_items_in_collection || false;
                
                // Get the next start value from pagination info
                if (hasMoreItems) {
                    start = response.data.additional_data?.pagination?.next_start || (start + limit);
                    console.log(`Retrieved ${allDeals.length} deals so far. Next start: ${start}`);
                    
                    // Add a small delay between requests to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 300));
                } else {
                    console.log(`No more deals. Pagination complete.`);
                }
            }
        }

        console.log(`Pagination summary: Retrieved ${allDeals.length} deals in ${pageCount} pages.`);
        return allDeals;
    } catch (error) {
        console.error('Error fetching deals:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data));
        }
        return [];
    }
}

// Get filter values from .env file
function getFiltersFromEnv() {
    const filters = {};
    
    // Status: open, won, lost, deleted
    if (process.env.FILTER_STATUS) filters.status = process.env.FILTER_STATUS;
    
    // User ID
    if (process.env.FILTER_USER_ID) filters.user_id = process.env.FILTER_USER_ID;
    
    // Stage ID
    if (process.env.FILTER_STAGE_ID) filters.stage_id = process.env.FILTER_STAGE_ID;
    
    // Start date (ISO 8601 format, e.g., 2022-01-01 00:00:00)
    if (process.env.FILTER_SINCE) filters.since = process.env.FILTER_SINCE;
    
    // End date (ISO 8601 format, e.g., 2023-01-01 00:00:00)
    if (process.env.FILTER_UNTIL) filters.until = process.env.FILTER_UNTIL;
    
    return filters;
}

async function main() {
    try {
        console.log("Starting Pipedrive data export...");
        const startTime = Date.now();
        
        // Get filters from .env file
        const filters = getFiltersFromEnv();
        
        // Get deals with filters
        const deals = await fetchDeals(filters);
        
        if (deals.length === 0) {
            console.log("❌ No deals found.");
        } else {
            // Save deals to Google Sheets
            try {
                await saveDealsToGoogleSheets(deals);
            } catch (error) {
                console.log(`⚠️ Failed to save to Google Sheets: ${error.message}`);
                console.log("Saving data to a file as a fallback...");
                
                // Fallback to saving to file if Google Sheets fails
                const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
                const filename = `pipedrive_deals_${timestamp}.txt`;
                await saveDealsToFile(deals, filename);
            }
            
            // Output summary information
            console.log(`\n====================`);
            console.log(`Total deals retrieved: ${deals.length}`);
            console.log(`Process completed in ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`);
            
            // Status distribution
            const statusCounts = deals.reduce((counts, deal) => {
                counts[deal.status] = (counts[deal.status] || 0) + 1;
                return counts;
            }, {});
            
            console.log("\nStatus distribution:");
            Object.entries(statusCounts).forEach(([status, count]) => {
                console.log(`- ${status}: ${count} (${((count / deals.length) * 100).toFixed(1)}%)`);
            });
        }
    } catch (error) {
        console.log("⚠️ Error:", error.message);
    }
}

// Keeping the original file saving function as a fallback
function formatDealForFile(deal) {
    let output = `=== Deal ID: ${deal.id} ===\n`;
    output += `add_time: ${deal.add_time}\n`;
    output += `won_time: ${deal.won_time}\n`;
    output += `status: ${deal.status}\n`;
    output += `stage_id: ${deal.stage_id}\n`;
    output += `stage_change_time: ${deal.stage_change_time}\n`;
    output += `value: ${deal.value}\n`;
    output += `title: ${deal.title}\n`;

    output += `person_id.name: ${getNested(deal, ['person_id', 'name'])}\n`;
    output += `person_id.email: ${getNested(deal, ['person_id', 'email', 0, 'value'])}\n`;
    output += `person_id.phone: ${getNested(deal, ['person_id', 'phone', 0, 'value'])}\n`;

    for (const [fieldId, label] of Object.entries(CUSTOM_FIELDS)) {
        const value = deal[fieldId];
        output += `${label} (${fieldId}): ${value}\n`;
    }
    
    output += "\n";
    return output;
}

async function saveDealsToFile(deals, filename = 'deals.txt') {
    const fs = require('fs');
    const filePath = path.join(process.cwd(), filename);
    let fileContent = `Total deals count: ${deals.length}\nExport date: ${new Date().toISOString()}\n\n`;
    
    deals.forEach(deal => {
        fileContent += formatDealForFile(deal);
    });
    
    try {
        fs.writeFileSync(filePath, fileContent);
        console.log(`✓ Deal data saved to: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`✗ Error saving file: ${error.message}`);
        return false;
    }
}

main(); 