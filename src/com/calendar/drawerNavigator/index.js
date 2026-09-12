import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Home from '../container/home';
import About from '../container/about';
import QRCodeScreen from '../container/QRCode';
import PanchangCalendar from '../container/panchangCalendar';
import SettingsScreen from '../container/settings';
import FestivalDetailScreen from '../container/festivalDetail';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const DRAWER_ITEMS = [
  { route: 'Home', label: 'Home', subtitle: 'Your daily dashboard', icon: 'home' },
  { route: 'Calendar', label: 'Calendar', subtitle: 'Tithi, festivals & fasting', icon: 'calendar' },
  { route: 'Settings', label: 'Settings', subtitle: 'Cities, language & reminders', icon: 'sliders' },
  { route: 'About', label: 'About', subtitle: 'Purpose & app information', icon: 'info' },
];

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
    </Stack.Navigator>
  );
}

function CustomDrawerContent({ navigation, state }) {
  const activeRoute = state.routes[state.index]?.name;

  return (
    <SafeAreaView style={styles.drawerContainer} edges={['top', 'bottom']}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.brandHeader}>
        <View style={styles.logoShell}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandEyebrow}>JAIN LIVING</Text>
          <Text style={styles.brandTitle}>Jain Calendar</Text>
          <Text style={styles.brandSubtitle}>Mindful days. Timeless values.</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.closeDrawer()}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        >
          <Icon name="x" size={20} color="#d7dfed" />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>EXPLORE</Text>

      <View style={styles.menuList}>
        {DRAWER_ITEMS.map(item => {
          const isActive = activeRoute === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.drawerItem, isActive && styles.drawerItemActive]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View style={[styles.iconShell, isActive && styles.iconShellActive]}>
                <Icon
                  name={item.icon}
                  size={21}
                  color={isActive ? '#111827' : '#b8c4d8'}
                />
              </View>
              <View style={styles.itemCopy}>
                <Text style={[styles.drawerText, isActive && styles.drawerTextActive]}>
                  {item.label}
                </Text>
                <Text style={styles.drawerSubtitle}>{item.subtitle}</Text>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={isActive ? '#e6a84b' : '#53617a'}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerMark}>
          <Icon name="sun" size={16} color="#e6a84b" />
        </View>
        <View>
          <Text style={styles.footerTitle}>Ahimsa · Anekant · Aparigraha</Text>
          <Text style={styles.footerText}>Jai Jinendra</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const renderDrawerContent = props => <CustomDrawerContent {...props} />;

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={{
        drawerType: 'front',
        overlayColor: 'rgba(3, 7, 18, 0.72)',
        swipeEdgeWidth: 70,
        drawerStyle: styles.drawer,
        headerShown: false,
      }}
      initialRouteName="Home"
    >
      <Drawer.Screen name="Home" component={MainStack} />
      <Drawer.Screen name="Calendar" component={PanchangCalendar} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen
        name="FestivalDetail"
        component={FestivalDetailScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen name="About" component={About} />
      <Drawer.Screen
        name="QRCodeScreen"
        component={QRCodeScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawer: {
    width: '86%',
    maxWidth: 360,
    backgroundColor: '#0b1020',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: '#0b1020',
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -125,
    right: -80,
    backgroundColor: 'rgba(230,168,75,0.13)',
  },
  glowBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -170,
    left: -120,
    backgroundColor: 'rgba(55,91,145,0.15)',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 24,
  },
  logoShell: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#fff7dd',
    borderWidth: 1,
    borderColor: '#e6a84b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 44, height: 44 },
  brandCopy: { flex: 1, marginLeft: 13 },
  brandEyebrow: {
    color: '#e6a84b',
    fontSize: 9,
    letterSpacing: 1.8,
    fontWeight: '800',
  },
  brandTitle: {
    color: '#fff7dd',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  brandSubtitle: { color: '#8290a8', fontSize: 10, marginTop: 2 },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: 'rgba(183,198,224,0.12)' },
  sectionLabel: {
    color: '#68768f',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 8,
  },
  menuList: { flex: 1 },
  drawerItem: {
    minHeight: 72,
    borderRadius: 18,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  drawerItemActive: {
    backgroundColor: 'rgba(230,168,75,0.12)',
    borderColor: 'rgba(230,168,75,0.32)',
  },
  iconShell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151e32',
  },
  iconShellActive: { backgroundColor: '#e6a84b' },
  itemCopy: { flex: 1, marginLeft: 13 },
  drawerText: { color: '#e8edf6', fontSize: 16, fontWeight: '700' },
  drawerTextActive: { color: '#ffe3ad' },
  drawerSubtitle: { color: '#7f8ca5', fontSize: 11, marginTop: 3 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(183,198,224,0.12)',
    paddingVertical: 20,
    paddingHorizontal: 6,
  },
  footerMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(230,168,75,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  footerTitle: { color: '#a9b5c8', fontSize: 10, fontWeight: '600' },
  footerText: {
    color: '#e6a84b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
});
