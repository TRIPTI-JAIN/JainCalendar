// utility.js
import moment from 'moment';
import { Alert } from 'react-native';

// Fetch live monthly Panchang
export async function fetchMonthlyPanchang(
  year,
  month,
  lat,
  lon,
  timezone = 5.5,
) {
  // Replace with your actual Astrology API credentials
  const USER = 'YOUR_USER_ID';
  const KEY = 'YOUR_API_KEY';
  const auth = 'Basic ' + btoa(`${USER}:${KEY}`);

  const resp = await fetch(
    'https://json.astrologyapi.com/v1/monthly_panchang',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        year,
        month,
        day: 1,
        hour: 6,
        min: 0,
        lat,
        lon,
        tzone: timezone,
      }),
    },
  );

  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(json.message || 'API error');
  }

  const result = json.panchang.map(d => ({
    date: moment(`${year}-${month}-${d.day}`, 'YYYY-MM-DD').format(
      'YYYY-MM-DD',
    ),
    tithi: d.tithi_name || d.tithi, // adjust according to API
    sunrise: formatTimeNum(d.sunrise),
    sunset: formatTimeNum(d.sunSetTime || d.sunset),
    festival: d.festival || null,
  }));

  return result;
}

function formatTimeNum(timeNum) {
  // API returns sunrise as decimal hours (e.g. 6.1752)
  const h = Math.floor(timeNum);
  const m = Math.floor((timeNum - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export function generateCalendarDays(momentDate, panchangData = []) {
  const start = momentDate.clone().startOf('month');
  const total = momentDate.clone().daysInMonth();
  const startW = start.day();
  const arr = [];

  for (let i = 0; i < startW; i++) arr.push(null);

  for (let i = 1; i <= total; i++) {
    const ds = momentDate.clone().date(i).format('YYYY-MM-DD');
    const match = panchangData.find(d => d.date === ds);
    arr.push(match || { date: ds });
  }
  return arr;
}

export const getSunriseSunset = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`,
    );
    const data = await response.json();
    if (data.status === 'OK') {
      const sunrise = new Date(data.results.sunrise).toLocaleTimeString();
      const sunset = new Date(data.results.sunset).toLocaleTimeString();
      return { sunrise, sunset };
    } else {
      console.warn('API error:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch sunrise/sunset:', error);
    return null;
  }
};

export const getCityFromCoords = async (lat, lng) => {
  const apiKey = 'AIzaSyA-Fyv7jssmCOdmXPoazmvJAnvmI_I954s'; // Replace this
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  console.log(url);
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      const result = data.results[0];
      const cityObj = result.address_components.find(component =>
        component.types.includes('locality'),
      );
      const city = cityObj ? cityObj.long_name : 'Unknown city';
      console.log('City:', city);
      return city;
    } else {
      console.warn('Geocoding error:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
};

export const getQuarterAfterSunrise = (sunriseStr, sunsetStr) => {
  const parseTime = timeStr => {
    if (!timeStr) {
      console.error('Invalid time string:', timeStr);
      return null;
    }

    // Replace non-breaking spaces and normalize all spaces
    const cleanedTimeStr = timeStr
      .replace(/\u202F/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const [time, modifier] = cleanedTimeStr.split(' ');

    if (!time || !modifier) {
      console.error('Malformed time format:', timeStr);
      return null;
    }

    let [hours, minutes, seconds] = time.split(':').map(Number);
    seconds = isNaN(seconds) ? 0 : seconds;

    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    return new Date(0, 0, 0, hours, minutes, seconds);
  };

  const formatTime = date => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')} ${ampm}`;
  };

  const sunriseTime = parseTime(sunriseStr);
  const sunsetTime = parseTime(sunsetStr);

  if (!sunriseTime || !sunsetTime) {
    return 'Invalid';
  }

  const diffMs = sunsetTime - sunriseTime;
  const quarterDiffMs = diffMs / 4;

  const result = new Date(sunriseTime.getTime() + quarterDiffMs);
  return formatTime(result);
};

export const addMinutesToSunrise = (sunriseStr, minutesToAdd = 48) => {
  const parseTime = timeStr => {
    if (!timeStr) {
      console.error('Invalid time string:', timeStr);
      return null;
    }

    const cleaned = timeStr
      .replace(/\u202F/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const [time, modifier] = cleaned.split(' ');

    if (!time || !modifier) {
      console.error('Malformed time format:', timeStr);
      return null;
    }

    let [hours, minutes, seconds] = time.split(':').map(Number);
    seconds = isNaN(seconds) ? 0 : seconds;

    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    return new Date(0, 0, 0, hours, minutes, seconds);
  };

  const formatTime = date => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')} ${ampm}`;
  };

  const sunriseDate = parseTime(sunriseStr);
  if (!sunriseDate) return 'Invalid';

  const result = new Date(sunriseDate.getTime() + minutesToAdd * 60000);
  return formatTime(result);
};
