import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  PermissionsAndroid,
  TextInput,
  Switch,
  Alert,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Geolocation from 'react-native-geolocation-service';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeModules } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import moment from 'moment';
import {
  request,
  requestMultiple,
  check,
  openSettings,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Feather';
import {
  getSunriseSunset,
  getCityFromCoords,
  addMinutesToSunrise,
  getQuarterAfterSunrise,
} from '../utility';
import CollapsibleCard from '../components/CollapsibleCard';
import {
  readAppState,
  writeAppState,
  getDefaultAppState,
} from '../utility/appStorage';
import {
  DEFAULT_CITIES,
  DEFAULT_COORDS,
  buildDaySummary,
  buildUpcomingFestivals,
} from '../utility/jainData';
import {
  formatLocalizedDate,
  getCopy,
  translateDaySummary,
  translateFastingTitle,
} from '../utility/i18n';
import {
  SADHANA_PRACTICES,
  calculateSadhanaStreak,
  getCompletedPracticeCount,
} from '../utility/dailySadhana';
import {
  detectTravelChange,
  getDeviceTimezone,
  getTravelSignature,
} from '../utility/travelMode';

const TODAY_KEY = moment().format('YYYY-MM-DD');

const FASTING_OPTIONS = ['None', 'Upvas', 'Ekasana', 'Beasana'];

const parseDashboardTime = (timeString, baseDate = moment()) => {
  const parsed = moment(
    timeString,
    ['h:mm A', 'hh:mm A', 'H:mm', 'H:mm:ss'],
    true,
  );
  if (!parsed.isValid()) return null;
  return moment(baseDate)
    .hour(parsed.hour())
    .minute(parsed.minute())
    .second(0)
    .millisecond(0);
};

const formatCountdown = (target, now, copy) => {
  if (!target) return copy.timeUnavailable;
  const minutes = Math.max(0, target.diff(now, 'minutes'));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0) {
    return copy.startsInHours
      .replace('{hours}', hours)
      .replace('{minutes}', remainingMinutes);
  }
  return copy.startsInMinutes.replace('{minutes}', remainingMinutes);
};

