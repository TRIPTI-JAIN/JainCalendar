const LOCALE_MAP = {
  en: 'en-US',
  hi: 'hi-IN',
  gu: 'gu-IN',
};

const UI_COPY = {
  en: {
    home: {
      title: 'Jain Dashboard',
      refresh: 'Refresh',
      retry: 'Retry',
      openSettings: 'Open Settings',
      liveDataError: 'Unable to load live data',
      upcomingFestivals: 'Upcoming Festivals',
      fastingAssistant: 'Fasting Assistant',
      reminderSettings: 'Reminder Settings',
      cityManager: 'Saved Cities',
      notes: 'Jain Notes / Journal',
      share: 'Share Today Card',
      yearView: 'Year and Search View',
      language: 'Language',
      today: 'Today',
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      navkarsi: 'Navkarsi',
      porsi: 'Porsi',
      tithi: 'Tithi',
      paksha: 'Paksha',
      lunarMonth: 'Lunar Month',
      festival: 'Festival',
      noneToday: 'None today',
      fastingMarker: 'Fasting marker',
      noMarker: 'No marker',
      addCity: 'Add City',
      cityName: 'City name',
      latitude: 'Latitude',
      longitude: 'Longitude',
      navkarsiAlerts: 'Navkarsi alerts',
      sunsetAlerts: 'Sunset alerts',
      parnaAlerts: 'Parna alerts',
      festivalAlerts: 'Festival alerts',
      notesPlaceholder:
        'Write pratikraman notes, tapas reflections, or daily intentions.',
    },
    calendar: {
      back: '< Back',
      prev: '< Prev',
      next: 'Next >',
      searchPlaceholder: 'Search date, tithi, festival',
      go: 'Go',
      festival: 'Festival',
      fasting: 'Fasting',
      today: 'Today',
      yearFestivalView: 'Year Festival View',
      view: 'View',
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      tithi: 'Tithi',
      paksha: 'Paksha',
      lunarMonth: 'Lunar Month',
    },
    festival: {
      back: '< Back',
      calendar: 'Calendar',
      eyebrow: 'Jain Festival',
      reminder: 'Festival Reminder',
      reminderBody: 'Save a reminder preference for this festival.',
      whyItMatters: 'Why It Matters',
      observance: 'Common Observance',
      reflection: 'Reflection',
      practices: 'Suggested Practices',
      unavailableTitle: 'Festival details unavailable',
      unavailableBody: 'Open this page from a festival entry in the app.',
    },
    settings: {
      back: '< Back',
      title: 'Settings & Reminders',
      language: 'Language',
      reminderSettings: 'Reminder Settings',
      savedCities: 'Saved Cities',
      storageData: 'Storage & Data',
      activeCity: 'Active city',
      saved: 'saved',
      remove: 'Remove',
      addCity: 'Add City',
      cityName: 'City name',
      latitude: 'Latitude',
      longitude: 'Longitude',
      clearJournal: 'Clear Journal',
      clearOfflineCache: 'Clear Offline Cache',
      journalEntries: 'Journal entries',
      offlineCityCache: 'Offline city cache',
      lastChecked: 'Last checked',
    },
  },
  hi: {
    home: {
      title: 'जैन डैशबोर्ड',
      refresh: 'रीफ्रेश',
      retry: 'फिर प्रयास करें',
      openSettings: 'सेटिंग खोलें',
      liveDataError: 'लाइव डेटा लोड नहीं हुआ',
      upcomingFestivals: 'आने वाले पर्व',
      fastingAssistant: 'उपवास सहायक',
      reminderSettings: 'रिमाइंडर सेटिंग',
      cityManager: 'सेव किए शहर',
      notes: 'जैन नोट्स / जर्नल',
      share: 'आज का कार्ड शेयर करें',
      yearView: 'वार्षिक और खोज दृश्य',
      language: 'भाषा',
      today: 'आज',
      sunrise: 'सूर्योदय',
      sunset: 'सूर्यास्त',
      navkarsi: 'नवकारसी',
      porsi: 'पोरसी',
      tithi: 'तिथि',
      paksha: 'पक्ष',
      lunarMonth: 'चंद्र मास',
      festival: 'पर्व',
      noneToday: 'आज कोई नहीं',
      fastingMarker: 'उपवास संकेत',
      noMarker: 'कोई संकेत नहीं',
      addCity: 'शहर जोड़ें',
      cityName: 'शहर का नाम',
      latitude: 'अक्षांश',
      longitude: 'देशांतर',
      navkarsiAlerts: 'नवकारसी अलर्ट',
      sunsetAlerts: 'सूर्यास्त अलर्ट',
      parnaAlerts: 'पारण अलर्ट',
      festivalAlerts: 'पर्व अलर्ट',
      notesPlaceholder:
        'प्रतिक्रमण नोट्स, तप चिंतन या दैनिक संकल्प लिखें।',
    },
    calendar: {
      back: '< वापस',
      prev: '< पिछला',
      next: 'अगला >',
      searchPlaceholder: 'तिथि, पर्व या दिन खोजें',
      go: 'जाएं',
      festival: 'पर्व',
      fasting: 'उपवास',
      today: 'आज',
      yearFestivalView: 'वार्षिक पर्व दृश्य',
      view: 'देखें',
      sunrise: 'सूर्योदय',
      sunset: 'सूर्यास्त',
      tithi: 'तिथि',
      paksha: 'पक्ष',
      lunarMonth: 'चंद्र मास',
    },
    festival: {
      back: '< वापस',
      calendar: 'कैलेंडर',
      eyebrow: 'जैन पर्व',
      reminder: 'पर्व रिमाइंडर',
      reminderBody: 'इस पर्व के लिए रिमाइंडर पसंद सेव करें।',
      whyItMatters: 'महत्व',
      observance: 'सामान्य पालन',
      reflection: 'चिंतन',
      practices: 'सुझावित अभ्यास',
      unavailableTitle: 'पर्व विवरण उपलब्ध नहीं है',
      unavailableBody: 'ऐप में किसी पर्व प्रविष्टि से यह पेज खोलें।',
    },
    settings: {
      back: '< वापस',
      title: 'सेटिंग और रिमाइंडर',
      language: 'भाषा',
      reminderSettings: 'रिमाइंडर सेटिंग',
      savedCities: 'सेव किए शहर',
      storageData: 'स्टोरेज और डेटा',
      activeCity: 'सक्रिय शहर',
      saved: 'सेव',
      remove: 'हटाएं',
      addCity: 'शहर जोड़ें',
      cityName: 'शहर का नाम',
      latitude: 'अक्षांश',
      longitude: 'देशांतर',
      clearJournal: 'जर्नल साफ करें',
      clearOfflineCache: 'ऑफलाइन कैश साफ करें',
      journalEntries: 'जर्नल प्रविष्टियां',
      offlineCityCache: 'ऑफलाइन सिटी कैश',
      lastChecked: 'अंतिम जांच',
    },
  },
  gu: {
    home: {
      title: 'જૈન ડેશબોર્ડ',
      refresh: 'રિફ્રેશ',
      retry: 'ફરી પ્રયાસ કરો',
      openSettings: 'સેટિંગ ખોલો',
      liveDataError: 'લાઇવ ડેટા લોડ થયો નથી',
      upcomingFestivals: 'આવતા પર્વો',
      fastingAssistant: 'ઉપવાસ સહાયક',
      reminderSettings: 'રિમાઇન્ડર સેટિંગ',
      cityManager: 'સેવ કરેલા શહેરો',
      notes: 'જૈન નોંધ / જર્નલ',
      share: 'આજનો કાર્ડ શેર કરો',
      yearView: 'વર્ષ અને શોધ દૃશ્ય',
      language: 'ભાષા',
      today: 'આજે',
      sunrise: 'સૂર્યોદય',
      sunset: 'સૂર્યાસ્ત',
      navkarsi: 'નવકારસી',
      porsi: 'પોરસી',
      tithi: 'તિથિ',
      paksha: 'પક્ષ',
      lunarMonth: 'ચંદ્ર માસ',
      festival: 'પર્વ',
      noneToday: 'આજે કોઈ નથી',
      fastingMarker: 'ઉપવાસ ચિહ્ન',
      noMarker: 'કોઈ ચિહ્ન નથી',
      addCity: 'શહેર ઉમેરો',
      cityName: 'શહેરનું નામ',
      latitude: 'અક્ષાંશ',
      longitude: 'રેખાંશ',
      navkarsiAlerts: 'નવકારસી અલર્ટ',
      sunsetAlerts: 'સૂર્યાસ્ત અલર્ટ',
      parnaAlerts: 'પારણા અલર્ટ',
      festivalAlerts: 'પર્વ અલર્ટ',
      notesPlaceholder: 'પ્રતિક્રમણ નોંધો, તપ વિચાર અથવા દૈનિક સંકલ્પ લખો.',
    },
    calendar: {
      back: '< પાછા',
      prev: '< પાછલું',
      next: 'આગળ >',
      searchPlaceholder: 'તિથિ, પર્વ અથવા દિવસ શોધો',
      go: 'જોવો',
      festival: 'પર્વ',
      fasting: 'ઉપવાસ',
      today: 'આજે',
      yearFestivalView: 'વાર્ષિક પર્વ દૃશ્ય',
      view: 'જોવો',
      sunrise: 'સૂર્યોદય',
      sunset: 'સૂર્યાસ્ત',
      tithi: 'તિથિ',
      paksha: 'પક્ષ',
      lunarMonth: 'ચંદ્ર માસ',
    },
    festival: {
      back: '< પાછા',
      calendar: 'કેલેન્ડર',
      eyebrow: 'જૈન પર્વ',
      reminder: 'પર્વ રિમાઇન્ડર',
      reminderBody: 'આ પર્વ માટે રિમાઇન્ડર પસંદગી સેવ કરો.',
      whyItMatters: 'મહત્વ',
      observance: 'સામાન્ય પાલન',
      reflection: 'ચિંતન',
      practices: 'સૂચિત અભ્યાસ',
      unavailableTitle: 'પર્વ વિગતો ઉપલબ્ધ નથી',
      unavailableBody: 'એપમાં કોઈ પર્વ એન્ટ્રી પરથી આ પેજ ખોલો.',
    },
    settings: {
      back: '< પાછા',
      title: 'સેટિંગ અને રિમાઇન્ડર',
      language: 'ભાષા',
      reminderSettings: 'રિમાઇન્ડર સેટિંગ',
      savedCities: 'સેવ કરેલા શહેરો',
      storageData: 'સ્ટોરેજ અને ડેટા',
      activeCity: 'સક્રિય શહેર',
      saved: 'સેવ',
      remove: 'દૂર કરો',
      addCity: 'શહેર ઉમેરો',
      cityName: 'શહેરનું નામ',
      latitude: 'અક્ષાંશ',
      longitude: 'રેખાંશ',
      clearJournal: 'જર્નલ સાફ કરો',
      clearOfflineCache: 'ઓફલાઇન કેશ સાફ કરો',
      journalEntries: 'જર્નલ એન્ટ્રીઓ',
      offlineCityCache: 'ઓફલાઇન સિટી કેશ',
      lastChecked: 'છેલ્લી તપાસ',
    },
  },
};

