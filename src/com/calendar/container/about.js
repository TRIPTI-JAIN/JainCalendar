import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
const width = Dimensions.get('window').width;
const About = () => {
  const navigation = useNavigation();
  const [contact, setContact] = useState([]);
  const [text, onChangeText] = useState('Useless Text');
  const [number, onChangeNumber] = useState('');

  useEffect(() => {
    getContact();
  }, []);

  const getContact = async () => {
    try {
      let URL = 'https://dummyjson.com/users';
      let response = await fetch(URL, 'GET');
      let res = await response.json();
      setContact(res.users);
    } catch (e) {
      console.log(e);
    }
  };

  const renderContact = data => {
    console.log(data);
    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('Home');
        }}
        style={{
          height: 30,
          width: '100%',
          backgroundColor: 'grey',
          margin: 2,
        }}
      >
        <Text>{data.item.firstName + ' ' + data.item.lastName}</Text>
      </TouchableOpacity>
    );
  };

  console.log(contact);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginHorizontal: 30, marginVertical: 50 }}
        >
          <Icon name="arrow-left" size={24} color="#000" />

          <TextInput
            style={styles.input}
            onChangeText={text => {
              onChangeNumber(text);
              // _.find(contact, function(val) {
              //   return val.firstName.search(text); ;
              // });
            }}
            value={number}
            placeholder="useless placeholder"
          />
          <View style={{}}>
            <FlatList
              data={contact}
              // horizontal={false}
              keyExtractor={item => item.id}
              // renderItem={() => item => <renderContact item={item} />}
              renderItem={renderContact}
              initialNumToRender={10}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    marginVertical: 6,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
