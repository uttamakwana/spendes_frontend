import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolve the API base URL.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL  — full base URL incl. /api/v1 (prod / staging)
 *  2. EXPO_PUBLIC_API_HOST — just host[:port]; we append /api/v1
 *  3. Dev fallback — the Metro host's IP (so a physical device reaches your
 *     dev machine instead of its own localhost), port 3000.
 */
const API_VERSION_PATH = '/api/v1';

function devHost(): string {
  // e.g. "192.168.1.5:8081" → "192.168.1.5"
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.developer?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) return host;
  // Android emulator maps host loopback to 10.0.2.2
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
}

function resolveBaseUrl(): string {
  const full = process.env.EXPO_PUBLIC_API_URL;
  if (full) return full.replace(/\/$/, '');

  const host = process.env.EXPO_PUBLIC_API_HOST ?? `${devHost()}:3000`;
  const withProto = host.startsWith('http') ? host : `http://${host}`;
  return `${withProto.replace(/\/$/, '')}${API_VERSION_PATH}`;
}

export const API_BASE_URL = resolveBaseUrl();
export const REQUEST_TIMEOUT_MS = 20000;