const TERM_TRANSLATIONS = {
  hi: {
    festivalTitles: {
      'Mahavir Jayanti': 'महावीर जयंती',
      'Paryushan Aarambh': 'पर्युषण आरंभ',
      Samvatsari: 'संवत्सरी',
      'Diwali (Nirvana Divas)': 'दीवाली (निर्वाण दिवस)',
      'Gyan Panchami': 'ज्ञान पंचमी',
    },
    tithi: {
      Padyami: 'प्रतिपदा',
      Vidhiya: 'द्वितीया',
      Thadiya: 'तृतीया',
      Chavithi: 'चतुर्थी',
      Panchami: 'पंचमी',
      Shasti: 'षष्ठी',
      Sapthami: 'सप्तमी',
      Ashtami: 'अष्टमी',
      Navami: 'नवमी',
      Dasami: 'दशमी',
      Ekadasi: 'एकादशी',
      Dvadasi: 'द्वादशी',
      Trayodasi: 'त्रयोदशी',
      Chaturdasi: 'चतुर्दशी',
      Punnami: 'पूर्णिमा',
      Amavasya: 'अमावस्या',
    },
    paksha: {
      Shukla: 'शुक्ल',
      Krishna: 'कृष्ण',
      Unknown: 'अज्ञात',
    },
    months: {
      Chaitra: 'चैत्र',
      Bhadra: 'भाद्रपद',
      Kartika: 'कार्तिक',
      Kartik: 'कार्तिक',
      Unknown: 'अज्ञात',
    },
    fasting: {
      Upvas: 'उपवास',
      Ekasana: 'एकासन',
      Beasana: 'बेसना',
      'Ashtami Upvas': 'अष्टमी उपवास',
      'Ekadashi Tap': 'एकादशी तप',
      'Chaudas Upvas': 'चौदस उपवास',
      'Purnima / Amavasya Tap': 'पूर्णिमा / अमावस्या तप',
      None: 'कोई नहीं',
    },
  },
  gu: {
    festivalTitles: {
      'Mahavir Jayanti': 'મહાવીર જયંતી',
      'Paryushan Aarambh': 'પર્યુષણ આરંભ',
      Samvatsari: 'સંવત્સરી',
      'Diwali (Nirvana Divas)': 'દિવાળી (નિર્વાણ દિવસ)',
      'Gyan Panchami': 'જ્ઞાન પંચમી',
    },
    tithi: {
      Padyami: 'પ્રતિપદા',
      Vidhiya: 'દ્વિતીયા',
      Thadiya: 'તૃતિયા',
      Chavithi: 'ચતુર્થી',
      Panchami: 'પંચમી',
      Shasti: 'ષષ્ઠી',
      Sapthami: 'સપ્તમી',
      Ashtami: 'અષ્ટમી',
      Navami: 'નવમી',
      Dasami: 'દશમી',
      Ekadasi: 'એકાદશી',
      Dvadasi: 'દ્વાદશી',
      Trayodasi: 'ત્રયોદશી',
      Chaturdasi: 'ચતુર્દશી',
      Punnami: 'પૂર્ણિમા',
      Amavasya: 'અમાસ',
    },
    paksha: {
      Shukla: 'શુક્લ',
      Krishna: 'કૃષ્ણ',
      Unknown: 'અજ્ઞાત',
    },
    months: {
      Chaitra: 'ચૈત્ર',
      Bhadra: 'ભાદરવો',
      Kartika: 'કાર્તિક',
      Kartik: 'કાર્તિક',
      Unknown: 'અજ્ઞાત',
    },
    fasting: {
      Upvas: 'ઉપવાસ',
      Ekasana: 'એકાસણ',
      Beasana: 'બેસણું',
      'Ashtami Upvas': 'અષ્ટમી ઉપવાસ',
      'Ekadashi Tap': 'એકાદશી તપ',
      'Chaudas Upvas': 'ચૌદસ ઉપવાસ',
      'Purnima / Amavasya Tap': 'પૂર્ણિમા / અમાસ તપ',
      None: 'કોઈ નહીં',
    },
  },
};

