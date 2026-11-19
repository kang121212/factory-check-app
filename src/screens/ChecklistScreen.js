import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import {
  getCurrentSession,
  getCompanyLayoutKey,
  getCompanyLogsKey,
  getJsonStorage,
  setJsonStorage,
} from '../utils/tenantStorage';

const TEMPLATE_CHECKLISTS = {
  '1호 모터 설비': [
    '모터 발열 상태 (온도 측정)',
    '진동 및 이상 소음 유무',
    '전원 단자대 볼트 체결 상태',
    '접지선 연결 및 절연 상태',
  ],
  '메인 펌프 설비': [
    '흡입/토출 압력 게이지 확인',
    '메카니컬 씰 누수 여부',
    '베어링 오일 유량 및 오염도',
    '배관 연결부 플랜지 체결 상태',
  ],
  'A라인 컨베이어': [
    '벨트 장력 및 쏠림 현상 점검',
    '롤러 및 롤러 베어링 회전 상태',
    '비상정지 풀코드 스위치 작동',
    '구동 체인 그리스/윤활유 상태',
  ],
  '유압 프레스 설비': [
    '유압유 탱크 유량 및 온도 점검',
    '유압 실린더 누유 여부',
    '안전 센서(광선식) 동작 테스트',
    '금형 고정 볼트 체결 토크',
  ],
  '공기 압축기 (콤프레샤)': [
    '토출 공기 압력 유지 상태',
    '응축수 자동 배출(드레인) 작동',
    '에어 필터 오염 및 소음기 점검',
    '오일 세퍼레이터 압력차 확인',
  ],
};

const GENERAL_TEMPLATE = [
  '전원 및 주요 전압 상태',
  '외관 손상 및 누유 여부',
  '비상정지 스위치 동작 확인',
  '구동부 소음 및 진동 상태',
];

