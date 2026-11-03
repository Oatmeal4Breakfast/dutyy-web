import { apiRequest } from './client';

export type APIKeyStatus = 'active' | 'inactive';

export type TTL = '7d' | '30d' | '90d' | '1y';

export type NewKeyRequest = {
  key_name: string;
  ttl: TTL;
};

export type APIKeyResponse = {
  id: string;
  name: string;
  status: APIKeyStatus;
  created_date: string;
  last_used: string | null;
  expires_at: string | null;
};

export type APIKey = {
  'api-key': string;
};

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
