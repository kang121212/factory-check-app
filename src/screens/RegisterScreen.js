import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleRegister = async () => {
    if (!username || !password || !name) {
      Alert.alert('알림', '모든 항목을 입력해주세요.');
      return;
    }

    try {
      const userData = { username, password, name };
      // 로컬 스토리지에 회원 정보 저장
      await AsyncStorage.setItem('@user_account', JSON.stringify(userData));
      Alert.alert('가입 완료', '회원가입이 완료되었습니다. 로그인해 주세요.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('오류', '회원가입 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 현장 작업자 회원가입</Text>

      <TextInput
        style={styles.input}
        placeholder="이름 (예: 홍길동)"
        placeholderTextColor="#a4b0be"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="사원 아이디"
        placeholderTextColor="#a4b0be"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor="#a4b0be"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>가입하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f6fa' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2f3640', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#dcdde1', marginBottom: 12, fontSize: 15 },
  button: { backgroundColor: '#2ed573', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});