import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';

// 설비 종류별 기본 점검 항목 정의
const DEFAULT_CHECKLISTS = {
  '1호 모터 설비': [
    { id: 1, title: '모터 발열 상태 (온도 측정)', checked: false },
    { id: 2, title: '진동 및 이상 소음 유무', checked: false },
    { id: 3, title: '전원 단자대 볼트 체결 상태', checked: false },
    { id: 4, title: '접지선 연결 및 절연 상태', checked: false },
  ],
  '메인 펌프 설비': [
    { id: 1, title: '흡입/토출 압력 게이지 확인', checked: false },
    { id: 2, title: '메카니컬 씰 누수 여부', checked: false },
    { id: 3, title: '베어링 오일 유량 및 오염도', checked: false },
    { id: 4, title: '배관 연결부 플랜지 체결 상태', checked: false },
  ],
  'A라인 컨베이어': [
    { id: 1, title: '벨트 장력 및 쏠림 현상 점검', checked: false },
    { id: 2, title: '롤러 및 롤러 베어링 회전 상태', checked: false },
    { id: 3, title: '비상정지 풀코드 스위치 작동', checked: false },
    { id: 4, title: '구동 체인 리스/윤활유 상태', checked: false },
  ],
  '유압 프레스 설비': [
    { id: 1, title: '유압유 탱크 유량 및 온도 점검', checked: false },
    { id: 2, title: '유압 실린더 누유 여부', checked: false },
    { id: 3, title: '안전 센서(광선식) 동작 테스트', checked: false },
    { id: 4, title: '금형 고정 볼트 체결 토크', checked: false },
  ],
  '공기 압축기 (콤프레샤)': [
    { id: 1, title: '토출 공기 압력 유지 상태', checked: false },
    { id: 2, title: '응축수 자동 배출(드레인) 작동', checked: false },
    { id: 3, title: '에어 필터 오염 및 소음기 점검', checked: false },
    { id: 4, title: '오일 세퍼레이터 압력차 확인', checked: false },
  ],
};

export default function ChecklistScreen({ route, navigation }) {
  const { zoneName } = route.params || { zoneName: '1호 모터 설비' };

  // 설비 명칭에 맞는 체크리스트 불러오기 (없으면 기본 4개 항목)
  const initialItems = DEFAULT_CHECKLISTS[zoneName] || [
    { id: 1, title: '전원 및 주요 전압 상태', checked: false },
    { id: 2, title: '외관 손상 및 누유 여부', checked: false },
    { id: 3, title: '비상정지 스위치 동작 확인', checked: false },
    { id: 4, title: '구동부 소음 및 진동 상태', checked: false },
  ];

  const [items, setItems] = useState(initialItems);
  const [memo, setMemo] = useState('');

  // 체크박스 토글
  const toggleCheck = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // 저장 버튼 핸들러
  const handleSave = () => {
    const uncheckedCount = items.filter(item => !item.checked).length;
    
    if (uncheckedCount > 0) {
      Alert.alert(
        '점검 미완료 항목 존재',
        `아직 체크되지 않은 항목이 ${uncheckedCount}개 있습니다. 이대로 저장할까요?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '저장', onPress: processSave }
        ]
      );
    } else {
      processSave();
    }
  };

  const processSave = () => {
    const { onComplete } = route.params || {};
    const allChecked = items.every(item => item.checked);

    Alert.alert('점검 완료', `${zoneName} 점검 내역이 성공적으로 저장되었습니다.`, [
      { 
        text: '확인', 
        onPress: () => {
          if (onComplete) {
            onComplete(allChecked); // 모든 항목이 체크되었으면 정상(true), 미체크가 있으면 조치필요(false)
          }
          navigation.goBack();
        } 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 상단 설비 정보 헤더 */}
      <View style={styles.headerBox}>
        <Text style={styles.headerSub}>현장 설비 점검표</Text>
        <Text style={styles.headerTitle}>⚙️ {zoneName}</Text>
      </View>
      
      <ScrollView style={styles.listContainer}>
        <Text style={styles.sectionTitle}>필수 점검 항목</Text>
        {items.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.checkCard, item.checked && styles.checkCardDone]}
            onPress={() => toggleCheck(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.checkIcon}>{item.checked ? '✅' : '⬜'}</Text>
            <Text style={[styles.checkText, item.checked && styles.checkTextDone]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}

        {/* 현장 특이사항 메모 입력 영역 */}
        <Text style={styles.sectionTitle}>특이사항 및 조치 메모</Text>
        <TextInput
          style={styles.memoInput}
          placeholder="이상 증상이나 조치 필요 내용을 입력하세요 (선택)"
          placeholderTextColor="#a4b0be"
          multiline={true}
          numberOfLines={4}
          value={memo}
          onChangeText={setMemo}
        />
      </ScrollView>

      {/* 저장 버튼 */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>점검 결과 저장</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f1f2f6', 
    padding: 16 
  },
  headerBox: {
    backgroundColor: '#2f3640',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerSub: {
    color: '#00d2d3',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#57606f',
    marginTop: 10,
    marginBottom: 8,
  },
  listContainer: { 
    flex: 1 
  },
  checkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dfe4ea',
    elevation: 1,
  },
  checkCardDone: { 
    backgroundColor: '#e8f8f5', 
    borderColor: '#2ed573' 
  },
  checkIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  checkText: { 
    fontSize: 15, 
    color: '#2f3640',
    fontWeight: '500',
    flex: 1,
  },
  checkTextDone: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  memoInput: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dfe4ea',
    textAlignVertical: 'top',
    height: 100,
    fontSize: 14,
    color: '#2f3640',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  saveButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});