require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const PIPEDRIVE_API_KEY = process.env.PIPEDRIVE_API_KEY;
const PIPEDRIVE_BASE_URL = process.env.PIPEDRIVE_BASE_URL;

// Pielāgoto lauku ID kartējums uz lasāmiem nosaukumiem
const CUSTOM_FIELDS = {
    '86a1fc588c923c430530fdec1b1b2a5fc2d2f926': 'Produkts',
    'b5092c2c117cc38a3d4a61bb6809de9577896c50': 'Vieta',
    'fb10aeee72b7cf0a457fc22dee11c5c037fb4197': 'Dalībnieku skaits',
    'cc1fb341ec0cc21ee9bf3ba9f8299ad7b07a7cbc': 'Cik 10min braucienus vēlas izmantot?',
    '9b5f305015d7f74b68ca16409b1f60030a3f3b1e': 'Pasākuma veids klientam (atpūta, dzimene utt)',
    '3afedc793ac95a0fce29fcfdde4392448d5efaf7': 'Owner (īpašnieks iekš Details)',
    '39632ac9033da77551618f1f02766d0947bdebd4': 'Campaign Source',
    '1ac07917f28d3a1cab6075cde4b3db9d93b8ae00': 'Campaign Medium',
    '1ee85c1647fc878a21575c0c280df316f736a8cb': 'Campaign Name',
    '0908043ad2bfeb643b18dddd62f9257fa63daf87': 'Campaign Term',
    'd410096824022a39dfa2434857191a8ae7271985': 'Campaign Content',
    '2c789a7a891c6c44facd7a2d008573bb30b89aa8': "Reason why didn't close the deal"
};

function formatDealForFile(deal) {
    let output = `=== Darījums ID: ${deal.id} ===\n`;
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
    const filePath = path.join(process.cwd(), filename);
    let fileContent = `Kopējais darījumu skaits: ${deals.length}\nEksporta datums: ${new Date().toISOString()}\n\n`;
    
    deals.forEach(deal => {
        fileContent += formatDealForFile(deal);
    });
    
    try {
        fs.writeFileSync(filePath, fileContent);
        console.log(`✓ Darījumu dati saglabāti: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`✗ Kļūda saglabājot failu: ${error.message}`);
        return false;
    }
}

// Palīgfunkcija, lai droši iegūtu iekļautas vērtības
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
        const limit = 500; // Vienmēr izmantojam maksimālo atļauto lapu izmēru
        let pageCount = 0;

        // Veidojam vaicājuma parametrus
        const baseQueryParams = {
            api_token: PIPEDRIVE_API_KEY,
            limit: limit,
            start: start
        };

        // Pievienojam papildu filtrus, ja tie ir norādīti
        if (options.status) baseQueryParams.status = options.status;
        if (options.user_id) baseQueryParams.user_id = options.user_id;
        if (options.stage_id) baseQueryParams.stage_id = options.stage_id;
        if (options.since) baseQueryParams.start_date = options.since;
        if (options.until) baseQueryParams.end_date = options.until;

        console.log('Iegūstam darījumus ar šādiem filtriem:', JSON.stringify(options));
        
        while (hasMoreItems) {
            pageCount++;
            
            // Atjauninām start parametru katram pieprasījumam
            baseQueryParams.start = start;
            
            console.log(`Iegūstam lapu ${pageCount} ar start=${start}...`);
            
            const response = await axios.get(`${PIPEDRIVE_BASE_URL}/deals`, {
                params: baseQueryParams
            });
            
            const deals = response.data.data || [];
            console.log(`Iegūti ${deals.length} darījumi šajā lapā.`);
            
            if (deals.length === 0) {
                hasMoreItems = false;
            } else {
                // Pievienojam visus darījumus no šīs lapas
                allDeals = [...allDeals, ...deals];
                
                // Pārbaudam, vai ir vairāk vienumu, ko iegūt
                hasMoreItems = response.data.additional_data?.pagination?.more_items_in_collection || false;
                
                // Iegūstam nākamo start vērtību no pagination info
                if (hasMoreItems) {
                    start = response.data.additional_data?.pagination?.next_start || (start + limit);
                    console.log(`Iegūti ${allDeals.length} darījumi līdz šim. Nākamais start: ${start}`);
                    
                    // Pievienojam nelielu aizturi starp pieprasījumiem, lai izvairītos no ierobežojumiem
                    await new Promise(resolve => setTimeout(resolve, 300));
                } else {
                    console.log(`Vairāk darījumu nav. Lapošana pabeigta.`);
                }
            }
        }

        console.log(`Lapošanas kopsavilkums: Iegūti ${allDeals.length} darījumi ${pageCount} lapās.`);
        return allDeals;
    } catch (error) {
        console.error('Kļūda iegūstot darījumus:', error.message);
        if (error.response) {
            console.error('Atbildes statuss:', error.response.status);
            console.error('Atbildes dati:', JSON.stringify(error.response.data));
        }
        return [];
    }
}

// Iegūst filtru vērtības no .env faila
function getFiltersFromEnv() {
    const filters = {};
    
    // Statuss: open, won, lost, deleted
    if (process.env.FILTER_STATUS) filters.status = process.env.FILTER_STATUS;
    
    // Lietotāja ID
    if (process.env.FILTER_USER_ID) filters.user_id = process.env.FILTER_USER_ID;
    
    // Posma ID
    if (process.env.FILTER_STAGE_ID) filters.stage_id = process.env.FILTER_STAGE_ID;
    
    // Sākuma datums (ISO 8601 formātā, piem., 2022-01-01 00:00:00)
    if (process.env.FILTER_SINCE) filters.since = process.env.FILTER_SINCE;
    
    // Beigu datums (ISO 8601 formātā, piem., 2023-01-01 00:00:00)
    if (process.env.FILTER_UNTIL) filters.until = process.env.FILTER_UNTIL;
    
    return filters;
}

async function main() {
    try {
        console.log("Sākam Pipedrive datu eksportu...");
        const startTime = Date.now();
        
        // Iegūstam filtrus no .env faila
        const filters = getFiltersFromEnv();
        
        // Iegūstam darījumus ar filtriem
        const deals = await fetchDeals(filters);
        
        if (deals.length === 0) {
            console.log("❌ Nav atrasts neviens darījums.");
        } else {
            // Saglabājam datus failā ar laika zīmogu
            const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
            const filename = `pipedrive_deals_${timestamp}.txt`;
            
            await saveDealsToFile(deals, filename);
            
            // Izvadām tikai kopsavilkuma informāciju
            console.log(`\n====================`);
            console.log(`Kopā iegūti darījumi: ${deals.length}`);
            console.log(`Process pabeigts ${((Date.now() - startTime) / 1000).toFixed(2)} sekundēs`);
            
            // Statusa sadalījums
            const statusCounts = deals.reduce((counts, deal) => {
                counts[deal.status] = (counts[deal.status] || 0) + 1;
                return counts;
            }, {});
            
            console.log("\nStatusa sadalījums:");
            Object.entries(statusCounts).forEach(([status, count]) => {
                console.log(`- ${status}: ${count} (${((count / deals.length) * 100).toFixed(1)}%)`);
            });
        }
    } catch (error) {
        console.log("⚠️ Kļūda:", error.message);
    }
}

main(); 