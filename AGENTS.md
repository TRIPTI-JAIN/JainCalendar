# JainCalendar Project Knowledge

## Product

JainCalendar is a React Native mobile app for Jain daily observance. It combines location-aware sunrise/sunset times with locally calculated panchang data to show tithi, paksha, lunar month, Navkarsi, Porsi, fasting markers, and selected Jain festivals. Users can save cities, notes, fasting choices, reminder preferences, and share a rendered daily card.

The current UI supports English, Hindi, and Gujarati. Ahmedabad is the fallback city.

## Technology

- React Native 0.80.1 and React 19.1, using the community CLI (not Expo)
- Mostly JavaScript screens and utilities; TypeScript is configured and used by the test and one storage shim
- React Navigation: a root drawer with a small nested Home stack
- `moment`/`moment-timezone` for dates and `mhah-panchang` for local panchang calculations
- `react-native-fs` JSON files for persistent app state and cached data
- Native Android Kotlin modules for scheduled notifications and a home-screen widget
- Hermes enabled; React Native New Architecture disabled

Node 18 or newer is required.

## Entry Points and Navigation

- `index.js` registers the application.
- `App.tsx` supplies `GestureHandlerRootView`, status bar, and the single root `NavigationContainer`.
- `src/com/calendar/drawerNavigator/index.js` is the active navigator. Routes are `Home`, `Calendar`, `Settings`, `FestivalDetail`, `About`, and `QRCodeScreen`.
- `src/com/calendar/navigation/index.js` is a separate older stack containing Splash/Home/Calendar; it is not mounted by `App.tsx`.
- `FestivalDetail` is hidden from the drawer and expects a festival id in route params.

Do not add a second `NavigationContainer` below `App.tsx`.

## Source Map

- `src/com/calendar/container/home.js`: compact daily dashboard, explicit GPS lookup, live sunrise/sunset loading, offline fallback, Sadhana/fasting/note state, daily-card sharing, and Android widget updates. City, language, and reminder management belongs primarily in Settings.
- `src/com/calendar/components/CollapsibleCard.js`: shared disclosure card used for secondary Home sections.
- `src/com/calendar/container/panchangCalendar.js`: month grid, day selection/search, and yearly festival view.
- `src/com/calendar/container/festivalDetail.js`: festival content and per-festival alert preference.
- `src/com/calendar/container/settings.js`: locale, reminders, saved cities, journal/cache management.
- `src/com/calendar/container/about.js`: localized product information.
- `src/com/calendar/container/QRCode.js`: UPI-oriented capture/share screen. Its storage is currently session-only.
- `src/com/calendar/container/splash.js`: video splash used only by the inactive stack navigator.
- `src/com/calendar/utility/jainData.js`: canonical panchang transformation, festival rules/content, fasting rules, month/year builders, and search.
- `src/com/calendar/utility/i18n.js`: UI copy and domain-term translations for `en`, `hi`, and `gu`.
- `src/com/calendar/utility/appStorage.js`: canonical persisted app-state shape and merge-on-read behavior.
- `src/com/calendar/utility/localCache.js`: legacy standalone sunrise/sunset cache file.
- `src/com/calendar/utility/constant.js`: remote sunrise/sunset and reverse-geocoding helpers plus Navkarsi/Porsi time calculations. Its Astrology API helper is a placeholder and is not the main panchang path.
- `src/com/calendar/utility/mmkvStorage.ts`: in-memory compatibility shim, despite its name.

## Data Flow and Domain Rules

1. Home reads `jain_calendar_app_state.json` from the app documents directory.
2. It ensures a city exists and loads the selected saved city. GPS is requested only when the user explicitly chooses current location.
3. Home displays a saved dashboard immediately when available, then refreshes in the background. Sunrise/sunset uses an eight-second request timeout; when the live service is unavailable, labels from the local `mhah-panchang` calculation keep the dashboard usable.
4. Navkarsi is sunrise plus 48 minutes. Porsi is sunrise plus one quarter of the sunrise-to-sunset interval.
5. Dashboard payloads, including a rolling 90-day panchang snapshot, are cached by city id in `appState.dashboardCache` for offline fallback.
6. Festival and fasting matches are rule-based in `jainData.js`; update that file when changing observance logic.
7. UI localization is applied after domain summaries are built. Keep canonical stored/domain values in English and translate at display boundaries.

Persistent app state includes `locale`, `observanceProfile` (`tradition` and `calendarRegion`), `activeCityId`, `cities`, temporary `travelMode`, `reminders`, `festivalAlerts`, date-keyed `fasting`, date-keyed `notes`, date-keyed `dailySadhana`, and `dashboardCache`. When adding a field, update both `DEFAULT_APP_STATE` and `readAppState()` merging so older installations migrate safely.

## Native Platform Notes

Android package/application id is `com.jaincalendar` (version name 1.2, code 2).

- `NavkarsiNotificationModule` schedules one-shot alarms through `AlarmManager`; `NavkarsiNotificationReceiver` posts them.
- `DashboardWidgetModule` writes widget data to Android shared preferences; `JainDashboardWidgetProvider` renders it.
- Custom native modules are registered in `NavkarsiNotificationPackage.kt` and the package is added in `MainApplication.kt`.
- Android needs internet, fine/coarse location, and notification permissions.
- iOS configures location permissions through `react-native-permissions`; the Android-only notification/widget features must remain guarded by `Platform.OS` and optional native-module checks.

## Commands

```sh
npm install
npm start
npm run android
npm run ios
npm test -- --runInBand
npm run lint
```

For iOS native dependency changes, run `bundle install` and then `bundle exec pod install` from `ios` as appropriate.

## Change Conventions

- Preserve the current functional-component and hooks style.
- Use existing utility modules instead of duplicating date, panchang, persistence, or translation logic inside screens.
- Use `YYYY-MM-DD` as the key format for notes, fasting markers, and day records.
- Treat coordinates as numeric `lat`/`lon` fields and city ids as stable, lowercase slugs.
- Add user-facing strings to all three locales. Provide a safe English fallback for newly introduced domain terms.
- Keep Reanimated's Babel plugin last.
- Guard platform-specific behavior and tolerate missing native modules so iOS and tests do not crash.
- Preserve unrelated working-tree changes; active Android widget and settings/home work may be uncommitted.

## Validation

At minimum, run the Jest smoke test and ESLint after JavaScript/TypeScript changes. For native Android changes, also compile or assemble the relevant Android variant. Manually check location denial/blocked behavior, cached/offline startup, locale switching, drawer navigation, and date-boundary time calculations when those areas change.

The test suite currently contains only an app render smoke test with navigation mocked. Add focused utility tests for domain logic when changing festival matching, calendar grids, time parsing, or state migrations.

## Security and Known Debt

- Do not add credentials to source control. Existing native signing values and the reverse-geocoding key should be moved to local/CI configuration and rotated; never copy them into documentation, tests, logs, or new code.
- The app depends on a public sunrise/sunset service and Google reverse geocoding, so network failure and quota/error responses need graceful cached fallback.
- Reminder preferences schedule alarms when dashboard data loads; there is no complete cancellation/rescheduling registry yet.
- Festival rules are a small curated set and may not cover sect, locality, leap-month, or calendar-tradition differences. Confirm domain changes with an authoritative Jain calendar source.
- `QRCode.js` does not render a QR library component and its `mmkvStorage` dependency is only in-memory.
- The committed Android bundle is generated output; prefer changing source and rebuilding it rather than editing the bundle directly.
