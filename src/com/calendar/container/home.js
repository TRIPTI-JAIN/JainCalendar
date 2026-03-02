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
  openSettings,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import Video from 'react-native-video';
import { getSunriseSunset, getCityFromCoords, addMinutesToSunrise, getQuarterAfterSunrise } from '../utility';
import PanchangCalendar from './panchangCalendar';
import { readAppState, writeAppState, getDefaultAppState } from '../utility/appStorage';
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

const TODAY_KEY = moment().format('YYYY-MM-DD');

const FASTING_OPTIONS = ['None', 'Upvas', 'Ekasana', 'Beasana'];

const makeCityId = label =>
  String(label || 'city')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `city-${Date.now()}`;

const Home = () => {
  const navigation = useNavigation();
  const shareCardRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [locationPermissionBlocked, setLocationPermissionBlocked] =
    useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [appState, setAppState] = useState(getDefaultAppState());
  const [newCityName, setNewCityName] = useState('');
  const [newCityLat, setNewCityLat] = useState('');
  const [newCityLon, setNewCityLon] = useState('');

  const locale = appState.locale || 'en';
  const copy = getCopy('home', locale);
  const activeCity =
    appState.cities.find(city => city.id === appState.activeCityId) ||
    appState.cities[0] ||
    DEFAULT_CITIES[0];
  const todaysNote = appState.notes?.[TODAY_KEY] || '';
  const fastingSelection = appState.fasting?.[TODAY_KEY] || 'None';

  const upcomingFestivals = useMemo(() => {
    if (!activeCity) return [];
    return buildUpcomingFestivals(
      moment(),
      activeCity.lat || DEFAULT_COORDS.lat,
      activeCity.lon || DEFAULT_COORDS.lon,
      180,
    )
      .slice(0, 6)
      .map(item => translateDaySummary(item, locale));
  }, [activeCity, locale]);

  const localizedToday = useMemo(
    () =>
      dashboard?.today ? translateDaySummary(dashboard.today, locale) : null,
    [dashboard, locale],
  );

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const scheduleNotification = async ({ timeString, title, body, daysAhead = 0 }) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission || Platform.OS !== 'android') return;

    const module = NativeModules.NavkarsiNotification;
    const triggerAtMillis = parseLocalTimeToNextTimestamp(timeString, daysAhead);
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

  const buildDashboardPayload = async city => {
    const sunData = await getSunriseSunset(city.lat, city.lon);
    if (!sunData) {
      throw new Error('Could not fetch sunrise/sunset for this city.');
    }

    const today = buildDaySummary(moment(), city.lat, city.lon);
    const navkarsiTime = addMinutesToSunrise(sunData.sunrise);
    const porsiTime = getQuarterAfterSunrise(sunData.sunrise, sunData.sunset);

    return {
      cityId: city.id,
      cityName: city.name,
      latitude: city.lat,
      longitude: city.lon,
      sunrise: sunData.sunrise,
      sunset: sunData.sunset,
      navkarsiTime,
      porsiTime,
      updatedAt: new Date().toISOString(),
      today: {
        ...today,
        sunriseLabel: sunData.sunrise,
        sunsetLabel: sunData.sunset,
      },
    };
  };

  const applyDashboard = payload => {
    setDashboard(payload);
    setStatus('ready');
  };

  const bootstrap = async () => {
    const stored = await readAppState();
    const nextState = {
      ...stored,
      cities: stored.cities.length ? stored.cities : DEFAULT_CITIES,
      activeCityId:
        stored.activeCityId ||
        stored.cities?.[0]?.id ||
        DEFAULT_CITIES[0].id,
    };

    await persistAppState(nextState);
    await loadDashboardForCity(
      nextState.cities.find(city => city.id === nextState.activeCityId) ||
        nextState.cities[0],
      nextState,
      { preferCurrentLocation: true },
    );
  };

  const getCurrentLocation = () =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });

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
            (await getCityFromCoords(latitude, longitude)) || 'Current Location';

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

      const payload = await buildDashboardPayload(resolvedCity);
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

  const handleSelectCity = async city => {
    const nextState = {
      ...appState,
      activeCityId: city.id,
    };
    await persistAppState(nextState);
    await loadDashboardForCity(city, nextState);
  };

  const handleAddCity = async () => {
    const lat = Number(newCityLat);
    const lon = Number(newCityLon);
    if (!newCityName.trim() || Number.isNaN(lat) || Number.isNaN(lon)) {
      setErrorMessage('Enter a city name, latitude, and longitude.');
      return;
    }

    const nextCity = {
      id: makeCityId(newCityName),
      name: newCityName.trim(),
      lat,
      lon,
      source: 'manual',
    };
    const nextState = {
      ...appState,
      activeCityId: nextCity.id,
      cities: [
        nextCity,
        ...appState.cities.filter(city => city.id !== nextCity.id),
      ],
    };

    setNewCityName('');
    setNewCityLat('');
    setNewCityLon('');
    await persistAppState(nextState);
    await loadDashboardForCity(nextCity, nextState);
  };

  const handleReminderToggle = async key => {
    const nextState = {
      ...appState,
      reminders: {
        ...appState.reminders,
        [key]: !appState.reminders[key],
      },
    };
    await persistAppState(nextState);
    if (dashboard) {
      await scheduleConfiguredReminders(dashboard, nextState.reminders);
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

  const handleLocaleChange = async nextLocale => {
    await updateAppState({
      ...appState,
      locale: nextLocale,
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
          <Text style={[styles.valueText, styles.statusText]}>Loading data...</Text>
        </View>
      );
    }

    if (status === 'permission_denied' || status === 'error') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy.liveDataError}</Text>
          <Text style={styles.supportingText}>{errorMessage}</Text>
          <View style={styles.inlineRow}>
            <TouchableOpacity onPress={handleRetry} style={styles.primaryButton}>
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
            <View style={styles.hamburgerIcon}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshPill}>
            <Text style={styles.refreshPillText}>
              {isRefreshing ? '...' : copy.refresh}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>{copy.language}</Text>
          <View style={styles.localeRow}>
            {['en', 'hi', 'gu'].map(item => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.localeChip,
                  locale === item ? styles.localeChipActive : null,
                ]}
                onPress={() => handleLocaleChange(item)}
              >
                <Text
                  style={[
                    styles.localeChipText,
                    locale === item ? styles.localeChipTextActive : null,
                  ]}
                >
                  {item.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.heroTitle}>{copy.title}</Text>
          <Text style={styles.heroSubtitle}>
            {copy.today}, {copy.tithi}, {copy.festival}, reminders, saved
            cities, notes, and a shareable summary in one place.
          </Text>
        </View>

        {status !== 'ready' && status !== 'offline' ? renderStatusCard() : null}

        {dashboard ? (
          <>
            <ViewShot
              ref={shareCardRef}
              options={{ format: 'png', quality: 1 }}
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
                <View style={styles.metricGrid}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>{copy.sunrise}</Text>
                    <Text style={styles.metricValue}>{dashboard.sunrise}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>{copy.sunset}</Text>
                    <Text style={styles.metricValue}>{dashboard.sunset}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>{copy.navkarsi}</Text>
                    <Text style={styles.metricValue}>
                      {dashboard.navkarsiTime}
                    </Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>{copy.porsi}</Text>
                    <Text style={styles.metricValue}>
                      {dashboard.porsiTime}
                    </Text>
                  </View>
                </View>
                {localizedToday?.festival ? (
                  <Text style={styles.shareFestival}>
                    {copy.festival}: {localizedToday.festival.title}
                  </Text>
                ) : null}
                <Text style={styles.shareFooter}>
                  {usingCachedData ? 'Offline cache' : 'Live'} · Updated{' '}
                  {moment(dashboard.updatedAt).format('MMM D, hh:mm A')}
                </Text>
              </View>
            </ViewShot>

            <TouchableOpacity
              onPress={handleShare}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>{copy.share}</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{dashboard.cityName}</Text>
              <Text style={styles.supportingText}>
                {usingCachedData
                  ? 'Offline-first cache in use.'
                  : 'Live city dashboard.'}
              </Text>
              <Text style={styles.supportingText}>
                Updated{' '}
                {moment(dashboard.updatedAt).format('MMM D, YYYY hh:mm A')}
              </Text>
              {errorMessage ? (
                <Text style={styles.warningText}>{errorMessage}</Text>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.today}</Text>
              <View style={styles.metricGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{copy.tithi}</Text>
                  <Text style={styles.metricValue}>
                    {localizedToday?.tithi}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{copy.paksha}</Text>
                  <Text style={styles.metricValue}>
                    {localizedToday?.paksha}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{copy.sunrise}</Text>
                  <Text style={styles.metricValue}>{dashboard.sunrise}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{copy.sunset}</Text>
                  <Text style={styles.metricValue}>{dashboard.sunset}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{copy.navkarsi}</Text>
                  <Text style={styles.metricValue}>
                    {dashboard.navkarsiTime}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{copy.porsi}</Text>
                  <Text style={styles.metricValue}>{dashboard.porsiTime}</Text>
                </View>
              </View>
              <Text style={styles.supportingText}>
                {copy.lunarMonth}: {localizedToday?.moonMasa}
              </Text>
              {localizedToday?.festival ? (
                <TouchableOpacity
                  onPress={() => openFestivalDetail(dashboard.today)}
                >
                  <Text style={[styles.supportingText, styles.linkText]}>
                    {copy.festival}: {localizedToday.festival.title}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.supportingText}>
                  {copy.festival}: {copy.noneToday}
                </Text>
              )}
              {localizedToday?.festival ? (
                <Text style={styles.detailHighlight}>
                  {localizedToday.festival.significance}
                </Text>
              ) : null}
              <Text style={styles.supportingText}>
                {copy.fastingMarker}:{' '}
                {localizedToday?.fasting?.title || copy.noMarker}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.upcomingFestivals}</Text>
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
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.fastingAssistant}</Text>
              <Text style={styles.supportingText}>
                Track your daily observance and pair it with reminder
                preferences.
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
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.cityManager}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.cityRow}>
                  {appState.cities.map(city => (
                    <TouchableOpacity
                      key={city.id}
                      style={[
                        styles.cityChip,
                        activeCity?.id === city.id
                          ? styles.cityChipActive
                          : null,
                      ]}
                      onPress={() => handleSelectCity(city)}
                    >
                      <Text
                        style={[
                          styles.cityChipText,
                          activeCity?.id === city.id
                            ? styles.cityChipTextActive
                            : null,
                        ]}
                      >
                        {city.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TextInput
                value={newCityName}
                onChangeText={setNewCityName}
                placeholder={copy.cityName}
                placeholderTextColor="#7f8ca5"
                style={styles.input}
              />
              <View style={styles.inlineRow}>
                <TextInput
                  value={newCityLat}
                  onChangeText={setNewCityLat}
                  placeholder={copy.latitude}
                  placeholderTextColor="#7f8ca5"
                  style={[styles.input, styles.halfInput]}
                  keyboardType="numeric"
                />
                <TextInput
                  value={newCityLon}
                  onChangeText={setNewCityLon}
                  placeholder={copy.longitude}
                  placeholderTextColor="#7f8ca5"
                  style={[styles.input, styles.halfInput]}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                onPress={handleAddCity}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>{copy.addCity}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.reminderSettings}</Text>
              {[
                ['navkarsi', copy.navkarsiAlerts],
                ['sunset', copy.sunsetAlerts],
                ['parna', copy.parnaAlerts],
                ['festival', copy.festivalAlerts],
              ].map(([key, label]) => (
                <View key={key} style={styles.listRow}>
                  <Text style={styles.listTitle}>{label}</Text>
                  <Switch
                    value={Boolean(appState.reminders[key])}
                    onValueChange={() => handleReminderToggle(key)}
                    trackColor={{ false: '#475569', true: '#e6a84b' }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.notes}</Text>
              <TextInput
                multiline
                value={todaysNote}
                onChangeText={handleNoteChange}
                placeholder={copy.notesPlaceholder}
                placeholderTextColor="#7f8ca5"
                style={styles.notesInput}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{copy.yearView}</Text>
              <Text style={styles.supportingText}>
                Monthly calendar, year festival preview, and date/festival
                search are available below.
              </Text>
            </View>

            <View style={styles.calendarWrapper}>
              <PanchangCalendar
                lat={dashboard.latitude}
                lon={dashboard.longitude}
                locale={locale}
              />
            </View>
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
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
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
  shareCard: {
    marginHorizontal: 20,
    marginBottom: 12,
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
});
