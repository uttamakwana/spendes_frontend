import { AxiosRequestConfig } from 'axios';

import { api } from './client';

/**
 * Typed thin wrappers over the axios instance. The response interceptor already
 * unwraps the success envelope, so these resolve to the payload directly — the
 * casts bridge axios's static `AxiosResponse` type to that runtime reality.
 */
export function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const config: AxiosRequestConfig | undefined = params ? { params } : undefined;
  return api.get(url, config) as unknown as Promise<T>;
}
export function post<T>(url: string, body?: unknown): Promise<T> {
  return api.post(url, body) as unknown as Promise<T>;
}
export function patch<T>(url: string, body?: unknown): Promise<T> {
  return api.patch(url, body) as unknown as Promise<T>;
}
export function del<T>(url: string): Promise<T> {
  return api.delete(url) as unknown as Promise<T>;
}
