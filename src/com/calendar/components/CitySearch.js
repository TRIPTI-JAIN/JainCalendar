import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { getCityDisplayName, searchCities } from '../utility/citySearch';

const CitySearch = ({ locale = 'en', onSelect, copy }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const cleaned = query.trim();

    if (cleaned.length < 2) {
      setResults([]);
      setError('');
      return () => controller.abort();
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        setResults(await searchCities(cleaned, locale, controller.signal));
      } catch (searchError) {
        if (searchError.name !== 'AbortError') {
          setError(copy.citySearchError);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [copy.citySearchError, locale, query]);

  const handleSelect = city => {
    onSelect(city);
    setQuery('');
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputShell}>
        <Icon name="search" size={18} color="#91a1bb" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={copy.citySearchPlaceholder}
          placeholderTextColor="#71809b"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.input}
        />
        {loading ? <ActivityIndicator size="small" color="#e6a84b" /> : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && query.trim().length >= 2 && !error && !results.length ? (
        <Text style={styles.empty}>{copy.noCitiesFound}</Text>
      ) : null}

      {results.length ? (
        <View style={styles.results}>
          {results.map(city => (
            <TouchableOpacity
              key={city.id}
              style={styles.resultRow}
              onPress={() => handleSelect(city)}
            >
              <View style={styles.pin}>
                <Icon name="map-pin" size={16} color="#e6a84b" />
              </View>
              <View style={styles.resultCopy}>
                <Text style={styles.resultName}>{city.name}</Text>
                <Text style={styles.resultMeta} numberOfLines={1}>
                  {getCityDisplayName({ ...city, name: null })}
                </Text>
              </View>
              <Icon name="plus" size={19} color="#e6a84b" />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
};

export default CitySearch;

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  inputShell: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#18233a',
    borderWidth: 1,
    borderColor: '#2b3b58',
  },
  input: { flex: 1, color: '#fff', fontSize: 15, marginHorizontal: 10 },
  results: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2b3b58',
  },
  resultRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#121d31',
    borderBottomWidth: 1,
    borderBottomColor: '#26334a',
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(230,168,75,0.10)',
  },
  resultCopy: { flex: 1, marginHorizontal: 11 },
  resultName: { color: '#f5f7fb', fontSize: 14, fontWeight: '700' },
  resultMeta: { color: '#8f9db4', fontSize: 11, marginTop: 3 },
  error: { color: '#fca5a5', fontSize: 12, marginTop: 8 },
  empty: { color: '#8f9db4', fontSize: 12, marginTop: 8 },
});
