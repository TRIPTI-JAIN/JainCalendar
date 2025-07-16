import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Video from 'react-native-video';

const Splash = () => {
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Run animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after delay
    const timeout = setTimeout(() => {
      navigation.navigate('Home');
    }, 2000); // 2 seconds
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Video
        source={require('../assets/video/newBack.mp4')} // or use a remote URL
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        muted
        ignoreSilentSwitch="obey"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    height: 200,
    width: 200,
  },
});

export default Splash;