const FESTIVAL_CONTENT_TRANSLATIONS = {
  hi: {
    'mahavir-jayanti': {
      title: 'महावीर जयंती',
      significance: 'भगवान महावीर के जन्म का पर्व, प्रार्थना और सेवा के साथ मनाया जाता है।',
      observance:
        'इस दिन भक्त देरासर जाते हैं, प्रवचन सुनते हैं, शोभायात्रा में भाग लेते हैं और सेवा करते हैं।',
      reflection:
        'अहिंसा, अपरिग्रह, संयम और करुणा को अपने आचरण में उतारने का चिंतन करें।',
      highlights: ['मंदिर दर्शन और शांत प्रार्थना', 'भगवान महावीर जीवन वाचन', 'करुणा और सेवा'],
    },
    'paryushan-start': {
      title: 'पर्युषण आरंभ',
      significance: 'पर्युषण का प्रारंभ, जो आत्मचिंतन, प्रार्थना और तप को समर्पित है।',
      observance:
        'इस काल में प्रतिक्रमण, स्वाध्याय, संयम और सरल दिनचर्या का पालन किया जाता है।',
      reflection:
        'क्षमा, अनुशासन और वाणी संयम के लिए संकल्प लें।',
      highlights: ['प्रतिक्रमण प्रारंभ करें', 'तप या संयम का लक्ष्य चुनें', 'ध्यान भीतर की ओर रखें'],
    },
    samvatsari: {
      title: 'संवत्सरी',
      significance: 'विश्व क्षमा और प्रतिक्रमण का दिन, मिच्छामि दुक्कडम् के भाव के साथ।',
      observance:
        'लोग विस्तृत प्रतिक्रमण करते हैं और परिवार, मित्रों तथा समाज से क्षमा मांगते हैं।',
      reflection:
        'नम्रता, अहंकार त्याग और जाने-अनजाने हुए दोषों के लिए सच्चे पश्चाताप का अभ्यास करें।',
      highlights: ['संवत्सरी प्रतिक्रमण', 'मिच्छामि दुक्कडम् संदेश', 'गहन क्षमा साधना'],
    },
    'mahaveer-nirvan': {
      title: 'दीवाली (निर्वाण दिवस)',
      significance: 'भगवान महावीर निर्वाण और जैन नववर्ष संक्रमण का स्मरण।',
      observance:
        'इस दिन दीप प्रज्वलन, शास्त्र वाचन और भगवान महावीर निर्वाण का स्मरण किया जाता है।',
      reflection:
        'मुक्ति, सम्यक ज्ञान और अंतरज्योति पर चिंतन करें।',
      highlights: ['निर्वाण स्मरण', 'आध्यात्मिक चिंतन', 'शास्त्र वाचन और दीप प्रज्वलन'],
    },
    'gyan-panchami': {
      title: 'ज्ञान पंचमी',
      significance: 'शास्त्र श्रद्धा, अध्ययन और ज्ञान पूजा का शुभ दिन।',
      observance:
        'ग्रंथों की सफाई, पाठ और स्वाध्याय के लिए समय समर्पित किया जाता है।',
      reflection:
        'सम्यक ज्ञान और अनुशासित अध्ययन पर ध्यान दें।',
      highlights: ['शास्त्र वंदना', 'एकाग्र स्वाध्याय', 'अध्ययन अनुशासन'],
    },
  },
};

