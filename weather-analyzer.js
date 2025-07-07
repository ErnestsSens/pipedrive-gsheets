import { config } from './config.js';
import { addDays, differenceInHours } from 'date-fns';

export const weatherAnalyzer = (data) => {

  const resultsWind = [];
  const resultsPrecipitation = [];
  const resultsSuperHighPrecipitation = [];

  const startDate = data.weatherdata.meta.model.from;
  const toPrecipitation = addDays(startDate, config.precipitationDaysAhead);

  data.weatherdata.product.time.forEach(entry => {
    const from = entry.from;
    const to = entry.to;
    const location = entry.location;

    const gust = location?.windGust?.mps ? parseFloat(location.windGust.mps) : null;
    const wind = location?.windSpeed?.mps ? parseFloat(location.windSpeed.mps) : null;

    const precValue = location?.precipitation?.value ? parseFloat(location.precipitation.value) : null;
    const precMinValue = location?.precipitation?.minvalue ? parseFloat(location.precipitation.minvalue) : null;
    const precMaxValue = location?.precipitation?.maxvalue ? parseFloat(location.precipitation.maxvalue) : null;

    if (gust !== null) {
      if (gust >= config.windGustThreshold) {
        resultsWind.push({ from, to, wind, gust });
      }
    } else if (wind !== null) {
      if (wind >= config.windSpeedThreshold) {
        resultsWind.push({ from, to, wind, gust: null });
      }
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if ((precValue !== null || precMinValue !== null || precMaxValue !== null) &&
      toDate < toPrecipitation &&
      differenceInHours(toDate, fromDate) === 1) {
      if ((precValue >= config.precipitationThreshold ||
        precMinValue >= config.precipitationThreshold ||
        precMaxValue >= config.precipitationThreshold
      )) {
        resultsPrecipitation.push({ from, to, precValue, precMinValue, precMaxValue });
      }

      if ((precValue >= config.superHighPrecipitationThreshold ||
        precMinValue >= config.superHighPrecipitationThreshold ||
        precMaxValue >= config.superHighPrecipitationThreshold
      )) {
        resultsSuperHighPrecipitation.push({ from, to, precValue, precMinValue, precMaxValue });
      }
    }
  });

  // leave only one wind record per day with highest speed
  let highestWindOnlyByDate = {}; // key = YYYY-MM-DD, value = strongest entry

  for (const entry of resultsWind) {
    if (entry.gust === null) {
      const date = entry.from.split('T')[0]; // Get YYYY-MM-DD part

      if (
        !highestWindOnlyByDate[date] ||
        entry.wind > highestWindOnlyByDate[date].wind
      ) {
        highestWindOnlyByDate[date] = entry;
      }
    }
  }

  // Get all gust entries
  const finalWindResults = resultsWind.filter(entry => entry.gust !== null);

  // Add the best wind-only entry for each day
  Object.values(highestWindOnlyByDate).forEach(entry => {
    finalWindResults.push(entry);
  });

  // Sort chronologically
  finalWindResults.sort((a, b) => new Date(a.from) - new Date(b.from));

  console.log(`\n📊 VĒJA DATI (${config.windDaysAhead} dienas):`);
  finalWindResults.forEach(entry => {
    const [date, fullTime] = entry.from.split('T');
    const time = fullTime.slice(0, 5);
    const wind = entry.wind?.toFixed(1) ?? '–';
    const gust = entry.gust?.toFixed(1) ?? '–';
    console.log(`  ${date} - ${time} – vējš: ${wind} m/s, brāzmas: ${gust} m/s`);
  });

  console.log(`\n📊 NOKRIŠŅU DATI (${config.precipitationDaysAhead} dienas):`);
  resultsPrecipitation.forEach(entry => {
    const [date, fullTime] = entry.from.split('T');
    const time = fullTime.slice(0, 5);
    const value = entry.precValue?.toFixed(1) ?? '–';
    const minValue = entry.precMinValue?.toFixed(1) ?? '–';
    const maxValue = entry.precMaxValue?.toFixed(1) ?? '–';

    console.log(`  ${date} - ${time} – nokrišņi: ${value} (${minValue}-${maxValue})`);
  });

  console.log(`\n📊 💦💦💦 SUPER LIELO NOKRIŠŅU DATI (${config.precipitationDaysAhead} dienas):`);
  resultsSuperHighPrecipitation.forEach(entry => {
    const [date, fullTime] = entry.from.split('T');
    const time = fullTime.slice(0, 5);
    const value = entry.precValue?.toFixed(1) ?? '–';
    const minValue = entry.precMinValue?.toFixed(1) ?? '–';
    const maxValue = entry.precMaxValue?.toFixed(1) ?? '–';

    console.log(`  ${date} - ${time} – nokrišņi: ${value} (${minValue}-${maxValue})`);
  });

  return { finalWindResults, resultsPrecipitation, resultsSuperHighPrecipitation };
};