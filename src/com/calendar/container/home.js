import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import Geolocation from 'react-native-geolocation-service';
import { SafeAreaView } from 'react-native-safe-area-context'; // or from 'react-native'
import Icon from 'react-native-vector-icons/Feather';

import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Video from 'react-native-video';
import {
  getSunriseSunset,
  getCityFromCoords,
  getQuarterAfterSunrise,
  addMinutesToSunrise,
} from '../utility';
import PanchangCalendar from './panchangCalendar';

const Home = () => {
  const [sunrise, setSunrise] = useState('');
  const [sunset, setSunset] = useState('');
  const [city, setCity] = useState('');
  const [porsiTime, setPorsiTime] = useState('');
  const [navkarsiTime, setNavkarsiTime] = useState('');
  const navigation = useNavigation();
  useEffect(() => {
    getLocation();
  }, []);

  const requestPermission = async () => {
    let permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    const result = await request(permission);

    return result === RESULTS.GRANTED;
  };

  const getLocation = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;

        const result = await getSunriseSunset(latitude, longitude);
        if (result) {
          const { sunrise, sunset } = result;
          setSunrise(sunrise);
          setSunset(sunset);

          // ✅ Use the fetched strings directly, NOT the state values
          const quarterAfterSunrise = getQuarterAfterSunrise(sunrise, sunset);
          setPorsiTime(quarterAfterSunrise);
          const timeAfter48Min = addMinutesToSunrise(sunrise);
          console.log('⏰ 48 minutes after sunrise:', timeAfter48Min);
          setNavkarsiTime(timeAfter48Min);
          console.log('Quarter after sunrise:', quarterAfterSunrise);
        }

        const cityName = await getCityFromCoords(latitude, longitude);
        setCity(cityName);
      },
      error => {
        console.error(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Video
        source={require('../assets/video/newBack.mp4')} // or use a remote URL
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        muted
        ignoreSilentSwitch="obey"
      />

      <ScrollView>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <Icon name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            {/* <Text style={styles.headerTitle}>Home</Text> */}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.headerText}>
              🌞 Sunrise & Sunset Tracker App
            </Text>
          </View>

          {/* Info Section */}
          <View style={styles.content}>
            {/* <View style={styles.card}>
          <Text style={styles.label}>📍 City</Text>
          <Text style={styles.value}>{city || 'Loading...'}</Text>
        </View> */}

            <View style={styles.card}>
              <Text style={styles.label}>🌅 Sunrise</Text>
              <Text style={styles.value}>{sunrise || 'Loading...'}</Text>
              <Text style={styles.value}>🌤 Navkarsi time: {navkarsiTime}</Text>
              <Text style={styles.value}>🌤 Porsi time: {porsiTime}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>🌇 Sunset</Text>
              <Text style={styles.value}>{sunset || 'Loading...'}</Text>
            </View>
            <View style={styles.calendarWrapper}>
              <PanchangCalendar />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  calendarWrapper: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  sectionHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#2c2c2e',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  label: {
    color: '#bbb',
    fontSize: 16,
    marginBottom: 6,
  },
  value: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  topBar: {
    height: 60,
    // backgroundColor: '#2c2c2e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: '#444',
  },

  hamburgerIcon: {
    fontSize: 36,
    color: '#fff',
  },

  topBarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
