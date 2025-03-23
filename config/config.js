require('dotenv').config();

module.exports = {
    PIPEDRIVE_API_KEY: process.env.API_KEY,
    PIPEDRIVE_BASE_URL: process.env.BASE_URL,
    GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
    GOOGLE_SHEET_NAME: process.env.GOOGLE_SHEET_NAME || 'Deals',
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'service-account.json',
    CUSTOM_FIELDS: {
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
    },
    getFiltersFromEnv: () => {
        const filters = {};
        if (process.env.FILTER_STATUS) filters.status = process.env.FILTER_STATUS;
        if (process.env.FILTER_ID) filters.filter_id = process.env.FILTER_ID;
        if (process.env.FILTER_USER_ID) filters.user_id = process.env.FILTER_USER_ID;
        if (process.env.FILTER_STAGE_ID) filters.stage_id = process.env.FILTER_STAGE_ID;
        if (process.env.FILTER_SINCE) filters.since = process.env.FILTER_SINCE;
        if (process.env.FILTER_UNTIL) filters.until = process.env.FILTER_UNTIL;
        return filters;
    }
};
