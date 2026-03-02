/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    const mockReact = require('react');
    const { View } = require('react-native');

    return mockReact.createElement(View, null, children);
  },
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    const mockReact = require('react');
    const { View } = require('react-native');

    return mockReact.createElement(View, null, children);
  },
}));

jest.mock('../src/com/calendar/drawerNavigator', () => {
  const mockReact = require('react');
  const { View } = require('react-native');

  return function MockDrawerNavigator() {
    return mockReact.createElement(View);
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
