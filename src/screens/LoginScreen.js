import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert('알림', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      let savedUser = null;
      
      if (Platform.OS === 'web') {
        savedUser = localStorage.getItem('@user_account');
      } else {
        savedUser = await AsyncStorage.getItem('@user_account');
      }
      
      if (!savedUser) {
        showAlert('로그인 실패', '등록된 계정이 없습니다. 회원가입을 진행해주세요.');
        return;
      }

      const user = JSON.parse(savedUser);

      if (user.username === username && user.password === password) {
        setUsername('');
        setPassword('');
        navigation.replace('Main');
      } else {
        showAlert('로그인 실패', '아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (e) {
      console.error(e);
      showAlert('오류', '로그인 처리 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏭 스마트 현장 점검 시스템</Text>
      <Text style={styles.subtitle}>사원 계정으로 로그인하세요.</Text>

      <TextInput
        style={styles.input}
        placeholder="사원 아이디 입력"
        placeholderTextColor="#a4b0be"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 입력"
        placeholderTextColor="#a4b0be"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인하기</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.registerLinkButton} 
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.registerLinkText}>계정이 없으신가요? 신규 사원 등록</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f6fa' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2f3640', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#718093', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#dcdde1', marginBottom: 12, fontSize: 15, color: '#2f3640' },
  loginButton: { backgroundColor: '#3742fa', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  registerLinkButton: { marginTop: 20, alignItems: 'center', padding: 10 },
  registerLinkText: { color: '#57606f', fontSize: 14, fontWeight: '600' },
});