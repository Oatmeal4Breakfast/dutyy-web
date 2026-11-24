import { useState, type SubmitEvent } from 'react';
import { createAPIKey, type TTL } from '../api/api';
import { ApiError } from '../api/client';

type ApiKeyIssuePanelProps = {
  onIssued: () => void;
};

function getIssueError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Unable to issue API key';
  if (error.status === 409) return 'An active API key already uses that name.';

  const detail = error.getDetail();
  return detail ? String(detail) : error.message;
}

export default function ApiKeyIssuePanel({ onIssued }: ApiKeyIssuePanelProps) {
  const [keyName, setKeyName] = useState<string>('');
  const [ttl, setTtl] = useState<TTL>('30d');
  const [issuing, setIssuing] = useState<boolean>(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function handleIssue(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const normalizedName = keyName.trim();

    setIssueError(null);

    if (!normalizedName) {
      setIssueError('Key name is required');
      return;
    }

    setIssuing(true);

    try {
      const result = await createAPIKey({ key_name: normalizedName, ttl });
      setIssuedKey(result['api-key']);
      setKeyName('');
      setCopyMessage(null);
      onIssued();
    } catch (error) {
      setIssueError(getIssueError(error));
    } finally {
      setIssuing(false);
    }
  }

  async function handleCopy(): Promise<void> {
    if (!issuedKey) return;

    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(issuedKey);
      setCopyMessage('API key copied.');
    } catch {
      setCopyMessage('Could not copy automatically. Select and copy the key manually.');
    }
  }

  return (
    <section className="api-key-issue-panel" aria-labelledby="issue-api-key-heading">
      <div>
        <p className="api-keys-page__section-kicker">New credential</p>
        <h2 id="issue-api-key-heading">Issue an API key</h2>
        <p>The secret is shown once. Store it somewhere secure before continuing.</p>
      </div>

      <form aria-busy={issuing} onSubmit={handleIssue}>
        <label htmlFor="api-key-name">Key name</label>
        <input
          id="api-key-name"
          value={keyName}
          onChange={(event) => setKeyName(event.target.value)}
          placeholder="Laptop CLI"
          autoComplete="off"
          disabled={issuing || Boolean(issuedKey)}
          required
        />

        <label htmlFor="api-key-expiry">Expires after</label>
        <select
          id="api-key-expiry"
          value={ttl}
          onChange={(event) => setTtl(event.target.value as TTL)}
          disabled={issuing || Boolean(issuedKey)}
        >
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
          <option value="90d">90 days</option>
          <option value="1y">1 year</option>
        </select>

        {issueError && <p role="alert">{issueError}</p>}

        <button type="submit" disabled={issuing || Boolean(issuedKey) || !keyName.trim()}>
          {issuing ? 'Issuing key...' : 'Issue key'}
        </button>
      </form>

      {issuedKey && (
        <section className="issued-api-key" aria-labelledby="issued-api-key-heading">
          <p className="issued-api-key__warning">Copy this key now—it will not be shown again.</p>
          <h3 id="issued-api-key-heading">Your new API key</h3>
          <label htmlFor="issued-api-key-value">API key</label>
          <input
            id="issued-api-key-value"
            value={issuedKey}
            readOnly
            autoComplete="off"
            spellCheck={false}
            onFocus={(event) => event.currentTarget.select()}
          />
          <div className="issued-api-key__actions">
            <button type="button" onClick={() => void handleCopy()}>
              Copy key
            </button>
            <button
              type="button"
              onClick={() => {
                setIssuedKey(null);
                setCopyMessage(null);
              }}
            >
              I saved this key
            </button>
          </div>
          {copyMessage && <p role="status">{copyMessage}</p>}
        </section>
      )}
    </section>
  );
}