export default function ChecklistScreen({ route, navigation }) {
  const {
    zoneId,
    zoneName = '점검 구간',
    checklist: initialChecklist = [],
    memo: initialMemo = '',
    companyCode: paramCompanyCode,
    role: paramRole,
    onSaved,
  } = route.params || {};

  const normalizeItems = (list) =>
    (Array.isArray(list) ? list : []).map((item, idx) => ({
      id: item.id ?? `item_${Date.now()}_${idx}`,
      title: typeof item === 'string' ? item : item.title || '점검 항목',
      checked: Boolean(item.checked),
    }));

  const [companyCode, setCompanyCode] = useState(paramCompanyCode || 'DEFAULT_CO');
  const [role, setRole] = useState(paramRole || 'WORKER');
  const isAdmin = role === 'ADMIN';

  const [items, setItems] = useState(normalizeItems(initialChecklist));
  const [newItemTitle, setNewItemTitle] = useState('');
  const [memo, setMemo] = useState(initialMemo || '');
  const [isManageMode, setIsManageMode] = useState(false);

  const showAlert = (title, message, onOk) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, message, [{ text: '확인', onPress: onOk }]);
    }
  };

  useEffect(() => {
    const initSessionAndTemplate = async () => {
      const session = await getCurrentSession();
      const activeCode = paramCompanyCode || session.companyCode;
      const activeRole = paramRole || session.role;

      setCompanyCode(activeCode);
      setRole(activeRole);
      if (activeRole !== 'ADMIN') {
        setIsManageMode(false);
      }

      if (items.length === 0) {
        const matched = TEMPLATE_CHECKLISTS[zoneName] || GENERAL_TEMPLATE;
        setItems(
          matched.map((title, i) => ({
            id: `tpl_${Date.now()}_${i}`,
            title,
            checked: false,
          }))
        );
      }
    };
    initSessionAndTemplate();
  }, [paramCompanyCode, paramRole, zoneName]);

  const toggleCheck = (id) => {
    if (isManageMode) return;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleAddItem = () => {
    if (!isAdmin) {
      showAlert('권한 없음', '점검 항목 추가는 관리자만 가능합니다.');
      return;
    }
    const trimmed = newItemTitle.trim();
    if (!trimmed) {
      showAlert('알림', '추가할 점검 항목 이름을 입력해주세요.');
      return;
    }

    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      checked: false,
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemTitle('');
  };

  const handleDeleteItem = (id) => {
    if (!isAdmin) {
      showAlert('권한 없음', '점검 항목 삭제는 관리자만 가능합니다.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLoadTemplate = () => {
    if (!isAdmin) {
      showAlert('권한 없음', '템플릿 불러오기는 관리자만 가능합니다.');
      return;
    }
    const matched = TEMPLATE_CHECKLISTS[zoneName] || GENERAL_TEMPLATE;
    setItems(
      matched.map((title, idx) => ({
        id: `tpl_${Date.now()}_${idx}`,
        title,
        checked: false,
      }))
    );
    showAlert('템플릿 적용', `'${zoneName}' 기준 기본 항목을 불러왔습니다.`);
  };

  const commitSave = async () => {
    try {
      const session = await getCurrentSession();
      const targetCompany = paramCompanyCode || companyCode || session.companyCode;
      const layoutKey = getCompanyLayoutKey(targetCompany);
      const logsKey = getCompanyLogsKey(targetCompany);

      const allChecked = items.length > 0 && items.every((item) => item.checked);
      const checkedAt = new Date().toISOString();

      const layoutData = await getJsonStorage(layoutKey, null);
      if (layoutData && Array.isArray(layoutData.zones) && zoneId) {
        const updatedZones = layoutData.zones.map((z) =>
          z.id === zoneId
            ? {
                ...z,
                checklist: items,
                memo,
                status: allChecked ? 'NORMAL' : 'ACTION_REQUIRED',
                lastCheckedAt: checkedAt,
              }
            : z
        );
        await setJsonStorage(layoutKey, {
          ...layoutData,
          zones: updatedZones,
        });
      }

      const prevLogs = (await getJsonStorage(logsKey, [])) || [];
      const newLog = {
        id: `log_${Date.now()}`,
        companyCode: targetCompany,
        inspectorId: session.userId || (isAdmin ? '관리자' : '현장작업자'),
        inspectorRole: role,
        zoneId: zoneId || null,
        zoneName,
        checkedAt,
        allChecked,
        totalCount: items.length,
        checkedCount: items.filter((i) => i.checked).length,
        memo,
        items,
      };
      await setJsonStorage(logsKey, [newLog, ...prevLogs]);

      if (onSaved) {
        await onSaved();
      }

      showAlert('저장 완료', `[${targetCompany}] ${zoneName} 점검 결과가 저장되었습니다.`, () => {
        navigation.goBack();
      });
    } catch (err) {
      console.error('체크리스트 저장 오류:', err);
      showAlert('오류', '저장 중 문제가 발생했습니다.');
    }
  };

  const handleSave = () => {
    if (items.length === 0) {
      showAlert('알림', '점검 항목이 최소 1개 이상 있어야 합니다.');
      return;
    }

    const uncheckedCount = items.filter((item) => !item.checked).length;
    if (!isManageMode && uncheckedCount > 0) {
      if (Platform.OS === 'web') {
        if (
          window.confirm(
            `체크되지 않은 항목이 ${uncheckedCount}개 있습니다. 이대로 저장할까요?`
          )
        ) {
          commitSave();
        }
      } else {
        Alert.alert(
          '점검 미완료 항목 존재',
          `아직 체크되지 않은 항목이 ${uncheckedCount}개 있습니다. 이대로 저장할까요?`,
          [
            { text: '취소', style: 'cancel' },
            { text: '저장', onPress: commitSave },
          ]
        );
      }
      return;
    }

    commitSave();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerSub}>
          [{companyCode}] · {isAdmin ? '관리자' : '현장 작업자(점검 전용)'}
        </Text>
        <Text style={styles.headerTitle}>⚙️ {zoneName}</Text>

        {/* 관리자만 항목 편집 모드 전환 가능 */}
        {isAdmin && (
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeChip, !isManageMode && styles.modeChipActive]}
              onPress={() => setIsManageMode(false)}
            >
              <Text style={[styles.modeChipText, !isManageMode && styles.modeChipTextActive]}>
                현장 점검 모드
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeChip, isManageMode && styles.modeChipActive]}
              onPress={() => setIsManageMode(true)}
            >
              <Text style={[styles.modeChipText, isManageMode && styles.modeChipTextActive]}>
                항목 편집 모드
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.listContainer}>
        {isAdmin && isManageMode && (
          <View style={styles.editorBox}>
            <Text style={styles.editorTitle}>새 점검 항목 추가</Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="예: 감속기 오일 레벨 확인"
                placeholderTextColor="#a4b0be"
                value={newItemTitle}
                onChangeText={setNewItemTitle}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
                <Text style={styles.addBtnText}>+ 추가</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.templateBtn} onPress={handleLoadTemplate}>
              <Text style={styles.templateBtnText}>기본 설비 템플릿 불러오기</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          {isAdmin && isManageMode
            ? `등록된 점검 항목 (${items.length}개) — 우측 삭제로 제거 가능`
            : `점검 항목 (${items.filter((i) => i.checked).length}/${items.length} 완료)`}
        </Text>

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>등록된 점검 항목이 없습니다.</Text>
          </View>
        ) : (
          items.map((item) => (
            <View
              key={item.id}
              style={[
                styles.checkCard,
                !(isAdmin && isManageMode) && item.checked && styles.checkCardDone,
              ]}
            >
              <TouchableOpacity
                style={styles.checkPressArea}
                onPress={() => toggleCheck(item.id)}
                disabled={isAdmin && isManageMode}
                activeOpacity={0.7}
              >
                <Text style={styles.checkIcon}>
                  {isAdmin && isManageMode ? '•' : item.checked ? '✅' : '⬜'}
                </Text>
                <Text
                  style={[
                    styles.checkText,
                    !(isAdmin && isManageMode) && item.checked && styles.checkTextDone,
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>

              {isAdmin && isManageMode && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <Text style={styles.deleteBtnText}>삭제</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>특이사항 및 조치 메모</Text>
        <TextInput
          style={styles.memoInput}
          placeholder="이상 증상이나 조치 필요 내용을 입력하세요 (선택)"
          placeholderTextColor="#a4b0be"
          multiline
          numberOfLines={4}
          value={memo}
          onChangeText={setMemo}
        />
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>
          {isAdmin && isManageMode ? '구간 체크리스트 저장' : '점검 결과 저장'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f2f6', padding: 16 },
  headerBox: {
    backgroundColor: '#2f3640',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
  },
  headerSub: { color: '#00d2d3', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#404a56',
    alignItems: 'center',
  },
  modeChipActive: { backgroundColor: '#00d2d3' },
  modeChipText: { color: '#dcdde1', fontSize: 13, fontWeight: 'bold' },
  modeChipTextActive: { color: '#1e272e' },
  listContainer: { flex: 1 },
  editorBox: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcdde1',
    marginBottom: 10,
  },
  editorTitle: { fontSize: 14, fontWeight: 'bold', color: '#2f3640', marginBottom: 8 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2f3640',
  },
  addBtn: {
    backgroundColor: '#3742fa',
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  templateBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f1f2f6',
  },
  templateBtnText: { color: '#2f3640', fontSize: 12, fontWeight: '600' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#57606f',
    marginTop: 8,
    marginBottom: 8,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dfe4ea',
    marginBottom: 10,
  },
  emptyText: { fontSize: 13, color: '#718093' },
  checkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dfe4ea',
  },
  checkCardDone: { backgroundColor: '#e8f8f5', borderColor: '#2ed573' },
  checkPressArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkIcon: { fontSize: 18, marginRight: 12 },
  checkText: { fontSize: 15, color: '#2f3640', fontWeight: '500', flex: 1 },
  checkTextDone: { color: '#27ae60', fontWeight: 'bold' },
  deleteBtn: {
    backgroundColor: '#ff4757',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
  deleteBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
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
    marginTop: 6,
  },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});