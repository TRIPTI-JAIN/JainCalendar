import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import DrawerNavigator from './src/com/calendar/drawerNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <NavigationContainer>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <DrawerNavigator /> {/* This now includes all your routes */}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
