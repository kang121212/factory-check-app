import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {
  getCurrentSession,
  setCurrentSession,
  normalizeCompanyCode,
  normalizeRole,
  getJsonStorage,
  setJsonStorage,
} from '../utils/tenantStorage';

const USERS_STORAGE_KEY = '@factory_platform_users_v1';

export default function LoginScreen({ navigation }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [companyCode, setCompanyCode] = useState('COMP_A');
  const [role, setRole] = useState('WORKER'); // 'ADMIN' | 'WORKER'
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showAlert = (title, message, onOk) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, message, [{ text: '확인', onPress: onOk }]);
    }
  };

  useEffect(() => {
    const loadSavedSession = async () => {
      const saved = await getCurrentSession();
      if (saved?.companyCode && saved.companyCode !== 'DEFAULT_CO') {
        setCompanyCode(saved.companyCode);
      }
      if (saved?.role) {
        setRole(normalizeRole(saved.role));
      }
    };
    loadSavedSession();
  }, []);

  const moveToMain = async (rawCompanyCode, selectedRole, currentUserId = '') => {
    const session = await setCurrentSession({
      companyCode: rawCompanyCode,
      userId: currentUserId,
      role: selectedRole,
    });
    navigation.replace('Main', {
      companyCode: session.companyCode,
      role: session.role,
      userId: session.userId,
    });
  };

  const handleLogin = async () => {
    const normalizedCode = normalizeCompanyCode(companyCode);
    const trimmedId = userId.trim();

    if (!normalizedCode || normalizedCode === 'DEFAULT_CO') {
      showAlert('입력 확인', '회사 코드(예: COMP_A)를 입력해주세요.');
      return;
    }

    const users = (await getJsonStorage(USERS_STORAGE_KEY, [])) || [];

    if (trimmedId || password) {
      if (!trimmedId || !password) {
        showAlert('입력 확인', '아이디와 비밀번호를 모두 입력해주세요.');
        return;
      }

      const matchedUser = users.find(
        (u) => u.userId === trimmedId && u.password === password
      );

      if (!matchedUser) {
        showAlert(
          '로그인 실패',
          '일치하는 계정이 없습니다. 회원가입 탭에서 계정을 먼저 등록하거나 아이디/비밀번호를 확인해주세요.'
        );
        return;
      }

      const targetCode = normalizeCompanyCode(companyCode || matchedUser.companyCode);
      const targetRole = normalizeRole(role || matchedUser.role);
      await moveToMain(targetCode, targetRole, trimmedId);
      return;
    }

    await moveToMain(normalizedCode, role, '');
  };

  const handleRegister = async () => {
    const normalizedCode = normalizeCompanyCode(companyCode);
    const trimmedId = userId.trim();

    if (!normalizedCode || normalizedCode === 'DEFAULT_CO') {
      showAlert('입력 확인', '소속 회사 코드(예: COMP_A)를 입력해주세요.');
      return;
    }
    if (!trimmedId) {
      showAlert('입력 확인', '사용할 아이디를 입력해주세요.');
      return;
    }
    if (password.length < 4) {
      showAlert('입력 확인', '비밀번호는 4자 이상 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('입력 확인', '비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const users = (await getJsonStorage(USERS_STORAGE_KEY, [])) || [];
    const duplicated = users.some((u) => u.userId === trimmedId);
    if (duplicated) {
      showAlert('중복 아이디', `'${trimmedId}' 아이디는 이미 사용 중입니다.`);
      return;
    }

    const nextUsers = [
      ...users,
      {
        id: `user_${Date.now()}`,
        userId: trimmedId,
        password,
        companyCode: normalizedCode,
        role: normalizeRole(role),
        createdAt: new Date().toISOString(),
      },
    ];

    await setJsonStorage(USERS_STORAGE_KEY, nextUsers);

    const roleText = role === 'ADMIN' ? '관리자' : '현장 작업자';
    showAlert(
      '회원가입 완료',
      `[${normalizedCode}] ${roleText} '${trimmedId}' 계정이 등록되었습니다.`,
      () => moveToMain(normalizedCode, role, trimmedId)
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.badge}>MULTI-TENANT SMART INSPECTION</Text>
          <Text style={styles.title}>스마트 현장 점검 플랫폼</Text>
          <Text style={styles.subtitle}>
            회사 코드와 권한을 선택해 접속하세요.
          </Text>

          {/* 로그인 / 회원가입 탭 */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, !isRegisterMode && styles.tabBtnActive]}
              onPress={() => setIsRegisterMode(false)}
            >
              <Text style={[styles.tabText, !isRegisterMode && styles.tabTextActive]}>
                로그인
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, isRegisterMode && styles.tabBtnActive]}
              onPress={() => setIsRegisterMode(true)}
            >
              <Text style={[styles.tabText, isRegisterMode && styles.tabTextActive]}>
                회원가입
              </Text>
            </TouchableOpacity>
          </View>

          {/* 회사 코드 입력 */}
          <Text style={styles.label}>회사 코드 (companyCode) *</Text>
          <TextInput
            style={styles.input}
            placeholder="예: COMP_A, POSCO_01"
            placeholderTextColor="#a4b0be"
            value={companyCode}
            onChangeText={(text) => setCompanyCode(text.toUpperCase())}
            autoCapitalize="characters"
          />

          {/* 권한 선택 */}
          <Text style={styles.label}>접속 권한 선택 *</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleCard, role === 'WORKER' && styles.roleCardActive]}
              onPress={() => setRole('WORKER')}
            >
              <Text
                style={[styles.roleTitle, role === 'WORKER' && styles.roleTitleActive]}
              >
                현장 작업자
              </Text>
              <Text
                style={[styles.roleDesc, role === 'WORKER' && styles.roleDescActive]}
              >
                점검 수행만 가능 (수정 불가)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, role === 'ADMIN' && styles.roleCardAdminActive]}
              onPress={() => setRole('ADMIN')}
            >
              <Text
                style={[styles.roleTitle, role === 'ADMIN' && styles.roleTitleActive]}
              >
                관리자
              </Text>
              <Text
                style={[styles.roleDesc, role === 'ADMIN' && styles.roleDescActive]}
              >
                도면·핀·항목 편집 가능
              </Text>
            </TouchableOpacity>
          </View>

          {/* 아이디 입력 */}
          <Text style={styles.label}>
            아이디 {isRegisterMode ? '*' : '(선택 — 빠른 입장 시 생략 가능)'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="작업자/관리자 아이디 입력"
            placeholderTextColor="#a4b0be"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
          />

          {/* 비밀번호 입력 */}
          <Text style={styles.label}>
            비밀번호 {isRegisterMode ? '*' : '(선택)'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호 입력"
            placeholderTextColor="#a4b0be"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {isRegisterMode && (
            <>
              <Text style={styles.label}>비밀번호 확인 *</Text>
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 다시 입력하세요"
                placeholderTextColor="#a4b0be"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </>
          )}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={isRegisterMode ? handleRegister : handleLogin}
          >
            <Text style={styles.submitBtnText}>
              {isRegisterMode ? '회원가입 후 입장' : '로그인'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f6fa' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: '#dcdde1',
    elevation: 2,
  },
  badge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3742fa',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2f3640', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#718093', lineHeight: 19, marginBottom: 18 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f2f6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 18,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#2f3640' },
  tabText: { fontSize: 14, fontWeight: 'bold', color: '#57606f' },
  tabTextActive: { color: '#ffffff' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#2f3640', marginBottom: 6 },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2f3640',
    marginBottom: 14,
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcdde1',
    backgroundColor: '#f8f9fa',
  },
  roleCardActive: {
    backgroundColor: '#2f3640',
    borderColor: '#2f3640',
  },
  roleCardAdminActive: {
    backgroundColor: '#3742fa',
    borderColor: '#3742fa',
  },
  roleTitle: { fontSize: 14, fontWeight: 'bold', color: '#2f3640', marginBottom: 3 },
  roleTitleActive: { color: '#ffffff' },
  roleDesc: { fontSize: 11, color: '#718093' },
  roleDescActive: { color: '#f1f2f6' },
  submitBtn: {
    backgroundColor: '#3742fa',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});