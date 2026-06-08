import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem } from '../ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { AISettingsFormProps } from '../../types';

// ── Shared primitives ────────────────────────────────────────
function SectionCard({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</div>}
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
      {show ? <Eye size={15} /> : <EyeOff size={15} />}
    </button>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button" onClick={onToggle}
      style={{
        width: 36, height: 20, borderRadius: 10, padding: 2,
        background: on ? 'var(--accent)' : 'var(--border-soft)',
        border: 'none', cursor: 'pointer', transition: 'background 0.2s',
        flexShrink: 0, position: 'relative',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transform: on ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform 0.2s',
      }} />
    </button>
  );
}

function ToggleRow({ label, description, on, onToggle }: {
  label: string; description: string; on: boolean; onToggle: () => void;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 14px', background: 'var(--bg-elevated)',
      border: '1px solid var(--border-soft)', borderRadius: 8, gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{description}</div>
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function AISettingsForm({
  data,
  availableProviders,
  onChange,
  testing, testResult, testErrorMessage,
  saving, saveStatus,
  handleTestConnection, handleSave,
}: AISettingsFormProps) {



  return (
    <form onSubmit={handleSave} className="settings-form-grid">
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Connection Credentials */}
        <SectionCard title="Connection Credentials" description="Select an AI Provider and configure credentials.">
          <FieldGroup label="AI Provider">
            <Select value={data.provider} onValueChange={(v) => onChange('provider', v)}>
              <SelectTrigger>
                {data.provider}
              </SelectTrigger>
              <SelectContent>
                {availableProviders?.length > 0 ? (
                  availableProviders.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="OPENROUTER">OPENROUTER</SelectItem>
                    <SelectItem value="OPENAI">OPENAI</SelectItem>
                    <SelectItem value="ANTHROPIC">ANTHROPIC</SelectItem>
                    <SelectItem value="XAI">XAI</SelectItem>
                    <SelectItem value="OLLAMA">OLLAMA</SelectItem>
                    <SelectItem value="BEDROCK">BEDROCK</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </FieldGroup>

          {data.provider === 'OPENROUTER' && (
            <FieldGroup label="OpenRouter API Key">
              <div style={{ position: 'relative' }}>
                <input
                  type={data.showKey ? 'text' : 'password'}
                  value={data.openRouterKey}
                  onChange={e => onChange('openRouterKey', e.target.value)}
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 36 }}
                  placeholder="sk-or-v1-..."
                />
                <EyeToggle show={data.showKey} onToggle={() => onChange('showKey', !data.showKey)} />
              </div>
            </FieldGroup>
          )}

          {data.provider === 'OPENAI' && (
            <FieldGroup label="OpenAI API Key">
              <div style={{ position: 'relative' }}>
                <input type={data.showKey ? 'text' : 'password'} value={data.openaiKey} onChange={e => onChange('openaiKey', e.target.value)} className="form-input" style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 36 }} placeholder="sk-proj-..." />
                <EyeToggle show={data.showKey} onToggle={() => onChange('showKey', !data.showKey)} />
              </div>
            </FieldGroup>
          )}

          {data.provider === 'ANTHROPIC' && (
            <FieldGroup label="Anthropic API Key">
              <div style={{ position: 'relative' }}>
                <input type={data.showKey ? 'text' : 'password'} value={data.anthropicKey} onChange={e => onChange('anthropicKey', e.target.value)} className="form-input" style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 36 }} placeholder="sk-ant-..." />
                <EyeToggle show={data.showKey} onToggle={() => onChange('showKey', !data.showKey)} />
              </div>
            </FieldGroup>
          )}

          {data.provider === 'XAI' && (
            <FieldGroup label="xAI API Key">
              <div style={{ position: 'relative' }}>
                <input type={data.showKey ? 'text' : 'password'} value={data.xaiKey} onChange={e => onChange('xaiKey', e.target.value)} className="form-input" style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 36 }} placeholder="xai-..." />
                <EyeToggle show={data.showKey} onToggle={() => onChange('showKey', !data.showKey)} />
              </div>
            </FieldGroup>
          )}

          {(data.provider === 'OLLAMA' || data.provider === 'OPENAI') && (
            <FieldGroup label={data.provider === 'OLLAMA' ? "Ollama Base URL" : "Custom Base URL (Optional)"}>
              <input type="text" value={data.baseUrl} onChange={e => onChange('baseUrl', e.target.value)} className="form-input" placeholder={data.provider === 'OLLAMA' ? "http://localhost:11434/api/chat" : "https://api.openai.com/v1"} />
            </FieldGroup>
          )}

          {data.provider === 'BEDROCK' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FieldGroup label="AWS Access Key ID">
                <input type="text" value={data.awsAccessKeyId} onChange={e => onChange('awsAccessKeyId', e.target.value)} className="form-input" />
              </FieldGroup>
              <FieldGroup label="AWS Secret Access Key">
                <div style={{ position: 'relative' }}>
                  <input type={data.showKey ? 'text' : 'password'} value={data.awsSecretAccessKey} onChange={e => onChange('awsSecretAccessKey', e.target.value)} className="form-input" style={{ paddingRight: 36 }} />
                  <EyeToggle show={data.showKey} onToggle={() => onChange('showKey', !data.showKey)} />
                </div>
              </FieldGroup>
              <FieldGroup label="AWS Region">
                <input type="text" value={data.awsRegion} onChange={e => onChange('awsRegion', e.target.value)} className="form-input" placeholder="us-east-1" />
              </FieldGroup>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="btn btn-secondary"
            >
              {testing ? (
                <><div className="spinner" style={{ width: 13, height: 13 }} /> Verifying…</>
              ) : 'Test Connection'}
            </button>
            {testResult === 'SUCCESS' && (
              <span style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                Connected successfully
              </span>
            )}
            {testResult === 'FAILED' && (
              <span style={{ fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', display: 'inline-block', flexShrink: 0 }} />
                {testErrorMessage}
              </span>
            )}
          </div>
        </SectionCard>

        {/* System prompt */}
        <SectionCard title="System Prompt" description="Custom instructions that shape how the AI structures its code review output.">
          <textarea
            value={data.systemPrompt}
            onChange={e => onChange('systemPrompt', e.target.value)}
            rows={6}
            className="form-input"
            style={{ resize: 'vertical', lineHeight: 1.6, fontSize: 13 }}
          />
        </SectionCard>

      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Sliders */}
        <SectionCard title="Execution Parameters" description="Define the target model and tune token limits.">
          <FieldGroup label="Model Name">
            <input
              type="text"
              value={data.model || ''}
              onChange={e => onChange('model', e.target.value)}
              className="form-input"
              placeholder="e.g. gpt-4o or meta-llama/llama-3-70b"
            />
          </FieldGroup>
          {/* Temperature */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-label" style={{ margin: 0 }}>Temperature</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#818cf8' }}>
                {data.temperature}
              </span>
            </div>
            <input
              type="range" min="0" max="1" step="0.05"
              value={data.temperature}
              onChange={e => onChange('temperature', parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
              <span>Deterministic</span><span>Creative</span>
            </div>
          </div>

          {/* Max tokens */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-label" style={{ margin: 0 }}>Max Tokens</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#818cf8' }}>
                {data.maxTokens}
              </span>
            </div>
            <input
              type="range" min="256" max="4096" step="128"
              value={data.maxTokens}
              onChange={e => onChange('maxTokens', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
              <span>256</span><span>4096</span>
            </div>
          </div>
        </SectionCard>

        {/* Toggles */}
        <SectionCard title="Guardrails">
          <ToggleRow
            label="Bypass Webhook Signature"
            description="Skip HMAC validation in dev mode"
            on={data.bypassSignature}
            onToggle={() => onChange('bypassSignature', !data.bypassSignature)}
          />
          <ToggleRow
            label="Dual-Model Consensus"
            description="Run two models concurrently to deduplicate findings"
            on={data.isConsensusEnabled}
            onToggle={() => onChange('isConsensusEnabled', !data.isConsensusEnabled)}
          />
        </SectionCard>

        {/* Cost Configuration */}
        <SectionCard title="Cost Configuration" description="Set dynamic costs to accurately track LLM token usage.">
          <ToggleRow
            label="Free API Tier"
            description="Toggle this if your API is free so no costs are calculated."
            on={data.isFreeApi}
            onToggle={() => onChange('isFreeApi', !data.isFreeApi)}
          />
          {!data.isFreeApi && (
            <div className="form-inner-grid" style={{ marginTop: 8 }}>
              <FieldGroup label="Cost per 1M Prompt Tokens ($)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.costPer1mPrompt}
                  onChange={e => onChange('costPer1mPrompt', parseFloat(e.target.value))}
                  className="form-input"
                  placeholder="e.g. 0.15"
                />
              </FieldGroup>
              <FieldGroup label="Cost per 1M Completion Tokens ($)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.costPer1mCompletion}
                  onChange={e => onChange('costPer1mCompletion', parseFloat(e.target.value))}
                  className="form-input"
                  placeholder="e.g. 0.60"
                />
              </FieldGroup>
            </div>
          )}
        </SectionCard>

        {/* Save */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 13, fontWeight: 600 }}
          >
            {saving ? (
              <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} /> Saving…</>
            ) : 'Save Configuration'}
          </button>
          {saveStatus && (
            <div style={{
              padding: '9px 12px', textAlign: 'center', fontSize: 12, fontWeight: 500,
              background: 'var(--success-dim)', color: '#34d399',
              border: '1px solid rgba(16,185,129,0.2)', borderRadius: 7,
            }}>
              {saveStatus}
            </div>
          )}
        </div>

      </div>
    </form>
  );
}
