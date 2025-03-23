const { CUSTOM_FIELDS } = require('../config/config');

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

    for (const fieldId of Object.keys(CUSTOM_FIELDS)) {
        row.push(deal[fieldId] || '');
    }

    return row;
}

module.exports = { getNested, formatDealForSheets };
