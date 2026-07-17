import { getFiltersFromEnv } from './config/config.js';
import { fetchDeals } from './lib/pipedrive.js';
import { saveDealsToGoogleSheets } from './lib/sheets.js';
import { log } from './lib/logger.js';

async function main() {
    try {
        log("=".repeat(60));
        log("Starting Pipedrive to Google Sheets export...");
        const startTime = Date.now();

        const filters = getFiltersFromEnv();

        const deals = await fetchDeals(filters);

        if (deals.length === 0) {
            log("❌ No deals found. Check your API credentials and filters.");
        } else {
            const success = await saveDealsToGoogleSheets(deals);
            if (!success) {
                log(`Failed to update Google Sheets. Check logs for more details.`, true);
            }

            const statusCounts = deals.reduce((counts, deal) => {
                counts[deal.status] = (counts[deal.status] || 0) + 1;
                return counts;
            }, {});

            log("Status distribution:");
            Object.entries(statusCounts).forEach(([status, count]) => {
                log(`- ${status}: ${count} (${((count / deals.length) * 100).toFixed(1)}%)`);
            });

            log(`Total deals retrieved: ${deals.length}`);
            log(`Process completed in ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`);
        }
        log("=".repeat(60));
    } catch (error) {
        log(`Critical error: ${error.message}`, true);
        process.exit(1);
    }
}

main();
