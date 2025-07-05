import { config } from './config.js';

export const weatherAnalyzer = (data) => {

  const results = [];

  data.weatherdata.product.time.forEach(entry => {
    const from = entry.from;
    const to = entry.to;
    const location = entry.location;

    const gust = location?.windGust?.mps ? parseFloat(location.windGust.mps) : null;
    const wind = location?.windSpeed?.mps ? parseFloat(location.windSpeed.mps) : null;

    if (gust !== null) {
      if (gust >= config.windGustThreshold) {
        results.push({ from, to, wind, gust });
      }
    } else {
      if (wind !== null && wind >= config.windSpeedThreshold) {
        results.push({ from, to, wind, gust: null });
      }
    }
  });

  // leave only one wind record per day with highest speed
  let highestWindOnlyByDate = {}; // key = YYYY-MM-DD, value = strongest entry

  for (const entry of results) {
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
  const finalResults = results.filter(entry => entry.gust !== null);

  // Add the best wind-only entry for each day
  Object.values(highestWindOnlyByDate).forEach(entry => {
    finalResults.push(entry);
  });

  // Sort chronologically
  finalResults.sort((a, b) => new Date(a.from) - new Date(b.from));

  return finalResults;
};
