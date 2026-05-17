import React from 'react';

interface GitHubSettingsFormProps {
  gitHubAppId: string; setGitHubAppId: (val: string) => void;
  gitHubPrivateKey: string; setGitHubPrivateKey: (val: string) => void;
  gitHubWebhookSecret: string; setGitHubWebhookSecret: (val: string) => void;
  gitHubClientId: string; setGitHubClientId: (val: string) => void;
  gitHubClientSecret: string; setGitHubClientSecret: (val: string) => void;
  showGitHubPrivateKey: boolean; setShowGitHubPrivateKey: (val: boolean) => void;
  showGitHubWebhookSecret: boolean; setShowGitHubWebhookSecret: (val: boolean) => void;
  showGitHubClientSecret: boolean; setShowGitHubClientSecret: (val: boolean) => void;
  testingGitHub: boolean;
  testGitHubResult: 'SUCCESS' | 'FAILED' | null;
  testGitHubErrorMessage: string;
  savingGitHub: boolean;
  saveGitHubStatus: string | null;
  handleTestGitHubConnection: () => void;
  handleSaveGitHub: (e: React.FormEvent) => void;
}

// ── Shared primitives ──────────────────────────────────────────
function SectionCard({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button" onClick={onToggle}
      style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center',
      }}
    >
      {show ? (
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}

function PasswordInput({ value, onChange, show, onToggle, placeholder }: {
  value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="form-input"
        style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 36 }}
        placeholder={placeholder}
      />
      <EyeToggle show={show} onToggle={onToggle} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export function GitHubSettingsForm({
  gitHubAppId, setGitHubAppId,
  gitHubPrivateKey, setGitHubPrivateKey,
  gitHubWebhookSecret, setGitHubWebhookSecret,
  gitHubClientId, setGitHubClientId,
  gitHubClientSecret, setGitHubClientSecret,
  showGitHubPrivateKey, setShowGitHubPrivateKey,
  showGitHubWebhookSecret, setShowGitHubWebhookSecret,
  showGitHubClientSecret, setShowGitHubClientSecret,
  testingGitHub, testGitHubResult, testGitHubErrorMessage,
  savingGitHub, saveGitHubStatus,
  handleTestGitHubConnection, handleSaveGitHub,
}: GitHubSettingsFormProps) {
  return (
    <form onSubmit={handleSaveGitHub} className="settings-form-grid" style={{
      display: 'grid',
      gridTemplateColumns: '1fr 280px',
      gap: 20,
      alignItems: 'flex-start',
    }}>
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Core app credentials */}
        <SectionCard
          title="GitHub App Credentials"
          description="Details from your registered GitHub App. Sensitive values are encrypted before storage."
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FieldGroup label="App ID">
              <input
                type="text" value={gitHubAppId}
                onChange={e => setGitHubAppId(e.target.value)}
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
                placeholder="e.g. 1049281"
              />
            </FieldGroup>
            <FieldGroup label="Client ID">
              <input
                type="text" value={gitHubClientId}
                onChange={e => setGitHubClientId(e.target.value)}
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
                placeholder="Iv1.d8f763ab21e3c88a"
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Webhook Secret">
            <PasswordInput
              value={gitHubWebhookSecret} onChange={setGitHubWebhookSecret}
              show={showGitHubWebhookSecret} onToggle={() => setShowGitHubWebhookSecret(!showGitHubWebhookSecret)}
              placeholder="Enter webhook secret token…"
            />
          </FieldGroup>

          <FieldGroup label="OAuth Client Secret">
            <PasswordInput
              value={gitHubClientSecret} onChange={setGitHubClientSecret}
              show={showGitHubClientSecret} onToggle={() => setShowGitHubClientSecret(!showGitHubClientSecret)}
              placeholder="Enter OAuth client secret…"
            />
          </FieldGroup>
        </SectionCard>

        {/* RSA private key */}
        <SectionCard
          title="App Private Key"
          description="Paste the full content of your .pem file issued by GitHub for app authorization."
        >
          <textarea
            value={gitHubPrivateKey}
            onChange={e => setGitHubPrivateKey(e.target.value)}
            rows={8}
            className="form-input"
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }}
            placeholder={'-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'}
          />

          {/* Test connection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={handleTestGitHubConnection}
              disabled={testingGitHub}
              className="btn btn-secondary"
            >
              {testingGitHub ? (
                <><div className="spinner" style={{ width: 13, height: 13 }} /> Verifying…</>
              ) : 'Test GitHub Connection'}
            </button>

            {testGitHubResult === 'SUCCESS' && (
              <span style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                GitHub App authenticated
              </span>
            )}
            {testGitHubResult === 'FAILED' && (
              <span style={{ fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', display: 'inline-block', flexShrink: 0 }} />
                {testGitHubErrorMessage}
              </span>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Setup info */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>GitHub App Setup</div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            When creating your GitHub App, ensure you enable these permissions:
          </p>
          <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Pull Requests: Read & Write',
              'Repository Metadata: Read-only',
              'Webhook: Push & PR events',
            ].map(item => (
              <li key={item} style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="submit"
            disabled={savingGitHub}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 13, fontWeight: 600 }}
          >
            {savingGitHub ? (
              <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} /> Saving…</>
            ) : 'Save GitHub Credentials'}
          </button>
          {saveGitHubStatus && (
            <div style={{
              padding: '9px 12px', textAlign: 'center', fontSize: 12, fontWeight: 500,
              background: 'var(--success-dim)', color: '#34d399',
              border: '1px solid rgba(16,185,129,0.2)', borderRadius: 7,
            }}>
              {saveGitHubStatus}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
