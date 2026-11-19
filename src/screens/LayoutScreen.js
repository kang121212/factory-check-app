import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  Image,
  Modal,
  TextInput,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import {
  getCurrentSession,
  getCompanyLayoutKey,
  getJsonStorage,
  setJsonStorage,
} from '../utils/tenantStorage';

const DEFAULT_CHECKLIST = [
  { id: 'c1', title: '이상 소음 및 진동 확인', checked: false },
  { id: 'c2', title: '온도·압력 게이지 정상 범위 확인', checked: false },
  { id: 'c3', title: '안전커버 및 비상정지 장치 상태 확인', checked: false },
];

export default function LayoutScreen({ navigation, route }) {
  const [companyCode, setCompanyCode] = useState('DEFAULT_CO');
  const [role, setRole] = useState('WORKER');
  const isAdmin = role === 'ADMIN';

  const [imageUri, setImageUri] = useState(null);
  const [zones, setZones] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const [modalVisible, setModalVisible] = useState(false);
  const [pendingCoord, setPendingCoord] = useState(null);
  const [zoneNameInput, setZoneNameInput] = useState('');

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const loadLayoutData = useCallback(async () => {
    try {
      const session = await getCurrentSession();
      const activeCode = route?.params?.companyCode || session.companyCode;
      const activeRole = route?.params?.role || session.role;

      setCompanyCode(activeCode);
      setRole(activeRole);
      if (activeRole !== 'ADMIN') {
        setIsEditMode(false);
      }

      const layoutKey = getCompanyLayoutKey(activeCode);
      const parsed = await getJsonStorage(layoutKey, null);

      if (parsed) {
        setImageUri(parsed.imageUri || null);
        setZones(Array.isArray(parsed.zones) ? parsed.zones : []);
      } else {
        setImageUri(null);
        setZones([]);
      }
    } catch (e) {
      console.error('레이아웃 불러오기 실패:', e);
    }
  }, [route?.params?.companyCode, route?.params?.role]);

  useFocusEffect(
    useCallback(() => {
      loadLayoutData();
    }, [loadLayoutData])
  );

  const saveLayoutData = async (nextImageUri, nextZones, targetCode = companyCode) => {
    if (!isAdmin) {
      showAlert('권한 없음', '도면 및 핀 수정은 관리자만 가능합니다.');
      return;
    }
    try {
      const layoutKey = getCompanyLayoutKey(targetCode);
      await setJsonStorage(layoutKey, {
        imageUri: nextImageUri,
        zones: nextZones,
      });
    } catch (e) {
      console.error('레이아웃 저장 실패:', e);
      showAlert('오류', '레이아웃 저장 중 문제가 발생했습니다.');
    }
  };

  const pickLayoutImage = async () => {
    if (!isAdmin) {
      showAlert('권한 없음', '도면 이미지는 관리자만 등록/변경할 수 있습니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      setImageUri(selectedUri);
      await saveLayoutData(selectedUri, zones, companyCode);
    }
  };

  const handleMapPress = (event) => {
    if (!isAdmin || !isEditMode || !imageUri) return;

    const width = canvasSize.width || 300;
    const height = canvasSize.height || 300;

    const native = event?.nativeEvent || {};
    let x = typeof native.locationX === 'number' ? native.locationX : native.offsetX;
    let y = typeof native.locationY === 'number' ? native.locationY : native.offsetY;

    if (typeof x !== 'number' || Number.isNaN(x)) {
      x = width * 0.5;
    }
    if (typeof y !== 'number' || Number.isNaN(y)) {
      y = height * 0.5;
    }

    const xPercent = Math.min(98, Math.max(2, (x / width) * 100));
    const yPercent = Math.min(98, Math.max(2, (y / height) * 100));

    setPendingCoord({
      xPercent: Number(xPercent.toFixed(1)),
      yPercent: Number(yPercent.toFixed(1)),
    });
    setZoneNameInput('');
    setModalVisible(true);
  };

  const handleConfirmAddZone = async () => {
    if (!isAdmin) {
      showAlert('권한 없음', '핀 추가는 관리자만 가능합니다.');
      return;
    }
    if (!zoneNameInput.trim()) {
      showAlert('알림', '점검할 설비 또는 구간 이름을 입력해주세요.');
      return;
    }
    if (!pendingCoord) return;

    const newZone = {
      id: `zone_${Date.now()}`,
      name: zoneNameInput.trim(),
      xPercent: pendingCoord.xPercent,
      yPercent: pendingCoord.yPercent,
      checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
      memo: '',
      status: null,
      lastCheckedAt: null,
    };

    const updatedZones = [...zones, newZone];
    setZones(updatedZones);
    await saveLayoutData(imageUri, updatedZones, companyCode);

    setModalVisible(false);
    setPendingCoord(null);
    setZoneNameInput('');
  };

  const openChecklist = (zone) => {
    navigation.navigate('Checklist', {
      zoneId: zone.id,
      zoneName: zone.name,
      checklist: zone.checklist,
      memo: zone.memo || '',
      companyCode,
      role,
      onSaved: loadLayoutData,
    });
  };

  const handlePinPress = async (zone) => {
    if (isAdmin && isEditMode) {
      const deletePin = async () => {
        const filtered = zones.filter((z) => z.id !== zone.id);
        setZones(filtered);
        await saveLayoutData(imageUri, filtered, companyCode);
      };

      if (Platform.OS === 'web') {
        if (window.confirm(`'${zone.name}' 구간 핀을 삭제할까요?`)) {
          await deletePin();
        }
      } else {
        Alert.alert('구간 삭제', `'${zone.name}' 구간 핀을 삭제할까요?`, [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: deletePin },
        ]);
      }
    } else {
      openChecklist(zone);
    }
  };

  const getPinColor = (zone) => {
    if (isAdmin && isEditMode) return '#e84118';
    if (zone.status === 'NORMAL') return '#2ed573';
    if (zone.status === 'ACTION_REQUIRED') return '#ffa502';
    return '#0097e6';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>공장 레이아웃 및 점검 구간</Text>
      <Text style={styles.subtitle}>
        회사: <Text style={styles.companyHighlight}>{companyCode}</Text> · 권한:{' '}
        <Text style={styles.roleHighlight}>{isAdmin ? '관리자' : '현장 작업자(점검 전용)'}</Text>
      </Text>

      {!isAdmin && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            일반 작업자 계정은 도면 등록 및 핀 추가/삭제가 제한되며, 핀을 눌러 점검만 진행할 수 있습니다.
          </Text>
        </View>
      )}

      {/* 관리자만 도면 등록 및 편집 모드 전환 가능 */}
      {isAdmin && (
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickLayoutImage}>
            <Text style={styles.btnText}>
              {imageUri ? '도면 이미지 변경' : '+ 도면 이미지 등록'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              { backgroundColor: isEditMode ? '#e84118' : '#2f3640' },
            ]}
            onPress={() => setIsEditMode(!isEditMode)}
          >
            <Text style={styles.btnText}>
              {isEditMode ? '점검 모드로 전환' : '편집 모드로 전환'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {imageUri ? (
        <View
          style={styles.mapWrapper}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) {
              setCanvasSize({ width, height });
            }
          }}
        >
          <Pressable style={styles.mapTouchable} onPress={handleMapPress}>
            <Image
              source={{ uri: imageUri }}
              style={styles.mapImage}
              resizeMode="stretch"
            />
          </Pressable>

          {zones.map((zone, idx) => (
            <TouchableOpacity
              key={zone.id}
              style={[
                styles.pinMarker,
                {
                  left: `${zone.xPercent}%`,
                  top: `${zone.yPercent}%`,
                  backgroundColor: getPinColor(zone),
                },
              ]}
              onPress={() => handlePinPress(zone)}
            >
              <Text style={styles.pinText}>{idx + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>등록된 공장 도면이 없습니다</Text>
          <Text style={styles.emptyDesc}>
            {isAdmin
              ? '상단에서 도면 이미지를 등록해주세요.'
              : '관리자가 도면을 등록한 뒤 점검을 진행할 수 있습니다.'}
          </Text>
        </View>
      )}

      <View style={styles.zoneListBox}>
        <Text style={styles.sectionTitle}>등록된 점검 구간 ({zones.length}곳)</Text>
        {zones.length === 0 ? (
          <Text style={styles.emptyListText}>등록된 점검 구간이 없습니다.</Text>
        ) : (
          zones.map((zone, idx) => {
            const statusLabel =
              zone.status === 'NORMAL'
                ? '정상 완료'
                : zone.status === 'ACTION_REQUIRED'
                ? '미체크/조치필요'
                : '미점검';

            return (
              <TouchableOpacity
                key={zone.id}
                style={styles.zoneItem}
                onPress={() => openChecklist(zone)}
              >
                <View style={styles.zoneRowTop}>
                  <Text style={styles.zoneItemTitle}>
                    #{idx + 1} {zone.name}
                  </Text>
                  <Text style={styles.zoneStatusText}>{statusLabel}</Text>
                </View>
                <Text style={styles.zoneItemSub}>
                  위치: ({zone.xPercent}%, {zone.yPercent}%) · 항목{' '}
                  {(zone.checklist || []).length}개 · 체크리스트 열기 →
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <Modal
        visible={modalVisible && isAdmin}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>새 점검 구간 등록</Text>
            {pendingCoord && (
              <Text style={styles.modalCoord}>
                좌표: X {pendingCoord.xPercent}% / Y {pendingCoord.yPercent}%
              </Text>
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="예: 1호 유압프레스, A라인 모터"
              placeholderTextColor="#a4b0be"
              value={zoneNameInput}
              onChangeText={setZoneNameInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmAddZone}
              >
                <Text style={styles.btnText}>핀 추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f6fa', flexGrow: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2f3640', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#718093', marginBottom: 12 },
  companyHighlight: { fontWeight: 'bold', color: '#3742fa' },
  roleHighlight: { fontWeight: 'bold', color: '#2f3640' },
  noticeBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  noticeText: { fontSize: 12, color: '#856404', lineHeight: 18 },
  toolbar: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  uploadBtn: {
    flex: 1,
    backgroundColor: '#3742fa',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  mapWrapper: {
    width: '100%',
    height: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcdde1',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 18,
  },
  mapTouchable: { width: '100%', height: '100%' },
  mapImage: { width: '100%', height: '100%' },
  pinMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -14,
    marginTop: -14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  pinText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  emptyBox: {
    height: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#a4b0be',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    padding: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#2f3640', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#718093', textAlign: 'center' },
  zoneListBox: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcdde1',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2f3640', marginBottom: 10 },
  emptyListText: { fontSize: 13, color: '#718093' },
  zoneItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  zoneRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneItemTitle: { fontSize: 15, fontWeight: 'bold', color: '#2f3640' },
  zoneStatusText: { fontSize: 12, fontWeight: 'bold', color: '#3742fa' },
  zoneItemSub: { fontSize: 12, color: '#718093', marginTop: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2f3640', marginBottom: 6 },
  modalCoord: { fontSize: 12, color: '#718093', marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    color: '#2f3640',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f2f6',
  },
  cancelBtnText: { color: '#2f3640', fontWeight: '600' },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3742fa',
  },
});