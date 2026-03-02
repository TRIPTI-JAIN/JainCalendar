import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { getFestivalById } from '../utility/jainData';
import { getDefaultAppState, readAppState, writeAppState } from '../utility/appStorage';
import {
  formatLocalizedDate,
  getCopy,
  translateFestival,
  translateText,
} from '../utility/i18n';

const FestivalDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [appState, setAppState] = useState(getDefaultAppState());

  const routeFestival = route.params?.festival || null;
  const locale = appState.locale || 'en';
  const copy = getCopy('festival', locale);
  const festival =
    routeFestival || getFestivalById(route.params?.festivalId) || null;
  const festivalDate = route.params?.date || null;
  const tithi = route.params?.tithi || null;
  const cityName = route.params?.cityName || null;

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadState = async () => {
        const stored = await readAppState();
        if (isMounted) {
          setAppState(stored);
        }
      };

      loadState();

      return () => {
        isMounted = false;
      };
    }, []),
  );

  const toggleFestivalAlert = async () => {
    if (!festival?.id) return;

    const nextState = {
      ...appState,
      festivalAlerts: {
        ...appState.festivalAlerts,
        [festival.id]: !appState.festivalAlerts?.[festival.id],
      },
    };

    setAppState(nextState);
    await writeAppState(nextState);
  };

  const localizedFestival = translateFestival(festival, locale);

  if (!localizedFestival) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyState}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{copy.back}</Text>
          </TouchableOpacity>
          <Text style={styles.emptyTitle}>{copy.unavailableTitle}</Text>
          <Text style={styles.emptyBody}>{copy.unavailableBody}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{copy.back}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
            <Text style={styles.linkText}>{copy.calendar}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{localizedFestival.title}</Text>
          <Text style={styles.subtitle}>{localizedFestival.significance}</Text>
          <View style={styles.metaWrap}>
            {festivalDate ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>
                  {formatLocalizedDate(festivalDate, locale, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            ) : null}
            {tithi ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{translateText(tithi, locale, 'tithi')}</Text>
              </View>
            ) : null}
            {cityName ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{cityName}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleContent}>
              <Text style={styles.cardTitle}>{copy.reminder}</Text>
              <Text style={styles.cardBody}>{copy.reminderBody}</Text>
            </View>
            <Switch
              value={Boolean(appState.festivalAlerts?.[localizedFestival.id])}
              onValueChange={toggleFestivalAlert}
              trackColor={{ false: '#45556f', true: '#e6a84b' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy.whyItMatters}</Text>
          <Text style={styles.cardBody}>{localizedFestival.significance}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy.observance}</Text>
          <Text style={styles.cardBody}>
            {localizedFestival.observance ||
              'This day is observed with prayer, restraint, and reflection.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy.reflection}</Text>
          <Text style={styles.cardBody}>
            {localizedFestival.reflection ||
              'Use the day for inner discipline and mindful conduct.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy.practices}</Text>
          {localizedFestival.highlights?.length ? (
            localizedFestival.highlights.map(item => (
              <View key={item} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardBody}>
              Prayer, svadhyaya, seva, and thoughtful restraint.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FestivalDetailScreen;

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
    minHeight: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    color: '#d8e6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  linkText: {
    color: '#f6b84c',
    fontSize: 15,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: '#101726',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#223049',
    padding: 18,
    marginBottom: 14,
  },
  eyebrow: {
    color: '#e6a84b',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
    fontSize: 11,
  },
  title: {
    color: '#fff7dd',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: '#c6d2e4',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  metaChip: {
    backgroundColor: '#1a2740',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  metaChipText: {
    color: '#dfe7f3',
    fontWeight: '700',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#101726',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#223049',
    padding: 16,
    marginBottom: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleContent: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    color: '#fff7dd',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardBody: {
    color: '#c6d2e4',
    fontSize: 15,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e6a84b',
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    color: '#d7e0ee',
    fontSize: 15,
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#fff7dd',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 18,
  },
  emptyBody: {
    color: '#c6d2e4',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
});
