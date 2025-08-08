import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/Feather';
import { storage } from '../utility/mmkvStorage';

const QRCodeScreen = ({ name = 'Tripti Jain', amount = '40' }) => {
  const [upiIdInput, setUpiIdInput] = useState('');
  const [upiId, setUpiId] = useState('');
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      const savedUpi = storage.getString('upiID');
      setUpiId(savedUpi || '');
    }
  }, [isFocused]);

  const handleSubmit = () => {
    if (upiIdInput.trim()) {
      storage.set('upiID', upiIdInput.trim());
      setUpiId(upiIdInput.trim());
    }
  };

  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    name,
  )}&am=${amount}&cu=INR`;

  if (!upiId) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container1}
      >
        <View>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={30} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 24, height: '80%' }}>
            <Text style={styles.label}>
              Enter your Default UPI ID to receive Payment
            </Text>
            <TextInput
              style={styles.input}
              placeholder="example@upi"
              value={upiIdInput}
              onChangeText={setUpiIdInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={[styles.button, { justifyContent: 'flex-end' }]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>Save UPI ID</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Pay ₹{amount} via GPay</Text>
        <QRCode value={upiUri} size={220} />
        <Text style={styles.info}>Scan using any UPI app</Text>
        <Text style={styles.upi}>UPI ID: {upiId}</Text>

        <TouchableOpacity
          onPress={() => setUpiId('')}
          style={[styles.button, { marginTop: 20 }]}
        >
          <Text style={styles.buttonText}>Change UPI ID</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QRCodeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  headerTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  info: {
    marginTop: 20,
    fontSize: 14,
    color: '#555',
  },
  upi: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  container1: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
  },

  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
