const axios = require('axios');
const { log } = require('./logger');
const { PIPEDRIVE_API_KEY, PIPEDRIVE_BASE_URL } = require('../config/config');

async function fetchDeals(filters = {}) {
    let allDeals = [];
    let hasMoreItems = true;
    let start = 0;
    const limit = 500;

    const params = { api_token: PIPEDRIVE_API_KEY, limit, ...filters };

    log(`Fetching deals with filters: ${JSON.stringify(filters)}`);

    while (hasMoreItems) {
        params.start = start;
        const response = await axios.get(`${PIPEDRIVE_BASE_URL}/deals`, { params });
        const deals = response.data.data || [];

        allDeals.push(...deals);
        hasMoreItems = response.data.additional_data?.pagination?.more_items_in_collection || false;
        start = response.data.additional_data?.pagination?.next_start || start + limit;

        log(`Fetched ${deals.length} deals, total: ${allDeals.length}`);
        await new Promise(res => setTimeout(res, 300));
    }

    return allDeals;
}

module.exports = { fetchDeals };
