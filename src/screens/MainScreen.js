import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getCurrentSession,
  getCompanyLayoutKey,
  getJsonStorage,
} from '../utils/tenantStorage';

const FALLBACK_ZONES = [
  { id: 'fallback_1', name: '1호 모터 설비', status: null, checklist: [] },
  { id: 'fallback_2', name: '메인 펌프 설비', status: null, checklist: [] },
  { id: 'fallback_3', name: 'A라인 컨베이어', status: 'ACTION_REQUIRED', checklist: [] },
  { id: 'fallback_4', name: '유압 프레스 설비', status: null, checklist: [] },
];

export default function MainScreen({ navigation, route }) {
  const [companyCode, setCompanyCode] = useState('DEFAULT_CO');
  const [role, setRole] = useState('WORKER');
  const [zones, setZones] = useState([]);

  const isAdmin = role === 'ADMIN';

  const loadCompanyAndZones = useCallback(async () => {
    try {
      const session = await getCurrentSession();
      const activeCode = route?.params?.companyCode || session.companyCode;
      const activeRole = route?.params?.role || session.role;

      setCompanyCode(activeCode);
      setRole(activeRole);

      const layoutKey = getCompanyLayoutKey(activeCode);
      const savedLayout = await getJsonStorage(layoutKey, null);
      if (savedLayout && Array.isArray(savedLayout.zones)) {
        setZones(savedLayout.zones);
      } else {
        setZones([]);
      }
    } catch (e) {
      console.error('메인 데이터 불러오기 실패:', e);
    }
  }, [route?.params?.companyCode, route?.params?.role]);

  useFocusEffect(
    useCallback(() => {
      loadCompanyAndZones();
    }, [loadCompanyAndZones])
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleLogout = () => {
    const executeLogout = () => {
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

  const getStatusLabel = (status) => {
    if (status === 'NORMAL') return '점검 완료 (정상)';
    if (status === 'ACTION_REQUIRED') return '점검 필요 항목 있음';
    return '상태 양호 - 점검 대기중';
  };

  const displayZones = zones.length > 0 ? zones : FALLBACK_ZONES;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.companyBanner}>
        <View>
          <Text style={styles.companyBannerLabel}>소속 회사</Text>
          <Text style={styles.companyBannerCode}>{companyCode}</Text>
        </View>
        <View style={[styles.roleBadge, isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeWorker]}>
          <Text style={styles.roleBadgeText}>
            {isAdmin ? '관리자 (편집 가능)' : '현장 작업자 (점검 전용)'}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>스마트 현장 공장 레이아웃</Text>
      <Text style={styles.subtitle}>점검할 구역 또는 설비를 선택하세요.</Text>

      <TouchableOpacity
        style={styles.layoutManageBtn}
        onPress={() => navigation.navigate('Layout', { companyCode, role })}
      >
        <Text style={styles.layoutManageBtnText}>
          {isAdmin ? '공장 레이아웃 등록 및 구간 핀 설정' : '공장 레이아웃 보기 (점검용)'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        {zones.length > 0
          ? `등록된 점검 구간 (${zones.length}곳)`
          : '기본 설비 구역 (도면에서 핀 등록 시 자동 전환)'}
      </Text>

      <View style={styles.zoneContainer}>
        {displayZones.map((zone) => (
          <TouchableOpacity
            key={zone.id}
            style={styles.zoneCard}
            onPress={() =>
              navigation.navigate('Checklist', {
                zoneId: zone.id.startsWith('fallback_') ? null : zone.id,
                zoneName: zone.name,
                checklist: zone.checklist || [],
                memo: zone.memo || '',
                companyCode,
                role,
                onSaved: loadCompanyAndZones,
              })
            }
          >
            <Text style={styles.zoneTitle}>{zone.name}</Text>
            <Text
              style={[
                styles.zoneDesc,
                zone.status === 'NORMAL' && styles.zoneDescNormal,
              ]}
            >
              {getStatusLabel(zone.status)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f6fa', flexGrow: 1 },
  companyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2f3640',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  companyBannerLabel: { color: '#dcdde1', fontSize: 12, fontWeight: '600' },
  companyBannerCode: { color: '#00d2d3', fontSize: 16, fontWeight: 'bold' },
  roleBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  roleBadgeAdmin: { backgroundColor: '#3742fa' },
  roleBadgeWorker: { backgroundColor: '#57606f' },
  roleBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2f3640', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#718093', marginBottom: 18 },
  layoutManageBtn: {
    backgroundColor: '#3742fa',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 18,
  },
  layoutManageBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#57606f', marginBottom: 10 },
  zoneContainer: { gap: 15 },
  zoneCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcdde1',
    elevation: 2,
  },
  zoneTitle: { fontSize: 18, fontWeight: 'bold', color: '#2f3640', marginBottom: 5 },
  zoneDesc: { fontSize: 14, color: '#e84118', fontWeight: '600' },
  zoneDescNormal: { color: '#27ae60' },
  logoutBtn: { marginRight: 8, paddingHorizontal: 10, paddingVertical: 5 },
  logoutText: { color: '#e84118', fontWeight: 'bold', fontSize: 15 },
});