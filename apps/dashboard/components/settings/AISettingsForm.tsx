import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem } from '../ui/select';
import { AIModel } from '../../types';

interface AISettingsFormProps {
  apiKey: string;
  setApiKey: (val: string) => void;
  showKey: boolean;
  setShowKey: (val: boolean) => void;
  primaryModel: string;
  setPrimaryModel: (val: string) => void;
  fallbackModel: string;
  setFallbackModel: (val: string) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  maxTokens: number;
  setMaxTokens: (val: number) => void;
  systemPrompt: string;
  setSystemPrompt: (val: string) => void;
  bypassSignature: boolean;
  setBypassSignature: (val: boolean) => void;
  isConsensusEnabled: boolean;
  setIsConsensusEnabled: (val: boolean) => void;
  testing: boolean;
  testResult: 'SUCCESS' | 'FAILED' | null;
  testErrorMessage: string;
  saving: boolean;
  saveStatus: string | null;
  handleTestConnection: () => void;
  handleSave: (e: React.FormEvent) => void;
}

export function AISettingsForm({
  apiKey,
  setApiKey,
  showKey,
  setShowKey,
  primaryModel,
  setPrimaryModel,
  fallbackModel,
  setFallbackModel,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  systemPrompt,
  setSystemPrompt,
  bypassSignature,
  setBypassSignature,
  isConsensusEnabled,
  setIsConsensusEnabled,
  testing,
  testResult,
  testErrorMessage,
  saving,
  saveStatus,
  handleTestConnection,
  handleSave,
}: AISettingsFormProps) {
  
  const availableModels: AIModel[] = [
    { id: 'deepseek/deepseek-v4-flash:free', name: 'DeepSeek V4 Flash (Free)', provider: 'DeepSeek', tier: 'free', contextLength: '128k' },
    { id: 'arcee-ai/trinity-large-thinking:free', name: 'Arcee Trinity Large Thinking (Free)', provider: 'Arcee AI', tier: 'free', contextLength: '64k' },
    { id: 'google/gemini-2.5-flash:free', name: 'Gemini 2.5 Flash (Free)', provider: 'Google', tier: 'free', contextLength: '1m' },
    { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B (Free)', provider: 'Alibaba', tier: 'free', contextLength: '32k' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Free)', provider: 'Meta', tier: 'free', contextLength: '128k' },
  ];

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="glass-card p-6 flex flex-col gap-5 border border-white/5 bg-slate-900/20 backdrop-blur-xl rounded-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              OpenRouter Credentials
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure your active OpenRouter token to establish a connection to available LLM nodes.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">OpenRouter API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0c16] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all font-mono"
                placeholder="sk-or-v1-..."
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition"
              >
                {showKey ? (
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-slate-600 text-violet-300 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {testing ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border border-violet-500/20 border-t-violet-500 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Verify Key Connection'
              )}
            </button>

            {testResult === 'SUCCESS' && (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 animate-fade-in font-medium">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Success! OpenRouter API authenticated successfully
              </div>
            )}

            {testResult === 'FAILED' && (
              <div className="text-xs text-rose-400 flex items-center gap-1.5 animate-fade-in font-medium max-w-xs break-words">
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                {testErrorMessage}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col gap-5 border border-white/5 bg-slate-900/20 backdrop-blur-xl rounded-xl relative z-30">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Model Settings & Fallbacks
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure your active model configurations. Fallbacks are triggered automatically if the primary endpoint is congested.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Primary Model</label>
              <Select value={primaryModel} onValueChange={setPrimaryModel}>
                <SelectTrigger>
                  {availableModels.find(m => m.id === primaryModel)?.name || 'Select Primary Model'}
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fallback Model</label>
              <Select value={fallbackModel} onValueChange={setFallbackModel}>
                <SelectTrigger>
                  {availableModels.find(m => m.id === fallbackModel)?.name || 'Select Fallback Model'}
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col gap-5 border border-white/5 bg-slate-900/20 backdrop-blur-xl rounded-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Custom System Auditor Instructions
            </h3>
            <p className="text-xs text-slate-400 mt-1">Provide custom prompt rules that define how the AI structures its code diagnostic feedback.</p>
          </div>

          <div className="flex flex-col gap-2">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-[#0a0c16] border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all leading-6 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="glass-card p-6 flex flex-col gap-6 border border-white/5 bg-slate-900/20 backdrop-blur-xl rounded-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Execution Parameters
            </h3>
            <p className="text-xs text-slate-400 mt-1">Fine-tune the temperature creativity and maximum length limitations.</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Temperature</span>
              <span className="text-violet-400 font-mono font-bold text-[13px]">{temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer bg-slate-800"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.0 (Deterministic)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Max Completion Tokens</span>
              <span className="text-violet-400 font-mono font-bold text-[13px]">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="256"
              max="4096"
              step="128"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer bg-slate-800"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>256</span>
              <span>4096</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col gap-5 border border-white/5 bg-slate-900/20 backdrop-blur-xl rounded-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Development & Guardrails
            </h3>
          </div>

          <div className="flex justify-between items-center bg-black/20 p-4 border border-slate-800/80 rounded-lg">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white">Local Signature Bypass</span>
              <span className="text-[10px] text-slate-400">Ignore HMAC errors in development mode</span>
            </div>
            <button
              type="button"
              onClick={() => setBypassSignature(!bypassSignature)}
              className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${bypassSignature ? 'bg-violet-500' : 'bg-slate-800'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md ${bypassSignature ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex justify-between items-center bg-black/20 p-4 border border-slate-800/80 rounded-lg">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white">Dual-Model Consensus Auditing</span>
              <span className="text-[10px] text-slate-400">Run two LLM models concurrently to deduplicate findings</span>
            </div>
            <button
              type="button"
              onClick={() => setIsConsensusEnabled(!isConsensusEnabled)}
              className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${isConsensusEnabled ? 'bg-violet-500' : 'bg-slate-800'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md ${isConsensusEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="p-4 border border-violet-500/10 bg-violet-500/5 rounded-lg text-xs leading-5 text-violet-300">
            <span className="font-semibold block text-white mb-1">💡 Developer Note</span>
            Your active OpenRouter primary model uses a **Free Tier** configuration. There is no active USD cost deducted from your credit balance.
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 text-sm font-bold uppercase tracking-wider rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                Persisting Settings...
              </>
            ) : (
              'Save Configurations'
            )}
          </button>

          {saveStatus && (
            <div className="p-3 text-center text-xs font-semibold border border-emerald-500/15 bg-emerald-500/10 text-emerald-400 rounded-lg animate-fade-in">
              {saveStatus}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
