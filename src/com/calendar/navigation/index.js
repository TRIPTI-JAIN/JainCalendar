import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../container/splash';
import Home from '../container/home';
import PanchangCalendar from '../container/panchangCalendar';

const Stack = createNativeStackNavigator();

const Navigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="PanchangCalendar" component={PanchangCalendar} />
    </Stack.Navigator>
  );
};

export default Navigator;
