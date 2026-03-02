import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import {
  DEFAULT_COORDS,
  buildMonthData,
  buildCalendarGrid,
  buildYearFestivals,
  findDayByQuery,
} from '../utility/jainData';

const width = Dimensions.get('window').width;
const cellW = Math.max(44, (width - 40) / 7);
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PanchangCalendar({ lat, lon }) {
  const navigation = useNavigation();
  const [current, setCurrent] = useState(moment());
  const [monthData, setMonthData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [yearFestivals, setYearFestivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    try {
      const latitude = typeof lat === 'number' ? lat : DEFAULT_COORDS.lat;
      const longitude = typeof lon === 'number' ? lon : DEFAULT_COORDS.lon;
      const nextMonthData = buildMonthData(current, latitude, longitude);
      const todayStr = moment().format('YYYY-MM-DD');

      setMonthData(nextMonthData);
      setYearFestivals(buildYearFestivals(current.year(), latitude, longitude));
      setSelected(previous => {
        const selectedDate = previous?.date;
        return (
          nextMonthData.find(item => item.date === selectedDate) ||
          nextMonthData.find(item => item.date === todayStr) ||
          nextMonthData[0] ||
          null
        );
      });
    } catch (nextError) {
      console.error('Failed to generate calendar:', nextError);
      setMonthData([]);
      setSelected(null);
      setYearFestivals([]);
      setError('Could not load calendar data.');
    } finally {
      setLoading(false);
    }
  }, [current, lat, lon]);

  const calArr = useMemo(
    () => buildCalendarGrid(current, monthData),
    [current, monthData],
  );

  const handleSearch = () => {
    const match =
      findDayByQuery(searchQuery, monthData) ||
      findDayByQuery(searchQuery, yearFestivals);
    if (match) {
      setCurrent(moment(match.date));
      setSelected(match);
    }
  };

  const renderHeader = () =>
    days.map(day => (
      <View key={day} style={[styles.cell, styles.headerCell]}>
        <Text style={styles.headerText}>{day}</Text>
      </View>
    ));

  const renderCell = ({ item }) => {
    if (!item) return <View style={[styles.cell, styles.emptyCell]} />;

    const dayNumber = moment(item.date).date();
    const isToday = item.date === moment().format('YYYY-MM-DD');
    const isSelected = selected?.date === item.date;

    return (
      <TouchableOpacity
        style={[
          styles.cell,
          styles.dayCell,
          isToday ? styles.todayCell : null,
          isSelected ? styles.selectedCell : null,
        ]}
        onPress={() => setSelected(item)}
      >
        <Text style={styles.dn}>{dayNumber}</Text>
        {item.festival ? <View style={styles.festivalDot} /> : null}
        {item.fasting ? <View style={styles.fastingDot} /> : null}
        <Text style={styles.tithi} numberOfLines={1}>
          {item.tithi}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.loaderText}>Loading Jain calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarContainer}>
          {navigation.canGoBack() ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>{'< Back'}</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.monthRow}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setCurrent(value => moment(value).subtract(1, 'month'))}
            >
              <Text style={styles.navText}>{'< Prev'}</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{current.format('MMMM YYYY')}</Text>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setCurrent(value => moment(value).add(1, 'month'))}
            >
              <Text style={styles.navText}>{'Next >'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search date, tithi, festival"
              placeholderTextColor="#8391ab"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Go</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.festivalDotLegend} />
              <Text style={styles.legendText}>Festival</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.fastingDotLegend} />
              <Text style={styles.legendText}>Fasting</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.todayLegend} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>

          <View style={styles.row}>{renderHeader()}</View>
          <FlatList
            data={calArr}
            renderItem={renderCell}
            keyExtractor={(_, index) => String(index)}
            numColumns={7}
            scrollEnabled={false}
          />

          {selected ? (
            <View style={styles.detail}>
              <Text style={styles.detailDate}>
                {moment(selected.date).format('dddd, MMM D')}
              </Text>
              <Text style={styles.detailText}>Tithi: {selected.tithi}</Text>
              <Text style={styles.detailText}>Paksha: {selected.paksha}</Text>
              <Text style={styles.detailText}>
                Lunar Month: {selected.moonMasa}
              </Text>
              <Text style={styles.detailText}>Sunrise: {selected.sunriseLabel}</Text>
              <Text style={styles.detailText}>Sunset: {selected.sunsetLabel}</Text>
              {selected.festival ? (
                <Text style={styles.detailFest}>
                  Festival: {selected.festival.title}
                </Text>
              ) : null}
              {selected.fasting ? (
                <Text style={styles.detailFast}>
                  Fasting: {selected.fasting.title}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.yearSection}>
            <Text style={styles.yearTitle}>Year Festival View</Text>
            {yearFestivals.slice(0, 8).map(item => (
              <TouchableOpacity
                key={`${item.date}-${item.festival?.id}`}
                style={styles.yearRow}
                onPress={() => {
                  setCurrent(moment(item.date));
                  setSelected(item);
                }}
              >
                <View style={styles.yearContent}>
                  <Text style={styles.yearFestivalName}>
                    {item.festival?.title}
                  </Text>
                  <Text style={styles.yearFestivalMeta}>
                    {moment(item.date).format('MMM D, YYYY')} · {item.tithi}
                  </Text>
                </View>
                <Text style={styles.yearFestivalArrow}>View</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 28,
  },
  calendarContainer: {
    backgroundColor: '#101726',
    borderRadius: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#223049',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 14,
    marginTop: 4,
    marginBottom: 2,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  backButtonText: {
    color: '#d8e6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  navButton: {
    minWidth: 64,
  },
  navText: { color: '#bdd7ff', fontSize: 14, fontWeight: '600' },
  monthTitle: { color: '#fff7dd', fontSize: 18, fontWeight: '800' },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1a2740',
    color: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginRight: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#e6a84b',
    borderRadius: 14,
    minWidth: 78,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 12,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    color: '#d2dae8',
    marginLeft: 6,
    fontSize: 13,
  },
  todayLegend: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ea8ff',
  },
  festivalDotLegend: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f6b84c',
  },
  fastingDotLegend: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5ad584',
  },
  row: { flexDirection: 'row' },
  cell: {
    width: cellW,
    minHeight: 78,
    borderWidth: 0.7,
    borderColor: '#31415f',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 7,
    paddingHorizontal: 2,
    position: 'relative',
  },
  dayCell: { backgroundColor: '#172235' },
  todayCell: { borderColor: '#4ea8ff', borderWidth: 1.5 },
  selectedCell: { backgroundColor: '#223049' },
  emptyCell: { backgroundColor: '#101726' },
  headerCell: {
    backgroundColor: '#223049',
    height: 42,
    justifyContent: 'center',
  },
  headerText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  dn: { color: '#fff', fontSize: 15, fontWeight: '800' },
  tithi: {
    color: '#d7deeb',
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
    width: '95%',
  },
  festivalDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f6b84c',
  },
  fastingDot: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5ad584',
  },
  detail: {
    backgroundColor: '#162131',
    padding: 18,
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 16,
  },
  detailDate: { color: '#fff', fontSize: 17, fontWeight: '800' },
  detailText: { color: '#d2dae8', fontSize: 15, marginTop: 6 },
  detailFest: { color: '#ffd68a', fontSize: 15, marginTop: 10, fontWeight: '700' },
  detailFast: { color: '#8df0af', fontSize: 15, marginTop: 8, fontWeight: '700' },
  yearSection: {
    marginHorizontal: 14,
    marginBottom: 4,
    paddingTop: 16,
  },
  yearTitle: {
    color: '#fff7dd',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  yearRow: {
    backgroundColor: '#172235',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yearContent: {
    flex: 1,
    paddingRight: 12,
  },
  yearFestivalName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  yearFestivalMeta: {
    color: '#b7c2d8',
    marginTop: 4,
    fontSize: 13,
  },
  yearFestivalArrow: {
    color: '#f6b84c',
    fontWeight: '800',
    fontSize: 15,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loaderText: {
    marginTop: 8,
    color: '#ddd',
    fontSize: 13,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
});