const translateExact = (value, map) => map?.[value] || value;

export const translateText = (value, locale = 'en', category = 'tithi') =>
  translateExact(value, TERM_TRANSLATIONS[locale]?.[category]);

export const getCopy = (section, locale = 'en') =>
  UI_COPY[locale]?.[section] || UI_COPY.en[section] || {};

export const getLocaleTag = (locale = 'en') => LOCALE_MAP[locale] || LOCALE_MAP.en;

export const formatLocalizedDate = (
  dateInput,
  locale = 'en',
  options = { month: 'short', day: 'numeric', year: 'numeric' },
) =>
  new Intl.DateTimeFormat(getLocaleTag(locale), options).format(new Date(dateInput));

export const formatMonthYear = (dateInput, locale = 'en') =>
  new Intl.DateTimeFormat(getLocaleTag(locale), {
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateInput));

export const translateFestival = (festival, locale = 'en') => {
  if (!festival || locale === 'en') return festival;

  const content = FESTIVAL_CONTENT_TRANSLATIONS[locale]?.[festival.id];
  const title =
    content?.title ||
    translateExact(
      festival.title,
      TERM_TRANSLATIONS[locale]?.festivalTitles,
    );

  return {
    ...festival,
    title,
    significance: content?.significance || festival.significance,
    observance: content?.observance || festival.observance,
    reflection: content?.reflection || festival.reflection,
    highlights: content?.highlights || festival.highlights || [],
  };
};

