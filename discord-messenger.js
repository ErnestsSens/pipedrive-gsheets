import { config } from './config.js';

export const formatWindForecast = (data) => {
  if (!data.length) {
    return null;
  }

  // Sort by time to ensure proper order
  const sorted = data.slice().sort((a, b) => new Date(a.from) - new Date(b.from));

  const raw = [];       // Array of formatted lines
  let previousDate = '';
  let previousDateHadGust = false;

  for (const entry of sorted) {
    const [date, timeFull] = entry.from.split('T');
    const time = timeFull.slice(0, 5); // HH:mm

    // Ja sākas jauna diena un iepriekšējai dienai bija brāzmas – pievieno tukšu rindu
    if (date !== previousDate) {
      if (previousDate && previousDateHadGust) raw.push('');
      previousDate = date;
      previousDateHadGust = false;
    }

    // Formatē rindu
    const line = entry.gust !== null
      ? `${date} – ${time} – ${entry.wind.toFixed(1)} (${entry.gust.toFixed(1)}) – vējš (brāzmās) m/s`
      : `${date} – ${time} – ${entry.wind.toFixed(1)} – vējš m/s`;

    if (entry.gust !== null) {
      previousDateHadGust = true;
    }

    raw.push(line);
  }

  return {
    raw,
    text: '⚠️ Gaidāms stiprs vējš:\n' + raw.join('\n'),
  };
};

/**
 * Nosūta ziņu uz Discord visiem norādītajiem lietotājiem.
 * @param {Object} formattedData - Objektam jābūt formātā { text: '...', raw: [...] }
 * @param {string[]} recipients - Masīvs ar Discord lietotāju ID, kam ziņa jānosūta
 * @returns {boolean} true ja visiem veiksmīgi nosūtīts
 */
export const sendDiscordMessage = async (formattedData, recipients) => {
  if (!config.bearerToken || !config.endpointUrl) {
    console.error('❌ BEARER_TOKEN vai ENDPOINT_URL nav norādīts .env failā');
    return false;
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    console.warn('⚠️ Nav norādīti Discord lietotāju ID, kam sūtīt ziņu.');
    return false;
  }

  const maxLength = config.discordMessageMaxLength;
  const splitMessages = splitLongMessage(formattedData.text, maxLength);

  let success = true;

  for (const discordid of recipients) {
    for (const message of splitMessages) {
      const body = {
        discordid,
        message,
      };

      try {
        const response = await fetch(config.endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.bearerToken}`,
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          console.log(`\n✅ Ziņojums nosūtīts lietotājam ${discordid}`);
        } else {
          const text = await response.text();
          console.error(`❌ Kļūda sūtot ziņojumu lietotājam ${discordid}: HTTP ${response.status}`);
          console.error('Response:', text);
          success = false;
        }
      } catch (error) {
        console.error(`❌ Kļūda sūtot ziņojumu lietotājam ${discordid}:`, error.message);
        success = false;
      }
    }
  }

  return success;
};

/**
 * Sadala garu tekstu pa vairākām ziņām, ievērojot Discord max garumu.
 */
function splitLongMessage(text, maxLength) {
  const lines = text.split('\n');
  const chunks = [];
  let currentChunk = '';

  for (const line of lines) {
    if ((currentChunk + '\n' + line).length > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
