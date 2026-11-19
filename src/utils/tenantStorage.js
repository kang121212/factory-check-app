import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_COMPANY_KEY = '@factory_platform_current_company_v1';
const CURRENT_SESSION_KEY = '@factory_platform_current_session_v1';
const DEFAULT_COMPANY_CODE = 'DEFAULT_CO';

export const normalizeCompanyCode = (code) => {
  const cleaned = String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
  return cleaned || DEFAULT_COMPANY_CODE;
};

export const normalizeRole = (role) => {
  return role === 'ADMIN' ? 'ADMIN' : 'WORKER';
};

export const getRawStorage = async (key) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await AsyncStorage.getItem(key);
};

export const setRawStorage = async (key, value) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

export const removeRawStorage = async (key) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
};

export const getJsonStorage = async (key, fallback = null) => {
  try {
    const raw = await getRawStorage(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('JSON 읽기 실패:', key, e);
    return fallback;
  }
};

export const setJsonStorage = async (key, value) => {
  try {
    await setRawStorage(key, JSON.stringify(value));
  } catch (e) {
    console.error('JSON 쓰기 실패:', key, e);
  }
};

// 현재 선택된 회사 코드 조회
export const getCurrentCompanyCode = async () => {
  const saved = await getRawStorage(CURRENT_COMPANY_KEY);
  return normalizeCompanyCode(saved);
};

// 현재 회사 코드 저장
export const setCurrentCompanyCode = async (companyCode) => {
  const normalized = normalizeCompanyCode(companyCode);
  await setRawStorage(CURRENT_COMPANY_KEY, normalized);
  return normalized;
};

// 로그인 세션(회사 코드, 아이디, 권한) 저장 및 조회
export const setCurrentSession = async ({ companyCode, userId = '', role = 'WORKER' }) => {
  const normalizedCode = await setCurrentCompanyCode(companyCode);
  const normalizedRole = normalizeRole(role);
  const session = {
    companyCode: normalizedCode,
    userId: String(userId || '').trim(),
    role: normalizedRole,
  };
  await setJsonStorage(CURRENT_SESSION_KEY, session);
  return session;
};

export const getCurrentSession = async () => {
  const saved = await getJsonStorage(CURRENT_SESSION_KEY, null);
  const companyCode = saved?.companyCode
    ? normalizeCompanyCode(saved.companyCode)
    : await getCurrentCompanyCode();
  return {
    companyCode,
    userId: saved?.userId || '',
    role: normalizeRole(saved?.role),
  };
};

export const clearCurrentSession = async () => {
  await removeRawStorage(CURRENT_SESSION_KEY);
};

// 회사별 스토리지 키 생성
export const getCompanyLayoutKey = (companyCode) => {
  const code = normalizeCompanyCode(companyCode);
  return `@factory_platform_${code}_layout_v1`;
};

export const getCompanyLogsKey = (companyCode) => {
  const code = normalizeCompanyCode(companyCode);
  return `@factory_platform_${code}_logs_v1`;
};