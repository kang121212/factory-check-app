import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const showAlert = (title, message, callback) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
      if (callback) callback();
    } else {
      Alert.alert(title, message, [{ text: '확인', onPress: callback }]);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert('알림', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      const userData = { username, password };
      await AsyncStorage.setItem('@user_account', JSON.stringify(userData));
      
      showAlert('완료', '회원가입이 완료되었습니다! 로그인해 주세요.', () => {
        navigation.goBack();
      });
    } catch (e) {
      console.error(e);
      showAlert('오류', '회원가입 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>신규 사원 등록</Text>

      <TextInput
        style={styles.input}
        placeholder="생성할 사원 아이디"
        placeholderTextColor="#a4b0be"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="생성할 비밀번호"
        placeholderTextColor="#a4b0be"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.buttonText}>가입하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f6fa' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2f3640', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#dcdde1', marginBottom: 12, fontSize: 15, color: '#2f3640' },
  registerButton: { backgroundColor: '#44bd32', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, cursor: 'pointer' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});