import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INITIAL_FACILITIES = {
  '1호 모터 설비': { status: 'OK', label: '🟢 정상 가동중' },
  '메인 펌프 설비': { status: 'OK', label: '🟢 정상 가동중' },
  'A라인 컨베이어': { status: 'WARN', label: '🔴 점검 필요 (진동 발생)' },
  '유압 프레스 설비': { status: 'OK', label: '🟢 정상 가동중' },
  '공기 압축기 (콤프레샤)': { status: 'OK', label: '🟢 정상 가동중' },
};

export default function MainScreen({ navigation }) {
  const [facilities, setFacilities] = useState(INITIAL_FACILITIES);

  // 앱 시작 시 저장된 상태 불러오기
  useEffect(() => {
    loadFacilityData();
  }, []);

  const loadFacilityData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('@facility_status');
      if (savedData !== null) {
        setFacilities(JSON.parse(savedData));
      }
    } catch (e) {
      console.log('데이터 불러오기 실패', e);
    }
  };

  // 상태 변경 시 저장하는 함수
  const saveFacilityData = async (newData) => {
    try {
      await AsyncStorage.setItem('@facility_status', JSON.stringify(newData));
    } catch (e) {
      console.log('데이터 저장 실패', e);
    }
  };

  const goToChecklist = (zoneName) => {
    navigation.navigate('Checklist', {
      zoneName,
      onComplete: (isSuccess) => {
        setFacilities(prev => {
          const updated = {
            ...prev,
            [zoneName]: {
              status: isSuccess ? 'OK' : 'WARN',
              label: isSuccess ? '🟢 점검 완료 (정상)' : '🔴 조치 필요 (이상)'
            }
          };
          saveFacilityData(updated); // 스마트폰에 영구 저장
          return updated;
        });
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>🏭 공장 설비 종합 현장 모니터링</Text>
      <Text style={styles.subTitle}>공장 레이아웃을 좌우로 스크롤하여 점검할 설비를 선택하세요.</Text>

      <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
        <ScrollView vertical={true} showsVerticalScrollIndicator={true} style={styles.verticalScroll}>
          
          <View style={styles.factoryFloor}>
            
            {/* 1라인 */}
            <TouchableOpacity 
              style={[styles.facilityCard, { top: 40, left: 40, width: 200 }]} 
              onPress={() => goToChecklist('1호 모터 설비')}
            >
              <Text style={styles.facilityIcon}>⚡</Text>
              <Text style={styles.facilityTitle}>1호 모터 설비</Text>
              <Text style={facilities['1호 모터 설비']?.status === 'OK' ? styles.statusGreen : styles.statusRed}>
                {facilities['1호 모터 설비']?.label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.facilityCard, { top: 40, left: 280, width: 200 }]} 
              onPress={() => goToChecklist('메인 펌프 설비')}
            >
              <Text style={styles.facilityIcon}>💧</Text>
              <Text style={styles.facilityTitle}>메인 펌프 설비</Text>
              <Text style={facilities['메인 펌프 설비']?.status === 'OK' ? styles.statusGreen : styles.statusRed}>
                {facilities['메인 펌프 설비']?.label}
              </Text>
            </TouchableOpacity>

            {/* 2라인 */}
            <TouchableOpacity 
              style={[styles.facilityCard, { top: 200, left: 40, width: 200 }]} 
              onPress={() => goToChecklist('A라인 컨베이어')}
            >
              <Text style={styles.facilityIcon}>📦</Text>
              <Text style={styles.facilityTitle}>A라인 컨베이어</Text>
              <Text style={facilities['A라인 컨베이어']?.status === 'OK' ? styles.statusGreen : styles.statusRed}>
                {facilities['A라인 컨베이어']?.label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.facilityCard, { top: 200, left: 280, width: 200 }]} 
              onPress={() => goToChecklist('유압 프레스 설비')}
            >
              <Text style={styles.facilityIcon}>🏗️</Text>
              <Text style={styles.facilityTitle}>유압 프레스 설비</Text>
              <Text style={facilities['유압 프레스 설비']?.status === 'OK' ? styles.statusGreen : styles.statusRed}>
                {facilities['유압 프레스 설비']?.label}
              </Text>
            </TouchableOpacity>

            {/* 3라인 */}
            <TouchableOpacity 
              style={[styles.facilityCard, { top: 360, left: 160, width: 220 }]} 
              onPress={() => goToChecklist('공기 압축기 (콤프레샤)')}
            >
              <Text style={styles.facilityIcon}>💨</Text>
              <Text style={styles.facilityTitle}>공기 압축기 (콤프레샤)</Text>
              <Text style={facilities['공기 압축기 (콤프레샤)']?.status === 'OK' ? styles.statusGreen : styles.statusRed}>
                {facilities['공기 압축기 (콤프레샤)']?.label}
              </Text>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e272e', padding: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#f5f6fa' },
  subTitle: { fontSize: 12, color: '#dcdde1', marginBottom: 10 },
  horizontalScroll: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#485460',
    backgroundColor: '#2f3640',
  },
  verticalScroll: { width: 550 },
  factoryFloor: { width: 550, height: 520, position: 'relative', backgroundColor: '#353b48' },
  facilityCard: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    elevation: 4,
    borderWidth: 2,
    borderColor: '#dcdde1',
  },
  facilityIcon: { fontSize: 24, marginBottom: 6 },
  facilityTitle: { fontSize: 14, fontWeight: 'bold', color: '#2f3640', marginBottom: 4 },
  statusGreen: { fontSize: 11, fontWeight: 'bold', color: '#2ed573' },
  statusRed: { fontSize: 11, fontWeight: 'bold', color: '#ff4757' },
});