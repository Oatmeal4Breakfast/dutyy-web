import type { APIKeyResponse } from '../api/api';

type DisplayStatus = 'Active' | 'Expired' | 'Revoked';

type ApiKeyHistoryProps = {
  keys: APIKeyResponse[];
  loading: boolean;
  refreshing: boolean;
  loadError: string | null;
  refreshError: string | null;
  revokeError: string | null;
  revokingIds: Set<string>;
  onRetry: () => void;
  onRevoke: (key: APIKeyResponse) => void;
};

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string | null): string {
  if (!value) return 'Never';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : DATE_FORMATTER.format(date);
}

function getDisplayStatus(key: APIKeyResponse): DisplayStatus {
  if (key.status === 'inactive') return 'Revoked';
  if (key.expires_at && new Date(key.expires_at).getTime() <= Date.now()) return 'Expired';
  return 'Active';
}

export default function ApiKeyHistory({
  keys,
  loading,
  refreshing,
  loadError,
  refreshError,
  revokeError,
  revokingIds,
  onRetry,
  onRevoke,
}: ApiKeyHistoryProps) {
  function handleRevoke(key: APIKeyResponse): void {
    const confirmed = window.confirm(
      `Revoke "${key.name}"? This key will stop working immediately and cannot be restored.`,
    );
    if (confirmed) onRevoke(key);
  }

  return (
    <section className="api-key-history" aria-labelledby="api-key-history-heading">
      <div className="api-key-history__heading">
        <div>
          <p className="api-keys-page__section-kicker">Credential history</p>
          <h2 id="api-key-history-heading">Your API keys</h2>
        </div>
        {!loading && !loadError && <p>{keys.length} total</p>}
      </div>

      {loading && <p role="status">Loading API keys...</p>}

      {!loading && loadError && (
        <div className="api-key-history__error">
          <p role="alert">{loadError}</p>
          <button type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      {!loading && !refreshing && !loadError && keys.length === 0 && (
        <p className="api-key-history__empty">No API keys have been issued yet.</p>
      )}

      {!loading && !loadError && keys.length > 0 && (
        <ul className="api-key-list">
          {keys.map((key) => {
            const displayStatus = getDisplayStatus(key);
            const isRevoking = revokingIds.has(key.id);

            return (
              <li key={key.id}>
                <div className="api-key-list__identity">
                  <h3>{key.name}</h3>
                  <span className={`api-key-status api-key-status--${displayStatus.toLowerCase()}`}>
                    {displayStatus}
                  </span>
                </div>
                <dl>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(key.created_date)}</dd>
                  </div>
                  <div>
                    <dt>Last used</dt>
                    <dd>{formatDate(key.last_used)}</dd>
                  </div>
                  <div>
                    <dt>Expires</dt>
                    <dd>{key.expires_at ? formatDate(key.expires_at) : 'No expiration'}</dd>
                  </div>
                </dl>
                {displayStatus === 'Active' && (
                  <button
                    type="button"
                    className="api-key-list__revoke"
                    onClick={() => handleRevoke(key)}
                    disabled={isRevoking}
                  >
                    {isRevoking ? 'Revoking...' : `Revoke ${key.name}`}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {refreshing && <p role="status">Refreshing API key history...</p>}
      {refreshError && <p role="alert">{refreshError}</p>}
      {revokeError && <p role="alert">{revokeError}</p>}
    </section>
  );
}
