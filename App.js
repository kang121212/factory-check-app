import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainScreen from './src/screens/MainScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* 로그인 화면 (헤더 숨김) */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        {/* 회원가입 화면 */}
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ title: '회원가입' }}
        />
        {/* 메인 공장 레이아웃 화면 */}
        <Stack.Screen 
          name="Main" 
          component={MainScreen} 
          options={{ title: '공장 구역 레이아웃', headerBackVisible: false }}
        />
        {/* 설비 점검 체크리스트 화면 */}
        <Stack.Screen 
          name="Checklist" 
          component={ChecklistScreen} 
          options={{ title: '설비 점검 체크리스트' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}