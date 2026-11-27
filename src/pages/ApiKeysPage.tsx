import ApiKeyHistory from '../components/ApiKeyHistory';
import ApiKeyIssuePanel from '../components/ApiKeyIssuePanel';
import useApiKeyHistory from '../hooks/useApiKeyHistory';
import './ApiKeysPage.css';

type ApiKeysPageProps = {
  userId: string;
};

export default function ApiKeysPage({ userId }: ApiKeysPageProps) {
  const history = useApiKeyHistory(userId);

  return (
    <main className="api-keys-page">
      <header className="api-keys-page__header">
        <p className="page-kicker">Settings</p>
        <h1>API keys</h1>
        <p>
          Issue credentials for the Dutyy CLI and revoke access when a credential is no longer
          needed.
        </p>
      </header>

      <ApiKeyIssuePanel
        onIssued={() => {
          void history.refresh(
            'The API key was issued, but the key history could not be refreshed.',
          );
        }}
      />

      <ApiKeyHistory
        keys={history.keys}
        loading={history.loading}
        refreshing={history.refreshing}
        loadError={history.loadError}
        refreshError={history.refreshError}
        revokeError={history.revokeError}
        revokingIds={history.revokingIds}
        onRetry={() => {
          void history.retry();
        }}
        onRevoke={(key) => {
          void history.revoke(key);
        }}
      />
    </main>
  );
}
