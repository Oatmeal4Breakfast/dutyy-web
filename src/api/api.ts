import { apiRequest } from './client';
import type { APIKeyResponse, NewKeyRequest, APIKey } from './types';

export function getApiKeys(): Promise<APIKeyResponse[]> {
  return apiRequest('/api-keys', {
    method: 'GET',
  });
}

export function createAPIKey(payload: NewKeyRequest): Promise<APIKey> {
  const hasValue = [payload.key_name, payload.ttl].every(
    (p) => p !== null && p !== undefined && p.trim() !== '',
  );
  if (!hasValue) {
    throw new Error('invalid request format');
  }
  return apiRequest('/api-keys', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteAPIKey(keyId: string): Promise<void> {
  return apiRequest(`/api-keys/${encodeURIComponent(keyId)}`, {
    method: 'DELETE',
  });
}
