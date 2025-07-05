import 'dotenv/config';

export const config = (() => {
  const requiredEnv = [
    'LATITUDE',
    'LONGITUDE',
    'WIND_GUST_THRESHOLD',
    'WIND_SPEED_THRESHOLD',
    'PRECIPITATION_THRESHOLD',
    'PRECIPITATION_DAYS_AHEAD',
    'WIND_DAYS_AHEAD',
    'BEARER_TOKEN',
    'ENDPOINT_URL',
    'DISCORD_MESSAGE_MAX_LENGTH',
    'EMAIL',
  ];

  const missing = requiredEnv.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`❌ Trūkst sekojoši .env mainīgie: ${missing.join(', ')}`);
  }

  const latitude = process.env.LATITUDE;
  const longitude = process.env.LONGITUDE;

  return {
    longitude,
    latitude,
    windGustThreshold: parseFloat(process.env.WIND_GUST_THRESHOLD),
    windSpeedThreshold: parseFloat(process.env.WIND_SPEED_THRESHOLD),
    precipitationThreshold: parseFloat(process.env.PRECIPITATION_THRESHOLD),

    precipitationUserIds: process.env.PRECIPITATION_USER_IDS
      ? process.env.PRECIPITATION_USER_IDS.split(',').map(id => id.trim())
      : [],
    precipitationDaysAhead: parseInt(process.env.PRECIPITATION_DAYS_AHEAD),

    windUserIds: process.env.WIND_USER_IDS
      ? process.env.WIND_USER_IDS.split(',').map(id => id.trim())
      : [],
    windDaysAhead: parseInt(process.env.WIND_DAYS_AHEAD),

    bearerToken: process.env.BEARER_TOKEN,
    endpointUrl: process.env.ENDPOINT_URL,

    apiUrl: `https://api.met.no/weatherapi/locationforecast/2.0/classic?lat=${latitude}&lon=${longitude}`,
    discordMessageMaxLength: parseInt(process.env.DISCORD_MESSAGE_MAX_LENGTH),
    email: process.env.EMAIL,
  };
})();