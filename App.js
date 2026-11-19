import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainScreen from './src/screens/MainScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import LayoutScreen from './src/screens/LayoutScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: '신규 사원 등록' }}
        />
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{
            title: '공장 구역 레이아웃',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="Checklist"
          component={ChecklistScreen}
          options={{ title: '설비 점검 체크리스트' }}
        />
        <Stack.Screen
          name="Layout"
          component={LayoutScreen}
          options={{ title: '공장 레이아웃 설정' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}