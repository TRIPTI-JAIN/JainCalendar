import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import moment from 'moment';
import {
  getDefaultAppState,
  readAppState,
  writeAppState,
} from '../utility/appStorage';
import { DEFAULT_CITIES } from '../utility/jainData';
import { getCopy, getLocaleNameLabel } from '../utility/i18n';

const LOCALES = ['en', 'hi', 'gu'];

const makeCityId = label =>
  String(label || 'city')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `city-${Date.now()}`;

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [appState, setAppState] = useState(getDefaultAppState());
  const [newCityName, setNewCityName] = useState('');
  const [newCityLat, setNewCityLat] = useState('');
  const [newCityLon, setNewCityLon] = useState('');
  const copy = getCopy('settings', appState.locale || 'en');
  const reminderOptions = [
    {
      id: 'navkarsi',
      label:
        appState.locale === 'hi'
          ? 'नवकारसी रिमाइंडर'
          : appState.locale === 'gu'
            ? 'નવકારસી રિમાઇન્ડર'
            : 'Navkarsi Reminder',
      description:
        appState.locale === 'hi'
          ? 'नवकारसी शुरू होने पर अलर्ट दें।'
          : appState.locale === 'gu'
            ? 'નવકારસી શરૂ થાય ત્યારે અલર્ટ આપો.'
            : 'Alert when the navkarsi window starts.',
    },
    {
      id: 'sunset',
      label:
        appState.locale === 'hi'
          ? 'सूर्यास्त रिमाइंडर'
          : appState.locale === 'gu'
            ? 'સૂર્યાસ્ત રિમાઇન્ડર'
            : 'Sunset Reminder',
      description:
        appState.locale === 'hi'
          ? 'दिन समाप्त होने से पहले अलर्ट दें।'
          : appState.locale === 'gu'
            ? 'દિવસ પૂરું થાય તે પહેલાં અલર્ટ આપો.'
            : 'Alert before the day closes.',
    },
    {
      id: 'parna',
      label:
        appState.locale === 'hi'
          ? 'पारण रिमाइंडर'
          : appState.locale === 'gu'
            ? 'પારણા રિમાઇન્ડર'
            : 'Parna Reminder',
      description:
        appState.locale === 'hi'
          ? 'अगले उपवास पूर्ण होने के समय के लिए तैयारी करें।'
          : appState.locale === 'gu'
            ? 'આગામી ઉપવાસ પૂર્ણ સમય માટે તૈયારી કરો.'
            : 'Prepare for the next fasting completion window.',
    },
    {
      id: 'festival',
      label:
        appState.locale === 'hi'
          ? 'पर्व रिमाइंडर'
          : appState.locale === 'gu'
            ? 'પર્વ રિમાઇન્ડર'
            : 'Festival Reminder',
      description:
        appState.locale === 'hi'
          ? 'दिन के जैन पर्व का रिमाइंडर दिखाएं।'
          : appState.locale === 'gu'
            ? 'દિવસના જૈન પર્વનું રિમાઇન્ડર બતાવો.'
            : 'Show the day’s Jain festival reminder.',
    },
  ];

  const loadState = useCallback(async () => {
    const stored = await readAppState();
    setAppState({
      ...stored,
      cities: stored.cities.length ? stored.cities : DEFAULT_CITIES,
      activeCityId:
        stored.activeCityId ||
        stored.cities?.[0]?.id ||
        DEFAULT_CITIES[0].id,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadState();
    }, [loadState]),
  );

  const persist = async nextState => {
    setAppState(nextState);
    await writeAppState(nextState);
  };

  const handleLocaleChange = async locale => {
    await persist({
      ...appState,
      locale,
    });
  };

  const handleReminderToggle = async reminderId => {
    await persist({
      ...appState,
      reminders: {
        ...appState.reminders,
        [reminderId]: !appState.reminders[reminderId],
      },
    });
  };

  const handleSelectCity = async cityId => {
    await persist({
      ...appState,
      activeCityId: cityId,
    });
  };

  const handleAddCity = async () => {
    const lat = Number(newCityLat);
    const lon = Number(newCityLon);

    if (!newCityName.trim() || Number.isNaN(lat) || Number.isNaN(lon)) {
      Alert.alert('Invalid city', 'Enter a valid city name, latitude, and longitude.');
      return;
    }

    const nextCity = {
      id: makeCityId(newCityName),
      name: newCityName.trim(),
      lat,
      lon,
      source: 'manual',
    };

    await persist({
      ...appState,
      activeCityId: nextCity.id,
      cities: [nextCity, ...appState.cities.filter(city => city.id !== nextCity.id)],
    });

    setNewCityName('');
    setNewCityLat('');
    setNewCityLon('');
  };

  const handleRemoveCity = cityId => {
    const remaining = appState.cities.filter(city => city.id !== cityId);
    const nextCities = remaining.length ? remaining : DEFAULT_CITIES;
    const nextActive =
      appState.activeCityId === cityId
        ? nextCities[0]?.id || DEFAULT_CITIES[0].id
        : appState.activeCityId;

    Alert.alert('Remove city', 'Delete this city from saved locations?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await persist({
            ...appState,
            cities: nextCities,
            activeCityId: nextActive,
          });
        },
      },
    ]);
  };

  const handleClearJournal = () => {
    Alert.alert('Clear Notes', 'Remove all saved journal entries?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await persist({
            ...appState,
            notes: {},
          });
        },
      },
    ]);
  };

  const handleClearOfflineCache = () => {
    Alert.alert('Clear Offline Cache', 'Remove saved dashboard cache for all cities?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await persist({
            ...appState,
            dashboardCache: {},
          });
        },
      },
    ]);
  };

  const activeCity = appState.cities.find(city => city.id === appState.activeCityId);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>{copy.back}</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <Text style={styles.title}>{copy.title}</Text>
          <View />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.language}</Text>
          <View style={styles.pillRow}>
            {LOCALES.map(locale => (
              <TouchableOpacity
                key={locale}
                style={[
                  styles.pill,
                  appState.locale === locale ? styles.pillActive : null,
                ]}
                onPress={() => handleLocaleChange(locale)}
              >
                <Text
                  style={[
                    styles.pillText,
                    appState.locale === locale ? styles.pillTextActive : null,
                  ]}
                >
                  {getLocaleNameLabel(locale, appState.locale || 'en')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.reminderSettings}</Text>
          {reminderOptions.map(reminder => (
            <View key={reminder.id} style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{reminder.label}</Text>
                <Text style={styles.rowDescription}>
                  {reminder.description}
                </Text>
              </View>
              <Switch
                value={Boolean(appState.reminders[reminder.id])}
                onValueChange={() => handleReminderToggle(reminder.id)}
                trackColor={{ false: '#45556f', true: '#e6a84b' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.savedCities}</Text>
          <Text style={styles.caption}>
            {copy.activeCity}: {activeCity?.name || 'None'} · {appState.cities.length}{' '}
            {copy.saved}
          </Text>
          {appState.cities.map(city => (
            <View key={city.id} style={styles.cityRow}>
              <TouchableOpacity
                style={styles.cityInfo}
                onPress={() => handleSelectCity(city.id)}
              >
                <Text style={styles.rowTitle}>
                  {city.name}
                  {appState.activeCityId === city.id
                    ? `  ${copy.activeCity}`
                    : ''}
                </Text>
                <Text style={styles.rowDescription}>
                  {city.lat}, {city.lon}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveCity(city.id)}
              >
                <Text style={styles.removeButtonText}>{copy.remove}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TextInput
            value={newCityName}
            onChangeText={setNewCityName}
            placeholder={copy.cityName}
            placeholderTextColor="#7f8ca5"
            style={styles.input}
          />
          <View style={styles.inlineInputs}>
            <TextInput
              value={newCityLat}
              onChangeText={setNewCityLat}
              placeholder={copy.latitude}
              placeholderTextColor="#7f8ca5"
              keyboardType="numeric"
              style={[styles.input, styles.halfInput]}
            />
            <TextInput
              value={newCityLon}
              onChangeText={setNewCityLon}
              placeholder={copy.longitude}
              placeholderTextColor="#7f8ca5"
              keyboardType="numeric"
              style={[styles.input, styles.halfInput]}
            />
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAddCity}>
            <Text style={styles.primaryButtonText}>{copy.addCity}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.storageData}</Text>
          <Text style={styles.caption}>
            {copy.journalEntries}: {Object.keys(appState.notes || {}).length}
          </Text>
          <Text style={styles.caption}>
            {copy.offlineCityCache}:{' '}
            {Object.keys(appState.dashboardCache || {}).length}
          </Text>
          <Text style={styles.caption}>
            {copy.lastChecked}: {moment().format('MMM D, YYYY hh:mm A')}
          </Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleClearJournal}
          >
            <Text style={styles.secondaryButtonText}>{copy.clearJournal}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleClearOfflineCache}
          >
            <Text style={styles.secondaryButtonText}>
              {copy.clearOfflineCache}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 42,
  },
  backText: {
    color: '#d8e6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    color: '#fff7dd',
    fontSize: 22,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#101726',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#223049',
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#fff7dd',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  caption: {
    color: '#9fb1cd',
    fontSize: 13,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: '#1a2740',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: {
    backgroundColor: '#e6a84b',
  },
  pillText: {
    color: '#d7e0ee',
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(104,122,156,0.18)',
  },
  rowContent: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  rowDescription: {
    color: '#9fb1cd',
    fontSize: 13,
    marginTop: 4,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(104,122,156,0.18)',
  },
  cityInfo: {
    flex: 1,
    paddingRight: 12,
  },
  removeButton: {
    backgroundColor: '#2b1b1b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeButtonText: {
    color: '#ffb4b4',
    fontWeight: '700',
  },
  inlineInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: '#1a2740',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  halfInput: {
    width: '48%',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#e6a84b',
    borderRadius: 14,
    paddingVertical: 13,
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#687a9c',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
});
