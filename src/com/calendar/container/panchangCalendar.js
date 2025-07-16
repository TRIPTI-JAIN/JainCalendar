import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import moment from 'moment';
import { fetchMonthlyPanchang, generateCalendarDays } from '../utility';

const width = Dimensions.get('window').width;
const cellW = width / 7;
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PanchangCalendar({ lat = 12.9716, lon = 77.5946 }) {
  const isDark = useColorScheme() === 'dark';

  const [current, setCurrent] = useState(moment());
  const [panchang, setPanchang] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [current]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchMonthlyPanchang(
        current.year(),
        current.month() + 1,
        lat,
        lon,
        current.utcOffset() / 60,
      );
      setPanchang(data);
    } catch (e) {
      // alert('API error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const calArr = generateCalendarDays(current, panchang);

  const renderHeader = () =>
    days.map((d, i) => (
      <View key={i} style={[styles.cell, styles.headerCell]}>
        <Text style={styles.headerText}>{d}</Text>
      </View>
    ));

  const renderCell = ({ item }) => {
    if (!item) return <View style={[styles.cell, styles.emptyCell]} />;
    const dn = moment(item.date).date();
    const isToday = item.date === moment().format('YYYY-MM-DD');
    const bg = item.festival ? '#333533' : isToday ? '#444a66' : '#222';

    return (
      <TouchableOpacity
        style={[styles.cell, { backgroundColor: bg }]}
        onPress={() => setSelected(item)}
      >
        <Text style={styles.dn}>{dn}</Text>
        {item.tithi && (
          <Text style={styles.tithi} numberOfLines={1}>
            {item.tithi}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading)
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;

  return (
    <View style={styles.calendarContainer}>
      <View style={[styles.container]}>
        {/* Month Switch */}
        <View style={styles.monthRow}>
          <TouchableOpacity
            onPress={() => setCurrent(m => moment(m).subtract(1, 'month'))}
          >
            <Text style={styles.navText}>{'< Prev'}</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{current.format('MMMM YYYY')}</Text>
          <TouchableOpacity
            onPress={() => setCurrent(m => moment(m).add(1, 'month'))}
          >
            <Text style={styles.navText}>{'Next >'}</Text>
          </TouchableOpacity>
        </View>

        {/* Weekdays */}
        <View style={styles.row}>{renderHeader()}</View>

        {/* Calendar */}
        <FlatList
          data={calArr}
          renderItem={renderCell}
          keyExtractor={(_, i) => String(i)}
          numColumns={7}
          scrollEnabled={false}
        />

        {/* Detail panel */}
        {selected && (
          <View style={styles.detail}>
            <Text style={styles.detailDate}>
              {moment(selected.date).format('dddd, MMM D')}
            </Text>
            <Text style={styles.detailText}>
              Tithi: {selected.tithi || '—'}
            </Text>
            <Text style={styles.detailText}>
              Sunrise: {selected.sunrise || '—'}
            </Text>
            <Text style={styles.detailText}>
              Sunset: {selected.sunset || '—'}
            </Text>
            {selected.festival && (
              <Text style={styles.detailFest}>🎉 {selected.festival}</Text>
            )}
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#111' },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  calendarContainer: {
    marginHorizontal: 16, // ⬅️ Horizontal spacing from screen edges
    marginBottom: 24, // ⬇️ Spacing from bottom content
    marginTop: 12, // ⬆️ Spacing from top block (like sunrise/sunset)
    backgroundColor: '#111', // Optional, make it dark mode friendly
    borderRadius: 12, // Rounded corners for nicer visual
    paddingVertical: 12, // Internal spacing (top & bottom inside container)
  },
  navText: { color: '#bbb', fontSize: 14 },
  monthTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  row: { flexDirection: 'row' },
  cell: {
    width: cellW,
    height: 80,
    borderWidth: 0.3,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCell: { backgroundColor: '#111' },
  headerCell: { backgroundColor: '#333' },
  headerText: { color: '#fff', fontWeight: '600' },
  dn: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tithi: { color: '#ccc', fontSize: 10, marginTop: 4, textAlign: 'center' },
  detail: {
    backgroundColor: '#222',
    padding: 16,
    margin: 12,
    borderRadius: 8,
  },
  detailDate: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  detailText: { color: '#ddd', fontSize: 14, marginTop: 4 },
  detailFest: { color: '#f1c40f', fontSize: 14, marginTop: 6 },
  close: { color: '#3498db', marginTop: 8, textAlign: 'right' },
});