export const translateDaySummary = (day, locale = 'en') => {
  if (!day || locale === 'en') return day;

  return {
    ...day,
    tithi: translateExact(day.tithi, TERM_TRANSLATIONS[locale]?.tithi),
    paksha: translateExact(day.paksha, TERM_TRANSLATIONS[locale]?.paksha),
    moonMasa: translateExact(day.moonMasa, TERM_TRANSLATIONS[locale]?.months),
    fasting: day.fasting
      ? {
          ...day.fasting,
          title: translateExact(
            day.fasting.title,
            TERM_TRANSLATIONS[locale]?.fasting,
          ),
        }
      : day.fasting,
    festival: translateFestival(day.festival, locale),
  };
};

export const translateFastingTitle = (title, locale = 'en') =>
  translateExact(title, TERM_TRANSLATIONS[locale]?.fasting);

export const getLocaleNameLabel = (locale, selectedLocale = 'en') => {
  const names = {
    en: { en: 'English', hi: 'Hindi', gu: 'Gujarati' },
    hi: { en: 'अंग्रेज़ी', hi: 'हिंदी', gu: 'ગુજરાતી' },
    gu: { en: 'English', hi: 'हिंदी', gu: 'ગુજરાતી' },
  };
  return names[selectedLocale]?.[locale] || names.en[locale] || locale;
};
