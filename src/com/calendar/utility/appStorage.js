import RNFS from 'react-native-fs';

const APP_STATE_FILE = `${RNFS.DocumentDirectoryPath}/jain_calendar_app_state.json`;

const DEFAULT_APP_STATE = {
  locale: 'en',
  activeCityId: null,
  cities: [],
  reminders: {
    navkarsi: true,
    sunset: false,
    parna: false,
    festival: false,
  },
  festivalAlerts: {},
  fasting: {},
  notes: {},
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
      festivalAlerts: parsed?.festivalAlerts || {},
      fasting: parsed?.fasting || {},
      notes: parsed?.notes || {},
      dashboardCache: parsed?.dashboardCache || {},
      cities: parsed?.cities || [],
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
