import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem } from '../ui/select';
import { AIModel } from '../../types';

interface AISettingsFormProps {
  apiKey: string; setApiKey: (val: string) => void;
  showKey: boolean; setShowKey: (val: boolean) => void;
  primaryModel: string; setPrimaryModel: (val: string) => void;
  fallbackModel: string; setFallbackModel: (val: string) => void;
  temperature: number; setTemperature: (val: number) => void;
  maxTokens: number; setMaxTokens: (val: number) => void;
  systemPrompt: string; setSystemPrompt: (val: string) => void;
  bypassSignature: boolean; setBypassSignature: (val: boolean) => void;
  isConsensusEnabled: boolean; setIsConsensusEnabled: (val: boolean) => void;
  testing: boolean;
  testResult: 'SUCCESS' | 'FAILED' | null;
  testErrorMessage: string;
  saving: boolean;
  saveStatus: string | null;
  handleTestConnection: () => void;
  handleSave: (e: React.FormEvent) => void;
}

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
  apiKey, setApiKey, showKey, setShowKey,
  primaryModel, setPrimaryModel, fallbackModel, setFallbackModel,
  temperature, setTemperature, maxTokens, setMaxTokens,
  systemPrompt, setSystemPrompt,
  bypassSignature, setBypassSignature,
  isConsensusEnabled, setIsConsensusEnabled,
  testing, testResult, testErrorMessage,
  saving, saveStatus,
  handleTestConnection, handleSave,
}: AISettingsFormProps) {

  const availableModels: AIModel[] = [
    { id: 'deepseek/deepseek-v4-flash:free', name: 'DeepSeek V4 Flash (Free)', provider: 'DeepSeek', tier: 'free', contextLength: '128k' },
    { id: 'arcee-ai/trinity-large-thinking:free', name: 'Arcee Trinity Large Thinking (Free)', provider: 'Arcee AI', tier: 'free', contextLength: '64k' },
    { id: 'google/gemini-2.5-flash:free', name: 'Gemini 2.5 Flash (Free)', provider: 'Google', tier: 'free', contextLength: '1m' },
    { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B (Free)', provider: 'Alibaba', tier: 'free', contextLength: '32k' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Free)', provider: 'Meta', tier: 'free', contextLength: '128k' },
  ];

  return (
    <form onSubmit={handleSave} className="settings-form-grid" style={{
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      gap: 20,
      alignItems: 'flex-start',
    }}>
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* API Key */}
        <SectionCard title="OpenRouter API Key" description="Your OpenRouter API token used to access LLM models.">
          <FieldGroup label="API Key">
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 36 }}
                placeholder="sk-or-v1-..."
              />
              <EyeToggle show={showKey} onToggle={() => setShowKey(!showKey)} />
            </div>
          </FieldGroup>
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

        {/* Models */}
        <SectionCard title="Model Selection" description="Primary model is used for all reviews. Fallback activates when primary is unavailable.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FieldGroup label="Primary Model">
              <Select value={primaryModel} onValueChange={setPrimaryModel}>
                <SelectTrigger>{availableModels.find(m => m.id === primaryModel)?.name || 'Select model'}</SelectTrigger>
                <SelectContent>
                  {availableModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Fallback Model">
              <Select value={fallbackModel} onValueChange={setFallbackModel}>
                <SelectTrigger>{availableModels.find(m => m.id === fallbackModel)?.name || 'Select model'}</SelectTrigger>
                <SelectContent>
                  {availableModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>
        </SectionCard>

        {/* System prompt */}
        <SectionCard title="System Prompt" description="Custom instructions that shape how the AI structures its code review output.">
          <textarea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            rows={6}
            className="form-input"
            style={{ resize: 'vertical', lineHeight: 1.6, fontSize: 13 }}
          />
        </SectionCard>

      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Sliders */}
        <SectionCard title="Execution Parameters" description="Tune temperature and token limits.">
          {/* Temperature */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-label" style={{ margin: 0 }}>Temperature</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#818cf8' }}>
                {temperature}
              </span>
            </div>
            <input
              type="range" min="0" max="1" step="0.05"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
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
                {maxTokens}
              </span>
            </div>
            <input
              type="range" min="256" max="4096" step="128"
              value={maxTokens}
              onChange={e => setMaxTokens(parseInt(e.target.value))}
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
            on={bypassSignature}
            onToggle={() => setBypassSignature(!bypassSignature)}
          />
          <ToggleRow
            label="Dual-Model Consensus"
            description="Run two models concurrently to deduplicate findings"
            on={isConsensusEnabled}
            onToggle={() => setIsConsensusEnabled(!isConsensusEnabled)}
          />
          <div style={{
            padding: '10px 12px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 7, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
          }}>
            Free tier models have no USD cost deducted from your balance.
          </div>
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
