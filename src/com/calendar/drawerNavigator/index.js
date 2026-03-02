import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Home from '../container/home';
import About from '../container/about';
import QRCodeScreen from '../container/QRCode';
import PanchangCalendar from '../container/panchangCalendar';
import SettingsScreen from '../container/settings';
import FestivalDetailScreen from '../container/festivalDetail';
import { createStackNavigator } from '@react-navigation/stack';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Stack navigator (home screen)
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
    </Stack.Navigator>
  );
}

// Custom Drawer Content in dark theme
function CustomDrawerContent({ navigation }) {
  return (
    <SafeAreaView style={styles.drawerContainer}>
      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.drawerText}>🏠 Home</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => navigation.navigate('Calendar')}
      >
        <Text style={styles.drawerText}>🗓 Calendar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.drawerText}>⚙️ Settings</Text>
      </TouchableOpacity>
      {/*
      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => navigation.navigate('QRCodeScreen')}
      >
        <Text style={styles.drawerText}>🚀 QR Code</Text>
      </TouchableOpacity>
      */}
      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => navigation.navigate('About')}
      >
        <Text style={styles.drawerText}>🚀 About</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const renderDrawerContent = props => <CustomDrawerContent {...props} />;

// Main Drawer Navigator
export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#000', // full black background
          // 👈 reduce header height (default is ~80–100)
        },
        headerStyle: {
          backgroundColor: '#000', // header background
          height: 60,
        },
        headerTintColor: '#fff', // header text color
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#aaa',
      }}
      initialRouteName="Home"
    >
      <Drawer.Screen
        name="Home"
        component={MainStack}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="Calendar"
        component={PanchangCalendar}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="FestivalDetail"
        component={FestivalDetailScreen}
        options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="About"
        component={About}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="QRCodeScreen"
        component={QRCodeScreen}
        options={{ headerShown: false }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 40,
  },
  drawerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  drawerText: {
    color: '#fff',
    fontSize: 18,
  },
});
