import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

const About = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.text}>🕉️ Jain Panchang Calendar App</Text>
      <Text style={styles.text}>Developed with ❤️ in React Native</Text>
    </View>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    marginVertical: 6,
  },
});
