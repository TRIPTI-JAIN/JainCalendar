import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { readAppState } from '../utility/appStorage';

const copyMap = {
  en: {
    back: '< Back',
    eyebrow: 'About The App',
    title: 'Jain Calendar',
    subtitle:
      'A daily-use Jain companion for tithi, sunrise, fasting context, reminders, festivals, and reflection.',
    missionTitle: 'Why This App Exists',
    missionBody:
      'The app is built to keep essential Jain calendar information close at hand so daily observance becomes easier, calmer, and more consistent.',
    includesTitle: 'What It Includes',
    includes: [
      'Daily dashboard with tithi, paksha, sunrise, sunset, navkarsi, and porsi',
      'Upcoming festivals and yearly festival preview',
      'Saved cities and location-aware calculations',
      'Reminder preferences and journal notes',
      'Festival detail pages with observance guidance',
    ],
    currentSetupTitle: 'Current Setup',
    language: 'Language',
    activeCity: 'Active City',
    savedCities: 'Saved Cities',
    reminderCount: 'Enabled Reminders',
    notesCount: 'Journal Entries',
    roadmapTitle: 'Planned Improvements',
    roadmap: [
      'Broader Hindi and Gujarati coverage for all Panchang terms',
      'More Jain festivals and observance content',
      'Better city search and temple discovery',
      'Expanded reminder flows and stronger offline support',
    ],
  },
  hi: {
    back: '< वापस',
    eyebrow: 'ऐप के बारे में',
    title: 'जैन कैलेंडर',
    subtitle:
      'तिथि, सूर्योदय, उपवास संदर्भ, रिमाइंडर, पर्व और चिंतन के लिए एक दैनिक जैन साथी।',
    missionTitle: 'यह ऐप क्यों है',
    missionBody:
      'इस ऐप का उद्देश्य आवश्यक जैन कैलेंडर जानकारी को रोजमर्रा के उपयोग के लिए सरल और सुलभ बनाना है।',
    includesTitle: 'इसमें क्या है',
    includes: [
      'तिथि, पक्ष, सूर्योदय, सूर्यास्त, नवकारसी और पोरसी वाला दैनिक डैशबोर्ड',
      'आने वाले पर्व और वार्षिक पर्व दृश्य',
      'सेव किए शहर और स्थान आधारित गणना',
      'रिमाइंडर पसंद और जर्नल नोट्स',
      'पालन मार्गदर्शन के साथ पर्व विवरण पेज',
    ],
    currentSetupTitle: 'वर्तमान सेटअप',
    language: 'भाषा',
    activeCity: 'सक्रिय शहर',
    savedCities: 'सेव किए शहर',
    reminderCount: 'सक्रिय रिमाइंडर',
    notesCount: 'जर्नल प्रविष्टियां',
    roadmapTitle: 'आगे के सुधार',
    roadmap: [
      'सभी पंचांग शब्दों के लिए व्यापक हिंदी और गुजराती समर्थन',
      'अधिक जैन पर्व और पालन सामग्री',
      'बेहतर शहर खोज और मंदिर खोज',
      'विस्तृत रिमाइंडर और मजबूत ऑफलाइन सपोर्ट',
    ],
  },
  gu: {
    back: '< પાછા',
    eyebrow: 'એપ વિશે',
    title: 'જૈન કેલેન્ડર',
    subtitle:
      'તિથિ, સૂર્યોદય, ઉપવાસ સંદર્ભ, રિમાઇન્ડર, પર્વો અને ચિંતન માટેનો દૈનિક જૈન સાથી.',
    missionTitle: 'આ એપ શા માટે છે',
    missionBody:
      'મુખ્ય જૈન કેલેન્ડર માહિતી રોજિંદા પાલન માટે સરળ, શાંત અને સહેલ બને તે માટે આ એપ બનાવવામાં આવી છે.',
    includesTitle: 'એપમાં શું છે',
    includes: [
      'તિથિ, પક્ષ, સૂર્યોદય, સૂર્યાસ્ત, નવકારસી અને પોરસી સાથે દૈનિક ડેશબોર્ડ',
      'આવતા પર્વો અને વાર્ષિક પર્વ દૃશ્ય',
      'સેવ કરેલા શહેરો અને સ્થાન આધારિત ગણતરી',
      'રિમાઇન્ડર પસંદગીઓ અને જર્નલ નોંધો',
      'પાલન માર્ગદર્શન સાથે પર્વ વિગત પેજ',
    ],
    currentSetupTitle: 'વર્તમાન સેટઅપ',
    language: 'ભાષા',
    activeCity: 'સક્રિય શહેર',
    savedCities: 'સેવ કરેલા શહેરો',
    reminderCount: 'ચાલુ રિમાઇન્ડર',
    notesCount: 'જર્નલ એન્ટ્રીઓ',
    roadmapTitle: 'આગામી સુધારાઓ',
    roadmap: [
      'બધા પંચાંગ શબ્દો માટે વ્યાપક હિન્દી અને ગુજરાતી સપોર્ટ',
      'વધુ જૈન પર્વો અને પાલન સામગ્રી',
      'વધુ સારો શહેર શોધ અને મંદિર શોધ',
      'વિસ્તૃત રિમાઇન્ડર અને મજબૂત ઑફલાઇન સપોર્ટ',
    ],
  },
};

const About = () => {
  const navigation = useNavigation();
  const [state, setState] = useState({
    locale: 'en',
    activeCityId: null,
    cities: [],
    reminders: {},
    notes: {},
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        const appState = await readAppState();
        if (active) {
          setState(appState);
        }
      };

      load();

      return () => {
        active = false;
      };
    }, []),
  );

  const copy = copyMap[state.locale] || copyMap.en;
  const activeCity =
    state.cities.find(city => city.id === state.activeCityId)?.name || 'Ahmedabad';
  const enabledReminders = Object.values(state.reminders || {}).filter(Boolean).length;
  const noteCount = Object.keys(state.notes || {}).length;

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
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.missionTitle}</Text>
          <Text style={styles.sectionBody}>{copy.missionBody}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.includesTitle}</Text>
          {copy.includes.map(item => (
            <View key={item} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.currentSetupTitle}</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{copy.language}</Text>
            <Text style={styles.metricValue}>{state.locale.toUpperCase()}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{copy.activeCity}</Text>
            <Text style={styles.metricValue}>{activeCity}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{copy.savedCities}</Text>
            <Text style={styles.metricValue}>{state.cities.length}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{copy.reminderCount}</Text>
            <Text style={styles.metricValue}>{enabledReminders}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>{copy.notesCount}</Text>
            <Text style={styles.metricValue}>{noteCount}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.roadmapTitle}</Text>
          {copy.roadmap.map(item => (
            <View key={item} style={styles.bulletRow}>
              <View style={[styles.bullet, styles.roadmapBullet]} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default About;

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
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 8,
  },
  backText: {
    color: '#d8e6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: '#101726',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#223049',
    padding: 20,
    marginBottom: 14,
  },
  eyebrow: {
    color: '#e6a84b',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#fff7dd',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: '#c6d2e4',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
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
    marginBottom: 10,
  },
  sectionBody: {
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
  roadmapBullet: {
    backgroundColor: '#4ea8ff',
  },
  bulletText: {
    flex: 1,
    color: '#d7e0ee',
    fontSize: 15,
    lineHeight: 22,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(104,122,156,0.18)',
  },
  metricLabel: {
    color: '#9fb1cd',
    fontSize: 14,
  },
  metricValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
