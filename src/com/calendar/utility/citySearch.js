const SEARCH_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

export const searchCities = async (query, locale = 'en', signal) => {
  const cleaned = String(query || '').trim();
  if (cleaned.length < 2) return [];

  const language = ['en', 'hi', 'gu'].includes(locale) ? locale : 'en';
  const response = await fetch(
    `${SEARCH_ENDPOINT}?name=${encodeURIComponent(
      cleaned,
    )}&count=6&language=${language}&format=json`,
    { signal },
  );

  if (!response.ok) {
    throw new Error('City search is temporarily unavailable.');
  }

  const payload = await response.json();
  return (payload.results || []).map(result => ({
    id: `open-meteo-${result.id}`,
    name: result.name,
    admin1: result.admin1 || '',
    country: result.country || '',
    lat: result.latitude,
    lon: result.longitude,
    timezone: result.timezone || null,
    source: 'city-search',
  }));
};

export const getCityDisplayName = city =>
  [city?.name, city?.admin1, city?.country].filter(Boolean).join(', ');
