import RNFS from 'react-native-fs';
import { DEFAULT_OBSERVANCE_PROFILE } from './observanceProfile';

const APP_STATE_FILE = `${RNFS.DocumentDirectoryPath}/jain_calendar_app_state.json`;

const DEFAULT_APP_STATE = {
  locale: 'en',
  observanceProfile: DEFAULT_OBSERVANCE_PROFILE,
  activeCityId: null,
  cities: [],
  travelMode: {
    enabled: false,
    temporaryCity: null,
    startedAt: null,
  },
  reminders: {
    navkarsi: true,
    porsi: false,
    sunset: false,
    parna: false,
    festival: false,
  },
  festivalAlerts: {},
  fasting: {},
  notes: {},
  dailySadhana: {},
  dashboardCache: {},
};

const safeParse = value => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Failed to parse app state:', error);
    return null;
  }
};

export const getDefaultAppState = () =>
  JSON.parse(JSON.stringify(DEFAULT_APP_STATE));

export const readAppState = async () => {
  try {
    const exists = await RNFS.exists(APP_STATE_FILE);
    if (!exists) return getDefaultAppState();

    const content = await RNFS.readFile(APP_STATE_FILE, 'utf8');
    const parsed = safeParse(content);

    return {
      ...getDefaultAppState(),
      ...(parsed || {}),
      reminders: {
        ...getDefaultAppState().reminders,
        ...(parsed?.reminders || {}),
      },
      observanceProfile: {
        ...DEFAULT_OBSERVANCE_PROFILE,
        ...(parsed?.observanceProfile || {}),
      },
      festivalAlerts: parsed?.festivalAlerts || {},
      fasting: parsed?.fasting || {},
      notes: parsed?.notes || {},
      dailySadhana: parsed?.dailySadhana || {},
      dashboardCache: parsed?.dashboardCache || {},
      cities: parsed?.cities || [],
      travelMode: {
        ...getDefaultAppState().travelMode,
        ...(parsed?.travelMode || {}),
      },
    };
  } catch (error) {
    console.error('Failed to read app state:', error);
    return getDefaultAppState();
  }
};

export const writeAppState = async nextState => {
  try {
    await RNFS.writeFile(APP_STATE_FILE, JSON.stringify(nextState), 'utf8');
  } catch (error) {
    console.error('Failed to write app state:', error);
  }
};
