import React from 'react';

interface GitHubSettingsFormProps {
  gitHubAppId: string;
  setGitHubAppId: (val: string) => void;
  gitHubPrivateKey: string;
  setGitHubPrivateKey: (val: string) => void;
  gitHubWebhookSecret: string;
  setGitHubWebhookSecret: (val: string) => void;
  gitHubClientId: string;
  setGitHubClientId: (val: string) => void;
  gitHubClientSecret: string;
  setGitHubClientSecret: (val: string) => void;
  showGitHubPrivateKey: boolean;
  setShowGitHubPrivateKey: (val: boolean) => void;
  showGitHubWebhookSecret: boolean;
  setShowGitHubWebhookSecret: (val: boolean) => void;
  showGitHubClientSecret: boolean;
  setShowGitHubClientSecret: (val: boolean) => void;
  testingGitHub: boolean;
  testGitHubResult: 'SUCCESS' | 'FAILED' | null;
  testGitHubErrorMessage: string;
  savingGitHub: boolean;
  saveGitHubStatus: string | null;
  handleTestGitHubConnection: () => void;
  handleSaveGitHub: (e: React.FormEvent) => void;
}

export function GitHubSettingsForm({
  gitHubAppId,
  setGitHubAppId,
  gitHubPrivateKey,
  setGitHubPrivateKey,
  gitHubWebhookSecret,
  setGitHubWebhookSecret,
  gitHubClientId,
  setGitHubClientId,
  gitHubClientSecret,
  setGitHubClientSecret,
  showGitHubWebhookSecret,
  setShowGitHubWebhookSecret,
  showGitHubClientSecret,
  setShowGitHubClientSecret,
  testingGitHub,
  testGitHubResult,
  testGitHubErrorMessage,
  savingGitHub,
  saveGitHubStatus,
  handleTestGitHubConnection,
  handleSaveGitHub,
}: GitHubSettingsFormProps) {
  return (
    <form onSubmit={handleSaveGitHub} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Core Credentials */}
        <div className="glass-card p-6 flex flex-col gap-5 border border-white/5 bg-slate-900/20 backdrop-blur-xl rounded-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              GitHub App Credentials
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Store details of your registered GitHub Integration App. Sensitive fields are encrypted using your workspace key prior to DB persistence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* App ID */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">GitHub App ID</label>
              <input
                type="text"
                value={gitHubAppId}
                onChange={(e) => setGitHubAppId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0c16] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all font-mono"
                placeholder="e.g. 1049281"
              />
            </div>

            {/* Client ID */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">GitHub Client ID</label>
              <input
                type="text"
                value={gitHubClientId}
                onChange={(e) => setGitHubClientId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0c16] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all font-mono"
                placeholder="Iv1.d8f763ab21e3c88a"
              />
            </div>
          </div>

          {/* Webhook Secret */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Webhook Secret Token</label>
            <div className="relative">
              <input
                type={showGitHubWebhookSecret ? 'text' : 'password'}
                value={gitHubWebhookSecret}
                onChange={(e) => setGitHubWebhookSecret(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0c16] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all font-mono"
                placeholder="Enter webhook secret verification token..."
              />
              <button
                type="button"
                onClick={() => setShowGitHubWebhookSecret(!showGitHubWebhookSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition"
              >
                {showGitHubWebhookSecret ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Client Secret */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">OAuth Client Secret</label>
            <div className="relative">
              <input
                type={showGitHubClientSecret ? 'text' : 'password'}
                value={gitHubClientSecret}
                onChange={(e) => setGitHubClientSecret(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0c16] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all font-mono"
                placeholder="Enter Client Secret token..."
              />
              <button
                type="button"
                onClick={() => setShowGitHubClientSecret(!showGitHubClientSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition"
              >
                {showGitHubClientSecret ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* RSA Private Key */}
        <div className="glass-card p-6 flex flex-col gap-5 border border-white/5 bg-slate-900/20 backdrop-blur-xl rounded-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              App Private Key (.pem file content)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Paste the multi-line RSA Private Key PEM content issued by GitHub for secure app authorization.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <textarea
              value={gitHubPrivateKey}
              onChange={(e) => setGitHubPrivateKey(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-[#0a0c16] border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all leading-6 font-mono font-medium text-[11px]"
              placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
            />
          </div>

          {/* Handshake Tester */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={handleTestGitHubConnection}
              disabled={testingGitHub}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-slate-600 text-violet-300 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {testingGitHub ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border border-violet-500/20 border-t-violet-500 animate-spin" />
                  Verifying Signature...
                </>
              ) : (
                'Verify Handshake with GitHub App'
              )}
            </button>

            {testGitHubResult === 'SUCCESS' && (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 animate-fade-in font-medium">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Signature authenticated with GitHub!
              </div>
            )}

            {testGitHubResult === 'FAILED' && (
              <div className="text-xs text-rose-400 flex items-center gap-1.5 animate-fade-in font-medium max-w-sm break-words">
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                {testGitHubErrorMessage}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Save Button & Side Info */}
      <div className="flex flex-col gap-6">
        
        <div className="glass-card p-6 flex flex-col gap-4 border border-white/5 bg-slate-900/20 backdrop-blur-xl rounded-xl text-xs leading-5">
          <span className="font-bold text-white flex items-center gap-1">
            💡 Setup Information
          </span>
          <p className="text-slate-400">
            When creating your GitHub App, ensure you enable:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 font-medium font-mono text-[10px]">
            <li>Pull Request: Read & Write</li>
            <li>Repository Metadata: Read-only</li>
            <li>Webhook Push & PR events</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={savingGitHub}
            className="w-full py-3 text-sm font-bold uppercase tracking-wider rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {savingGitHub ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                Encrypting & Storing...
              </>
            ) : (
              'Save GitHub Credentials'
            )}
          </button>

          {saveGitHubStatus && (
            <div className="p-3 text-center text-xs font-semibold border border-emerald-500/15 bg-emerald-500/10 text-emerald-400 rounded-lg animate-fade-in">
              {saveGitHubStatus}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
