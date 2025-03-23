const fs = require('fs');
const path = require('path');
const { log } = require('./logger');
const { CUSTOM_FIELDS } = require('../config/config');
const { getNested } = require('../utils/helpers');

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

async function saveDealsToFile(deals, filename = null) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const defaultFilename = `pipedrive_deals_${timestamp}.txt`;
    const filePath = path.join(process.cwd(), filename || defaultFilename);

    let fileContent = `Total deals count: ${deals.length}\nExport date: ${new Date().toISOString()}\n\n`;

    deals.forEach(deal => {
        fileContent += formatDealForFile(deal);
    });

    try {
        fs.writeFileSync(filePath, fileContent);
        log(`✓ Deal data saved to: ${filePath}`);
        return true;
    } catch (error) {
        log(`Error saving file: ${error.message}`, true);
        return false;
    }
}

module.exports = { saveDealsToFile };
