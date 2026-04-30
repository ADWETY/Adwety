import { env } from '../config/env';
import { getStoredSession } from './storage';

async function apiRequest(path, options = {}) {
  const session = getStoredSession();
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export function getJson(path) {
  return apiRequest(path, { method: 'GET' });
}

export function postJson(path, body) {
  return apiRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function putJson(path, body) {
  return apiRequest(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function patchJson(path, body) {
  return apiRequest(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function deleteJson(path) {
  return apiRequest(path, { method: 'DELETE' });
}

export function postMultipart(path, formData) {
  return apiRequest(path, {
    method: 'POST',
    body: formData,
  });
}
