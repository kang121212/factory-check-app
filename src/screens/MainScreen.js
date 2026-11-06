import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';

export default function MainScreen({ navigation }) {
  // 헤더 오른쪽에 로그아웃 버튼 배치
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleLogout = () => {
    const executeLogout = () => {
      // 로그인 화면으로 교체 (뒤로가기 방지)
      navigation.replace('Login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('정말 로그아웃 하시겠습니까?')) {
        executeLogout();
      }
    } else {
      Alert.alert(
        '로그아웃',
        '정말 로그아웃 하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '확인', onPress: executeLogout },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏭 스마트 현장 공장 레이아웃</Text>
      <Text style={styles.subtitle}>점검할 구역 또는 설비를 선택하세요.</Text>

      {/* 기존 레이아웃 및 설비 버튼들 */}
      <View style={styles.zoneContainer}>
        <TouchableOpacity 
          style={styles.zoneCard}
          onPress={() => navigation.navigate('Checklist', { zoneName: 'A구역 (모터 및 펌프)' })}
        >
          <Text style={styles.zoneTitle}>A구역: 모터 / 펌프</Text>
          <Text style={styles.zoneDesc>상태 양호 - 점검 대기중</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.zoneCard}
          onPress={() => navigation.navigate('Checklist', { zoneName: 'B구역 (컨베이어 및 프레스)' })}
        >
          <Text style={styles.zoneTitle}>B구역: 컨베이어 / 프레스</Text>
          <Text style={styles.zoneDesc}>점검 필요 항목 있음</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f6fa', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2f3640', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#718093', marginBottom: 20 },
  zoneContainer: { gap: 15 },
  zoneCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#dcdde1', elevation: 2 },
  zoneTitle: { fontSize: 18, fontWeight: 'bold', color: '#2f3640', marginBottom: 5 },
  zoneDesc: { fontSize: 14, color: '#e84118', fontWeight: '600' },
  logoutBtn: { marginRight: 8, paddingHorizontal: 10, paddingVertical: 5 },
  logoutText: { color: '#e84118', fontWeight: 'bold', fontSize: 15 },
});