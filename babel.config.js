// module.exports = {
//   presets: ['module:@react-native/babel-preset'],
// };

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin', // 👈 MUST be last in the array
  ],
};
