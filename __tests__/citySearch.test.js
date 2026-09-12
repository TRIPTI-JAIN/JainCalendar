import {
  getCityDisplayName,
  searchCities,
} from '../src/com/calendar/utility/citySearch';

describe('city search', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not call the service for a one-character query', async () => {
    global.fetch = jest.fn();
    await expect(searchCities('A')).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('maps geocoding results into saved-city records', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1279233,
            name: 'Ahmedabad',
            admin1: 'Gujarat',
            country: 'India',
            latitude: 23.02579,
            longitude: 72.58727,
            timezone: 'Asia/Kolkata',
          },
        ],
      }),
    });

    const [city] = await searchCities('Ahmedabad', 'en');
    expect(city).toMatchObject({
      id: 'open-meteo-1279233',
      name: 'Ahmedabad',
      lat: 23.02579,
      lon: 72.58727,
      source: 'city-search',
    });
    expect(getCityDisplayName(city)).toBe('Ahmedabad, Gujarat, India');
  });
});