const Home = () => {
  const navigation = useNavigation();
  const shareCardRef = useRef(null);
  const travelPromptOpenRef = useRef(false);
  const dismissedTravelRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [locationPermissionBlocked, setLocationPermissionBlocked] =
    useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [dashboardSource, setDashboardSource] = useState('loading');
  const [dashboard, setDashboard] = useState(null);
  const [appState, setAppState] = useState(getDefaultAppState());
  const [currentTime, setCurrentTime] = useState(moment());

  const locale = appState.locale || 'en';
  const observanceProfile = appState.observanceProfile;
  const copy = getCopy('home', locale);
  const selectedCity =
    appState.cities.find(city => city.id === appState.activeCityId) ||
    appState.cities[0] ||
    DEFAULT_CITIES[0];
  const activeCity = appState.travelMode?.enabled
    ? appState.travelMode.temporaryCity || selectedCity
    : selectedCity;
  const todaysNote = appState.notes?.[TODAY_KEY] || '';
  const fastingSelection = appState.fasting?.[TODAY_KEY] || 'None';
  const todaysSadhana = appState.dailySadhana?.[TODAY_KEY] || {};
  const sadhanaCompleted = getCompletedPracticeCount(todaysSadhana);
  const sadhanaStreak = calculateSadhanaStreak(appState.dailySadhana);
  const dataSourceLabel =
    dashboardSource === 'live'
      ? copy.liveData
      : dashboardSource === 'calculated'
      ? copy.calculatedData
      : copy.cachedData;

  const upcomingFestivals = useMemo(() => {
    if (!activeCity) return [];
    return buildUpcomingFestivals(
      moment(),
      activeCity.lat || DEFAULT_COORDS.lat,
      activeCity.lon || DEFAULT_COORDS.lon,
      180,
      observanceProfile,
    )
      .slice(0, 6)
      .map(item => translateDaySummary(item, locale));
  }, [activeCity, locale, observanceProfile]);

  const localizedToday = useMemo(
    () =>
      dashboard?.today ? translateDaySummary(dashboard.today, locale) : null,
    [dashboard, locale],
  );
  const nextFestivalForWidget = useMemo(() => {
    if (!upcomingFestivals.length) return null;

    return (
      upcomingFestivals.find(item => item.date !== dashboard?.today?.date) ||
      upcomingFestivals[0]
    );
  }, [dashboard, upcomingFestivals]);

  const timedEvents = useMemo(() => {
    if (!dashboard) return [];
    return [
      { key: 'navkarsi', label: copy.navkarsi, time: dashboard.navkarsiTime },
      { key: 'porsi', label: copy.porsi, time: dashboard.porsiTime },
      { key: 'sunset', label: copy.sunset, time: dashboard.sunset },
    ].map(event => {
      const todayTime = parseDashboardTime(event.time, currentTime);
      const nextTime =
        todayTime && todayTime.isAfter(currentTime)
          ? todayTime
          : todayTime?.clone().add(1, 'day');
      return { ...event, nextTime };
    });
  }, [copy, currentTime, dashboard]);

  const nextReminder = useMemo(
    () =>
      timedEvents
        .filter(event => appState.reminders?.[event.key] && event.nextTime)
        .sort((a, b) => a.nextTime.valueOf() - b.nextTime.valueOf())[0] || null,
    [appState.reminders, timedEvents],
  );

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(moment()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (!dashboard || !localizedToday) return;

    const widgetModule = NativeModules.DashboardWidget;
    if (!widgetModule?.updateWidgetData) return;

    widgetModule.updateWidgetData({
      cityName: dashboard.cityName,
      tithi: localizedToday.tithi,
      navkarsiTime: dashboard.navkarsiTime,
      festivalTitle:
        nextFestivalForWidget?.festival?.title ||
        `${copy.festival}: ${copy.noneToday}`,
      festivalDate: nextFestivalForWidget
        ? formatLocalizedDate(nextFestivalForWidget.date, locale)
        : '',
      updatedAt: formatLocalizedDate(dashboard.updatedAt, locale, {
        month: 'short',
        day: 'numeric',
      }),
    });
  }, [copy, dashboard, locale, localizedToday, nextFestivalForWidget]);

  const persistAppState = async nextState => {
    setAppState(nextState);
    await writeAppState(nextState);
  };

  const updateAppState = async updater => {
    const nextState =
      typeof updater === 'function' ? updater(appState) : updater;
    await persistAppState(nextState);
    return nextState;
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      const isBlocked = result === RESULTS.BLOCKED;
      setLocationPermissionBlocked(isBlocked);
      return { granted: result === RESULTS.GRANTED, blocked: isBlocked };
    }

    const finePermission = PERMISSIONS.ANDROID?.ACCESS_FINE_LOCATION;
    const coarsePermission = PERMISSIONS.ANDROID?.ACCESS_COARSE_LOCATION;
    const permissionList = [finePermission, coarsePermission].filter(Boolean);
    const result = await requestMultiple(permissionList);
    const fine = finePermission ? result[finePermission] : null;
    const coarse = coarsePermission ? result[coarsePermission] : null;
    const isBlocked = fine === RESULTS.BLOCKED && coarse === RESULTS.BLOCKED;

    setLocationPermissionBlocked(isBlocked);

    return {
      granted: fine === RESULTS.GRANTED || coarse === RESULTS.GRANTED,
      blocked: isBlocked,
    };
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version < 33) return true;

    const notificationsPermission = PERMISSIONS.ANDROID?.POST_NOTIFICATIONS;
    if (notificationsPermission) {
      const result = await request(notificationsPermission);
      return result === RESULTS.GRANTED;
    }

    const fallbackPermission =
      PermissionsAndroid.PERMISSIONS?.POST_NOTIFICATIONS;
    if (!fallbackPermission) return false;
    const granted = await PermissionsAndroid.request(fallbackPermission);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const parseLocalTimeToNextTimestamp = (timeString, daysAhead = 0) => {
    if (!timeString) return null;
    const cleaned = String(timeString)
      .replace(/\u202F/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const [time, meridiemRaw] = cleaned.split(' ');
    if (!time) return null;

    let [hours, minutes, seconds] = time.split(':').map(Number);
    const meridiem = meridiemRaw ? meridiemRaw.toUpperCase() : null;
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    seconds = Number.isNaN(seconds) ? 0 : seconds;

    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    const next = new Date();
    next.setHours(hours, minutes, seconds, 0);
    next.setDate(next.getDate() + daysAhead);
    if (daysAhead === 0 && next.getTime() <= Date.now()) {
      next.setDate(next.getDate() + 1);
    }
    return next.getTime();
  };

  const scheduleNotification = async ({
    timeString,
    title,
    body,
    daysAhead = 0,
  }) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission || Platform.OS !== 'android') return;

    const module = NativeModules.NavkarsiNotification;
    const triggerAtMillis = parseLocalTimeToNextTimestamp(
      timeString,
      daysAhead,
    );
    if (!module?.scheduleNotification || !triggerAtMillis) return;

    module.scheduleNotification(triggerAtMillis, title, body);
  };

  const scheduleConfiguredReminders = async (payload, reminders) => {
    if (!payload) return;

    if (reminders.navkarsi) {
      await scheduleNotification({
        timeString: payload.navkarsiTime,
        title: 'Navkarsi Reminder',
        body: `${payload.cityName}: Navkarsi starts at ${payload.navkarsiTime}.`,
      });
    }

    if (reminders.porsi) {
      await scheduleNotification({
        timeString: payload.porsiTime,
        title: 'Porsi Reminder',
        body: `${payload.cityName}: Porsi starts at ${payload.porsiTime}.`,
      });
    }

    if (reminders.sunset) {
      await scheduleNotification({
        timeString: payload.sunset,
        title: 'Sunset Reminder',
        body: `${payload.cityName}: Sunset is at ${payload.sunset}.`,
      });
    }

    if (reminders.festival && payload.today?.festival) {
      await scheduleNotification({
        timeString: '08:00 AM',
        title: payload.today.festival.title,
        body: payload.today.festival.significance,
      });
    }

    if (reminders.parna && payload.today?.fasting) {
      await scheduleNotification({
        timeString: payload.navkarsiTime,
        title: 'Parna Reminder',
        body: 'Prepare for parna after your fasting observance.',
        daysAhead: 1,
      });
    }
  };

  const buildLocalDashboardPayload = (city, profile = observanceProfile) => {
    const today = buildDaySummary(moment(), city.lat, city.lon, profile);
    const sunData = {
      sunrise: today.sunriseLabel,
      sunset: today.sunsetLabel,
    };
    const navkarsiTime = addMinutesToSunrise(sunData.sunrise);
    const porsiTime = getQuarterAfterSunrise(sunData.sunrise, sunData.sunset);

    const offlineDays = Array.from({ length: 90 }, (_, offset) =>
      buildDaySummary(
        moment().add(offset, 'days'),
        city.lat,
        city.lon,
        profile,
      ),
    );

    return {
      cityId: city.id,
      cityName: city.name,
      latitude: city.lat,
      longitude: city.lon,
      sunrise: sunData.sunrise,
      sunset: sunData.sunset,
      navkarsiTime,
      porsiTime,
      dataSource: 'calculated',
      updatedAt: new Date().toISOString(),
      cacheRange: {
        from: offlineDays[0]?.date,
        to: offlineDays[offlineDays.length - 1]?.date,
        totalDays: offlineDays.length,
      },
      offlineDays,
      today: {
        ...today,
        sunriseLabel: sunData.sunrise,
        sunsetLabel: sunData.sunset,
      },
    };
  };

  const buildDashboardPayload = async (city, localPayload, profile) => {
    const fallback = localPayload || buildLocalDashboardPayload(city, profile);
    const liveSunData = await getSunriseSunset(city.lat, city.lon);
    if (!liveSunData) return fallback;

    return {
      ...fallback,
      sunrise: liveSunData.sunrise,
      sunset: liveSunData.sunset,
      navkarsiTime: addMinutesToSunrise(liveSunData.sunrise),
      porsiTime: getQuarterAfterSunrise(
        liveSunData.sunrise,
        liveSunData.sunset,
      ),
      dataSource: 'live',
      updatedAt: new Date().toISOString(),
      today: {
        ...fallback.today,
        sunriseLabel: liveSunData.sunrise,
        sunsetLabel: liveSunData.sunset,
      },
    };
  };

  const applyDashboard = (payload, source = payload.dataSource || 'live') => {
    setDashboard(payload);
    setDashboardSource(source);
    setUsingCachedData(source !== 'live');
    setStatus(source === 'live' ? 'ready' : 'offline');
  };

  const bootstrap = async () => {
    const stored = await readAppState();
    const nextState = {
      ...stored,
      cities: stored.cities.length ? stored.cities : DEFAULT_CITIES,
      activeCityId:
        stored.activeCityId || stored.cities?.[0]?.id || DEFAULT_CITIES[0].id,
    };

    await persistAppState(nextState);
    const startupCity =
      nextState.cities.find(city => city.id === nextState.activeCityId) ||
      nextState.cities[0];
    const cached = nextState.dashboardCache?.[startupCity.id];

    if (cached) {
      applyDashboard(cached, 'cache');
    }

    await loadDashboardForCity(startupCity, nextState, {
      asRefresh: Boolean(cached),
    });
  };

  const getCurrentLocation = () =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });

  const hasGrantedLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      return (
        (await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)) === RESULTS.GRANTED
      );
    }

    const fine = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    if (fine === RESULTS.GRANTED) return true;
    const coarse = await check(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION);
    return coarse === RESULTS.GRANTED;
  };

  const cancelScheduledReminders = async () => {
    if (Platform.OS !== 'android') return;
    const module = NativeModules.NavkarsiNotification;
    if (module?.cancelAllNotifications) {
      await module.cancelAllNotifications();
    }
  };

  const saveDashboardCache = async (payload, currentState) => {
    const nextState = {
      ...currentState,
      dashboardCache: {
        ...currentState.dashboardCache,
        [payload.cityId]: payload,
      },
    };
    await persistAppState(nextState);
    return nextState;
  };

  const loadDashboardForCity = async (
    city,
    stateOverride = appState,
    options = {},
  ) => {
    if (!city) return;

    if (!options.asRefresh) {
      setStatus('loading');
    }

    setErrorMessage('');
    setUsingCachedData(false);

    let resolvedCity = city;
    const currentState = stateOverride || appState;

    try {
      if (options.preferCurrentLocation) {
        const { granted, blocked } = await requestLocationPermission();
        if (granted) {
          const position = await getCurrentLocation();
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const liveCityName =
            (await getCityFromCoords(latitude, longitude)) ||
            'Current Location';

          resolvedCity = {
            id: 'current-location',
            name: liveCityName,
            lat: latitude,
            lon: longitude,
            source: 'gps',
          };

          const withoutCurrent = currentState.cities.filter(
            item => item.id !== resolvedCity.id,
          );
          const nextState = {
            ...currentState,
            activeCityId: resolvedCity.id,
            cities: [resolvedCity, ...withoutCurrent],
          };
          await persistAppState(nextState);
          stateOverride = nextState;
        } else if (!currentState.dashboardCache?.[city.id]) {
          setStatus(blocked ? 'permission_denied' : 'error');
          setErrorMessage(
            blocked
              ? 'Location permission is blocked. Enable it from settings.'
              : 'Location permission is required for current location.',
          );
        }
      }

      const cached = currentState.dashboardCache?.[resolvedCity.id];
      const activeProfile = (stateOverride || currentState).observanceProfile;
      const localPayload = cached
        ? null
        : buildLocalDashboardPayload(resolvedCity, activeProfile);

      if (localPayload) {
        applyDashboard(localPayload, 'calculated');
      }

      const payload = await buildDashboardPayload(
        resolvedCity,
        localPayload,
        activeProfile,
      );
      applyDashboard(payload);
      await scheduleConfiguredReminders(
        payload,
        (stateOverride || currentState).reminders,
      );
      await saveDashboardCache(payload, stateOverride || currentState);
    } catch (error) {
      console.error(error);
      const cached = currentState.dashboardCache?.[resolvedCity.id];
      if (cached) {
        setDashboard(cached);
        setStatus('offline');
        setUsingCachedData(true);
        setErrorMessage('Showing cached dashboard data.');
        return;
      }

      setStatus('error');
      setErrorMessage('Unable to load city data. Check location/network.');
    }
  };

  const buildDetectedCity = async coords => ({
    id: `travel-${coords.lat.toFixed(3)}-${coords.lon.toFixed(3)}`,
    name:
      (await getCityFromCoords(coords.lat, coords.lon)) || copy.travelLocation,
    lat: coords.lat,
    lon: coords.lon,
    timezone: getDeviceTimezone(),
    source: 'travel-detection',
  });

  const enableTemporaryTravel = async coords => {
    travelPromptOpenRef.current = false;
    const temporaryCity = await buildDetectedCity(coords);
    const nextState = {
      ...appState,
      travelMode: {
        enabled: true,
        temporaryCity,
        startedAt: new Date().toISOString(),
      },
    };
    await cancelScheduledReminders();
    await persistAppState(nextState);
    await loadDashboardForCity(temporaryCity, nextState, { asRefresh: true });
  };

  const saveDetectedCity = async coords => {
    travelPromptOpenRef.current = false;
    const nextCity = await buildDetectedCity(coords);
    const nextState = {
      ...appState,
      activeCityId: nextCity.id,
      cities: [
        nextCity,
        ...appState.cities.filter(city => city.id !== nextCity.id),
      ],
      travelMode: getDefaultAppState().travelMode,
    };
    await cancelScheduledReminders();
    await persistAppState(nextState);
    await loadDashboardForCity(nextCity, nextState, { asRefresh: true });
  };

  const endTravelMode = async () => {
    travelPromptOpenRef.current = false;
    const nextState = {
      ...appState,
      travelMode: getDefaultAppState().travelMode,
    };
    await cancelScheduledReminders();
    await persistAppState(nextState);
    await loadDashboardForCity(selectedCity, nextState, { asRefresh: true });
  };

  const detectTravelOnForeground = async () => {
    if (!dashboard || travelPromptOpenRef.current) return;
    if (!(await hasGrantedLocationPermission())) return;

    try {
      const position = await getCurrentLocation();
      const coords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
      const timezone = getDeviceTimezone();
      const signature = getTravelSignature(coords, timezone);
      if (dismissedTravelRef.current === signature) return;

      if (appState.travelMode?.enabled) {
        const homeDistance = detectTravelChange({
          savedCity: selectedCity,
          currentCoords: coords,
          deviceTimezone: timezone,
          distanceThresholdKm: 25,
        });
        if (homeDistance.changed) return;

        travelPromptOpenRef.current = true;
        Alert.alert(copy.backHomeTitle, copy.backHomeBody, [
          {
            text: copy.notNow,
            style: 'cancel',
            onPress: () => {
              dismissedTravelRef.current = signature;
              travelPromptOpenRef.current = false;
            },
          },
          { text: copy.endTravelMode, onPress: endTravelMode },
        ]);
        return;
      }

      const change = detectTravelChange({
        savedCity: selectedCity,
        currentCoords: coords,
        deviceTimezone: timezone,
      });
      if (!change.changed) return;

      travelPromptOpenRef.current = true;
      const distanceLabel = Math.round(change.distanceKm);
      Alert.alert(
        copy.travelDetectedTitle,
        copy.travelDetectedBody
          .replace('{city}', selectedCity.name)
          .replace('{distance}', distanceLabel),
        [
          {
            text: copy.notNow,
            style: 'cancel',
            onPress: () => {
              dismissedTravelRef.current = signature;
              travelPromptOpenRef.current = false;
            },
          },
          {
            text: copy.useTemporarily,
            onPress: () => enableTemporaryTravel(coords),
          },
          { text: copy.saveAndUse, onPress: () => saveDetectedCity(coords) },
        ],
      );
    } catch (error) {
      console.warn('Travel detection unavailable:', error);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        detectTravelOnForeground();
      }
    });
    return () => subscription.remove();
    // Re-register when the selected or temporary travel location changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.travelMode, dashboard, selectedCity]);

  const handleRefresh = async () => {
    if (!activeCity || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await loadDashboardForCity(activeCity, appState, { asRefresh: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRetry = async () => {
    if (!activeCity || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await loadDashboardForCity(activeCity, appState, {
        asRefresh: true,
        preferCurrentLocation: activeCity.id === 'current-location',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await openSettings();
    } catch (error) {
      console.error('Could not open settings:', error);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await loadDashboardForCity(activeCity || DEFAULT_CITIES[0], appState, {
        asRefresh: true,
        preferCurrentLocation: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFestivalToggle = async festivalId => {
    const nextState = {
      ...appState,
      festivalAlerts: {
        ...appState.festivalAlerts,
        [festivalId]: !appState.festivalAlerts[festivalId],
      },
    };
    await persistAppState(nextState);
  };

  const openFestivalDetail = item => {
    if (!item?.festival) return;

    navigation.navigate('FestivalDetail', {
      festival: item.festival,
      festivalId: item.festival.id,
      date: item.date,
      tithi: item.tithi,
      cityName: dashboard?.cityName || activeCity?.name,
    });
  };

  const handleFastingChange = async value => {
    await updateAppState({
      ...appState,
      fasting: {
        ...appState.fasting,
        [TODAY_KEY]: value,
      },
    });
  };

  const handleNoteChange = async text => {
    await updateAppState({
      ...appState,
      notes: {
        ...appState.notes,
        [TODAY_KEY]: text,
      },
    });
  };

  const handleSadhanaToggle = async practice => {
    await updateAppState({
      ...appState,
      dailySadhana: {
        ...appState.dailySadhana,
        [TODAY_KEY]: {
          ...todaysSadhana,
          [practice]: !todaysSadhana[practice],
        },
      },
    });
  };

  const handleShare = async () => {
    try {
      if (!shareCardRef.current) return;
      const uri = await shareCardRef.current.capture();
      await Share.open({
        title: 'Share Jain dashboard card',
        url: uri,
        type: 'image/png',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const renderStatusCard = () => {
    if (status === 'loading') {
      return (
        <View style={styles.card}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={[styles.valueText, styles.statusText]}>
            Loading data...
          </Text>
        </View>
      );
    }

    if (status === 'permission_denied' || status === 'error') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy.liveDataError}</Text>
          <Text style={styles.supportingText}>{errorMessage}</Text>
          <View style={styles.inlineRow}>
            <TouchableOpacity
              onPress={handleRetry}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {isRefreshing ? '...' : copy.retry}
              </Text>
            </TouchableOpacity>
            {locationPermissionBlocked ? (
              <TouchableOpacity
                onPress={handleOpenSettings}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  {copy.openSettings}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Video
        source={require('../assets/video/newBack.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        muted
        ignoreSilentSwitch="obey"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.8}
          >
            <Icon name="menu" size={22} color="#f4f7ff" />
          </TouchableOpacity>
          <View style={styles.headerBrand}>
            <Text style={styles.headerEyebrow}>JAIN CALENDAR</Text>
            <Text style={styles.headerTitle}>{copy.today}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.headerIconButton}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#e6a84b" />
              ) : (
                <Icon name="refresh-cw" size={19} color="#e6a84b" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.headerIconButton}
            >
              <Icon name="settings" size={19} color="#dce5f3" />
            </TouchableOpacity>
          </View>
        </View>

        {status !== 'ready' && status !== 'offline' ? renderStatusCard() : null}

        {dashboard ? (
          <>
            {appState.travelMode?.enabled ? (
              <View style={styles.travelBanner}>
                <Icon name="navigation" size={17} color="#111827" />
                <View style={styles.travelBannerCopy}>
                  <Text style={styles.travelBannerTitle}>
                    {copy.travelMode}
                  </Text>
                  <Text style={styles.travelBannerText}>
                    {copy.travelModeBody.replace('{city}', activeCity.name)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.travelEndButton}
                  onPress={endTravelMode}
                >
                  <Text style={styles.travelEndText}>{copy.end}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.todayOverview}>
              <View style={styles.overviewTopRow}>
                <View style={styles.listContent}>
                  <View style={styles.liveRow}>
                    <View
                      style={[
                        styles.liveDot,
                        usingCachedData && styles.cachedDot,
                      ]}
                    />
                    <Text style={styles.liveText}>{dataSourceLabel}</Text>
                  </View>
                  <Text style={styles.overviewDate}>
                    {formatLocalizedDate(currentTime, locale, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <TouchableOpacity
                    style={styles.locationRow}
                    onPress={handleUseCurrentLocation}
                  >
                    <Icon name="map-pin" size={13} color="#e6a84b" />
                    <Text style={styles.locationText}>
                      {dashboard.cityName}
                    </Text>
                    <Icon name="navigation" size={11} color="#8290a8" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.calendarShortcut}
                  onPress={() => navigation.navigate('Calendar')}
                  accessibilityRole="button"
                  accessibilityLabel={copy.openCalendar}
                >
                  <Icon name="calendar" size={22} color="#111827" />
                </TouchableOpacity>
              </View>

              <View style={styles.tithiPanel}>
                <Text style={styles.tithiEyebrow}>{copy.todayTithi}</Text>
                <Text style={styles.tithiTitle}>{localizedToday?.tithi}</Text>
                <Text style={styles.tithiMeta}>
                  {localizedToday?.paksha} · {localizedToday?.moonMasa}
                </Text>
                {localizedToday?.festival ? (
                  <TouchableOpacity
                    style={styles.festivalPill}
                    onPress={() => openFestivalDetail(dashboard.today)}
                  >
                    <Icon name="star" size={14} color="#ffe3ad" />
                    <Text style={styles.festivalPillText}>
                      {localizedToday.festival.title}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.timeCardsRow}>
                {timedEvents.slice(0, 2).map((event, index) => (
                  <View key={event.key} style={styles.timeCard}>
                    <View style={styles.timeCardHeader}>
                      <Icon
                        name={index === 0 ? 'sunrise' : 'clock'}
                        size={17}
                        color="#e6a84b"
                      />
                      <Text style={styles.timeCardLabel}>{event.label}</Text>
                    </View>
                    <Text style={styles.timeCardValue}>{event.time}</Text>
                    <Text style={styles.countdownText}>
                      {formatCountdown(event.nextTime, currentTime, copy)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.quickInfoRow}>
                <TouchableOpacity
                  style={styles.quickInfoCard}
                  onPress={() => navigation.navigate('Settings')}
                >
                  <View style={styles.quickInfoIcon}>
                    <Icon name="bell" size={17} color="#e6a84b" />
                  </View>
                  <View style={styles.listContent}>
                    <Text style={styles.quickInfoLabel}>
                      {copy.nextReminder}
                    </Text>
                    <Text style={styles.quickInfoValue} numberOfLines={1}>
                      {nextReminder
                        ? `${nextReminder.label} · ${nextReminder.time}`
                        : copy.noReminder}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.quickInfoCard}>
                  <View style={styles.quickInfoIcon}>
                    <Icon name="check-circle" size={17} color="#e6a84b" />
                  </View>
                  <View style={styles.listContent}>
                    <Text style={styles.quickInfoLabel}>
                      {copy.dailySadhana}
                    </Text>
                    <Text style={styles.quickInfoValue}>
                      {sadhanaCompleted}/{SADHANA_PRACTICES.length} ·{' '}
                      {sadhanaStreak} {copy.days}
                    </Text>
                  </View>
                </View>
              </View>

              {nextFestivalForWidget ? (
                <TouchableOpacity
                  style={styles.nextFestivalRow}
                  onPress={() => openFestivalDetail(nextFestivalForWidget)}
                >
                  <View style={styles.nextFestivalIcon}>
                    <Icon name="moon" size={18} color="#111827" />
                  </View>
                  <View style={styles.listContent}>
                    <Text style={styles.quickInfoLabel}>
                      {copy.nextFestival}
                    </Text>
                    <Text style={styles.nextFestivalTitle}>
                      {nextFestivalForWidget.festival?.title}
                    </Text>
                    <Text style={styles.nextFestivalDate}>
                      {formatLocalizedDate(nextFestivalForWidget.date, locale)}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#e6a84b" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.sadhanaCompact}>
              <View style={styles.sadhanaHeader}>
                <View style={styles.listContent}>
                  <Text style={styles.compactEyebrow}>{copy.dailySadhana}</Text>
                  <Text style={styles.compactTitle}>
                    {copy.sadhanaProgress
                      .replace('{done}', sadhanaCompleted)
                      .replace('{total}', SADHANA_PRACTICES.length)}
                  </Text>
                </View>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakNumber}>{sadhanaStreak}</Text>
                  <Text style={styles.streakLabel}>{copy.dayStreak}</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        (sadhanaCompleted / SADHANA_PRACTICES.length) * 100
                      }%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.practiceGrid}>
                {SADHANA_PRACTICES.map(practice => {
                  const completed = Boolean(todaysSadhana[practice]);
                  return (
                    <TouchableOpacity
                      key={practice}
                      style={[
                        styles.practiceCompact,
                        completed && styles.practiceCompactActive,
                      ]}
                      onPress={() => handleSadhanaToggle(practice)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: completed }}
                    >
                      <Icon
                        name={completed ? 'check-circle' : 'circle'}
                        size={17}
                        color={completed ? '#111827' : '#8f9db4'}
                      />
                      <Text
                        style={[
                          styles.practiceCompactText,
                          completed && styles.practiceCompactTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {copy[practice].split(' / ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={handleShare}
              >
                <Icon name="share-2" size={18} color="#e6a84b" />
                <Text style={styles.quickActionText}>{copy.shareShort}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Calendar')}
              >
                <Icon name="calendar" size={18} color="#e6a84b" />
                <Text style={styles.quickActionText}>{copy.calendarShort}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Settings')}
              >
                <Icon name="sliders" size={18} color="#e6a84b" />
                <Text style={styles.quickActionText}>{copy.settingsShort}</Text>
              </TouchableOpacity>
            </View>

            <ViewShot
              ref={shareCardRef}
              options={{ format: 'png', quality: 1 }}
              style={styles.captureHidden}
            >
              <View style={styles.shareCard}>
                <Text style={styles.shareDate}>
                  {dashboard.today.displayDate}
                </Text>
                <Text style={styles.shareCity}>{dashboard.cityName}</Text>
                <Text style={styles.shareHeadline}>
                  {localizedToday?.tithi || dashboard.today.tithi} ·{' '}
                  {localizedToday?.paksha || dashboard.today.paksha}
                </Text>
                <Text style={styles.shareFestival}>
                  {copy.navkarsi}: {dashboard.navkarsiTime} · {copy.porsi}:{' '}
                  {dashboard.porsiTime}
                </Text>
                {localizedToday?.festival ? (
                  <Text style={styles.shareFestival}>
                    {copy.festival}: {localizedToday.festival.title}
                  </Text>
                ) : null}
                <Text style={styles.shareFooter}>
                  {dataSourceLabel} ·{' '}
                  {moment(dashboard.updatedAt).format('MMM D, hh:mm A')}
                </Text>
              </View>
            </ViewShot>

            <CollapsibleCard
              title={copy.upcomingFestivals}
              subtitle={copy.festivalSectionHint}
              icon="star"
            >
              {upcomingFestivals.map(item => (
                <TouchableOpacity
                  key={`${item.date}-${item.festival?.id}`}
                  style={styles.listRow}
                  onPress={() => openFestivalDetail(item)}
                >
                  <View style={styles.listContent}>
                    <Text style={styles.listTitle}>{item.festival?.title}</Text>
                    <Text style={styles.listMeta}>
                      {formatLocalizedDate(item.date, locale)} · {item.tithi}
                    </Text>
                    <Text style={styles.supportingText}>
                      {item.festival?.significance}
                    </Text>
                  </View>
                  <Switch
                    value={Boolean(
                      appState.festivalAlerts?.[item.festival?.id],
                    )}
                    onValueChange={() =>
                      handleFestivalToggle(item.festival?.id)
                    }
                    trackColor={{ false: '#475569', true: '#e6a84b' }}
                    thumbColor="#fff"
                  />
                </TouchableOpacity>
              ))}
            </CollapsibleCard>

            <CollapsibleCard
              title={copy.fastingAssistant}
              subtitle={copy.fastingSectionHint}
              icon="moon"
            >
              <Text style={styles.supportingText}>
                {copy.fastingSectionBody}
              </Text>
              <View style={styles.pillRow}>
                {FASTING_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.choicePill,
                      fastingSelection === option
                        ? styles.choicePillActive
                        : null,
                    ]}
                    onPress={() => handleFastingChange(option)}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        fastingSelection === option
                          ? styles.choicePillTextActive
                          : null,
                      ]}
                    >
                      {locale === 'en'
                        ? option
                        : translateFastingTitle(option, locale)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </CollapsibleCard>

            <CollapsibleCard
              title={copy.notes}
              subtitle={copy.notesSectionHint}
              icon="edit-3"
            >
              <TextInput
                multiline
                value={todaysNote}
                onChangeText={handleNoteChange}
                placeholder={copy.notesPlaceholder}
                placeholderTextColor="#7f8ca5"
                style={styles.notesInput}
              />
            </CollapsibleCard>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(10,18,35,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(214,228,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerBrand: { flex: 1, marginLeft: 12 },
  headerEyebrow: {
    color: '#e6a84b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: '#fff7dd',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row' },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
    backgroundColor: 'rgba(10,18,35,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(214,228,255,0.12)',
  },
  travelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 15,
    backgroundColor: '#e6a84b',
  },
  travelBannerCopy: { flex: 1, marginLeft: 10 },
  travelBannerTitle: { color: '#111827', fontSize: 12, fontWeight: '900' },
  travelBannerText: { color: '#3d2b10', fontSize: 10, marginTop: 2 },
  travelEndButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(17,24,39,0.14)',
  },
  travelEndText: { color: '#111827', fontSize: 11, fontWeight: '800' },
  hamburgerIcon: {
    width: 22,
    justifyContent: 'space-between',
    height: 16,
  },
  hamburgerLine: {
    height: 2.5,
    backgroundColor: '#f4f7ff',
    borderRadius: 999,
    width: '100%',
  },
  refreshPill: {
    backgroundColor: 'rgba(230,168,75,0.18)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e6a84b',
  },
  refreshPillText: {
    color: '#ffe6ba',
    fontWeight: '700',
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 14,
  },
  heroEyebrow: {
    color: '#e6a84b',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '700',
  },
  localeRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 14,
  },
  localeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#18233a',
    marginRight: 8,
  },
  localeChipActive: {
    backgroundColor: '#e6a84b',
  },
  localeChipText: {
    color: '#c1cce0',
    fontWeight: '700',
  },
  localeChipTextActive: {
    color: '#111827',
  },
  heroTitle: {
    color: '#fff7dd',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#b4c0d4',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: '94%',
  },
  todayOverview: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(10,17,32,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(230,168,75,0.38)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  overviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 6,
  },
  cachedDot: { backgroundColor: '#fbbf24' },
  liveText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  overviewDate: {
    color: '#fff7dd',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: { color: '#aebbd0', fontSize: 13, marginLeft: 5 },
  calendarShortcut: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#e6a84b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tithiPanel: {
    marginTop: 18,
    padding: 17,
    borderRadius: 18,
    backgroundColor: 'rgba(230,168,75,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,168,75,0.22)',
  },
  tithiEyebrow: {
    color: '#d5a959',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tithiTitle: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 5,
  },
  tithiMeta: { color: '#bdc8d9', fontSize: 13, marginTop: 4 },
  festivalPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230,168,75,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 12,
  },
  festivalPillText: {
    color: '#ffe3ad',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  timeCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timeCard: {
    width: '48.5%',
    backgroundColor: '#151f34',
    borderRadius: 17,
    padding: 14,
  },
  timeCardHeader: { flexDirection: 'row', alignItems: 'center' },
  timeCardLabel: {
    color: '#aebbd0',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 7,
  },
  timeCardValue: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 10,
  },
  countdownText: { color: '#d5a959', fontSize: 11, marginTop: 4 },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickInfoCard: {
    width: '48.5%',
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 16,
    backgroundColor: 'rgba(21,31,52,0.78)',
  },
  quickInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(230,168,75,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quickInfoLabel: {
    color: '#8795ac',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  quickInfoValue: {
    color: '#f0f4fa',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  nextFestivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderRadius: 17,
    padding: 13,
    backgroundColor: 'rgba(230,168,75,0.10)',
  },
  nextFestivalIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#e6a84b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  nextFestivalTitle: {
    color: '#fff7dd',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  nextFestivalDate: { color: '#aebbd0', fontSize: 11, marginTop: 2 },
  sadhanaCompact: {
    marginHorizontal: 20,
    marginTop: 4,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(12,18,33,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(230,168,75,0.35)',
  },
  compactEyebrow: {
    color: '#e6a84b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  compactTitle: {
    color: '#fff7dd',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  practiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  practiceCompact: {
    width: '48.5%',
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#172238',
  },
  practiceCompactActive: { backgroundColor: '#e6a84b' },
  practiceCompactText: {
    flex: 1,
    color: '#dce4f0',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 7,
  },
  practiceCompactTextActive: { color: '#111827' },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 12,
  },
  quickAction: {
    width: '31.5%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(12,18,33,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(104,122,156,0.3)',
  },
  quickActionText: {
    color: '#e8edf6',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  captureHidden: {
    position: 'absolute',
    left: -1000,
    top: 0,
    width: 360,
  },
  shareCard: {
    width: 360,
    backgroundColor: '#efefef',
    borderRadius: 18,
    padding: 18,
  },
  shareDate: {
    color: '#6a4b16',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  shareCity: {
    color: '#1c2435',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  shareHeadline: {
    color: '#3d2b10',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  shareFestival: {
    color: '#5e3d0a',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '700',
  },
  shareFooter: {
    color: '#7a6645',
    fontSize: 12,
    marginTop: 12,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: 'rgba(12,18,33,0.88)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(104,122,156,0.35)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#fff7dd',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  supportingText: {
    color: '#c2cede',
    fontSize: 14,
    lineHeight: 19,
    marginTop: 4,
  },
  linkText: {
    color: '#ffd68a',
    fontWeight: '700',
  },
  detailHighlight: {
    color: '#ffd899',
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  valueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statusText: {
    marginTop: 10,
  },
  warningText: {
    color: '#fbbf24',
    marginTop: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricBox: {
    width: '48%',
    backgroundColor: '#18233a',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  metricLabel: {
    color: '#9fb1cd',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  primaryButton: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#e6a84b',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7b8aa7',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(104,122,156,0.18)',
  },
  listContent: {
    flex: 1,
    paddingRight: 12,
  },
  listTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  listMeta: {
    color: '#93a2bf',
    fontSize: 12,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#18233a',
    marginRight: 8,
    marginTop: 8,
  },
  choicePillActive: {
    backgroundColor: '#e6a84b',
  },
  choicePillText: {
    color: '#d2dcec',
    fontWeight: '700',
  },
  choicePillTextActive: {
    color: '#111827',
  },
  cityRow: {
    flexDirection: 'row',
    paddingBottom: 6,
  },
  cityChip: {
    backgroundColor: '#18233a',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  cityChipActive: {
    backgroundColor: '#e6a84b',
  },
  cityChipText: {
    color: '#d2dcec',
    fontWeight: '700',
  },
  cityChipTextActive: {
    color: '#111827',
  },
  locationButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(230,168,75,0.5)',
    backgroundColor: 'rgba(230,168,75,0.08)',
  },
  locationButtonText: {
    color: '#ffe1a8',
    fontWeight: '700',
    marginLeft: 8,
  },
  cacheRangeText: {
    color: '#8290a8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
  input: {
    backgroundColor: '#18233a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  halfInput: {
    width: '48%',
  },
  notesInput: {
    minHeight: 120,
    backgroundColor: '#18233a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  calendarWrapper: {
    marginHorizontal: 14,
    marginTop: 8,
  },
  sadhanaCard: {
    borderColor: 'rgba(230,168,75,0.55)',
  },
  sadhanaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(230,168,75,0.16)',
    alignItems: 'center',
  },
  streakNumber: {
    color: '#ffd68a',
    fontSize: 22,
    fontWeight: '900',
  },
  streakLabel: {
    color: '#ffe6ba',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 7,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#29354d',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#e6a84b',
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(104,122,156,0.18)',
  },
  practiceCheck: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#71809b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  practiceCheckActive: {
    backgroundColor: '#e6a84b',
    borderColor: '#e6a84b',
  },
  practiceCheckText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  practiceText: {
    color: '#eef2f8',
    fontSize: 15,
    fontWeight: '600',
  },
  practiceTextComplete: {
    color: '#aab7cb',
    textDecorationLine: 'line-through',
  },
  sadhanaComplete: {
    color: '#ffd68a',
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
});
