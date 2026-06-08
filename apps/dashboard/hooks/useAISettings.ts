import { useEffect, useReducer, useState } from 'react';
import { AISettingsData } from '../types';

type Action = 
  | { type: 'SET_FIELD'; field: keyof AISettingsData; value: any }
  | { type: 'SET_MULTIPLE'; payload: Partial<AISettingsData> };

function settingsReducer(state: AISettingsData, action: Action): AISettingsData {
  switch (action.type) {
    case 'SET_FIELD': {
      const newState = { ...state, [action.field]: action.value };
      
      // Edge Case 1: Clear irrelevant API credentials when Provider changes
      if (action.field === 'provider') {
        const p = action.value;
        if (p !== 'OPENROUTER') newState.openRouterKey = '';
        if (p !== 'OPENAI') newState.openaiKey = '';
        if (p !== 'ANTHROPIC') newState.anthropicKey = '';
        if (p !== 'XAI') newState.xaiKey = '';
        if (p !== 'BEDROCK') {
          newState.awsAccessKeyId = '';
          newState.awsSecretAccessKey = '';
          newState.awsRegion = '';
        }
        if (p !== 'OLLAMA' && p !== 'OPENAI') newState.baseUrl = '';
      }
      
      // Edge Case 2: Reset costs to 0 if API is marked as free
      if (action.field === 'isFreeApi' && action.value === true) {
        newState.costPer1mPrompt = 0;
        newState.costPer1mCompletion = 0;
      }
      
      return newState;
    }
    case 'SET_MULTIPLE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function useAISettings() {
  const [formData, dispatch] = useReducer(settingsReducer, {
    provider: 'OPENROUTER',
    openRouterKey: '',
    openaiKey: '',
    anthropicKey: '',
    xaiKey: '',
    baseUrl: '',
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    awsRegion: '',
    showKey: false,
    model: '',
    isFreeApi: false,
    costPer1mPrompt: 0.0,
    costPer1mCompletion: 0.0,
    temperature: 0.1,
    maxTokens: 2048,
    systemPrompt: `You are an elite, highly specialized Principal Engineer and Security Auditor. Your primary objective is to review Pull Request diffs with extreme rigor.\n\nFocus your analysis on the following critical dimensions:\n1. Security Vulnerabilities (OWASP Top 10): Identify SQL injections, XSS, SSRF, insecure direct object references, and sensitive data leaks.\n2. Performance Bottlenecks: Detect O(N^2) algorithms, unnecessary database queries (N+1), memory leaks, and inefficient loops.\n3. Architecture & Concurrency: Spot race conditions, deadlocks, improper state management, and tight coupling.\n4. Code Quality & Reliability: Highlight unhandled edge cases, missing null-checks, logic bugs, and fragile error handling.\n\nGuidelines for your review:\n- Be ruthless but constructive. Do not sugarcoat issues, but provide clear paths to resolution.\n- Provide Actionable Code. Whenever you find a flaw, offer a production-ready, highly optimized drop-in code snippet to fix it.\n- Zero Fluff. Skip pleasantries. Do not compliment the code. Go straight into technical analysis.\n- Context Awareness. Only comment on lines that were actually changed in the diff.`,
    bypassSignature: true,
    isConsensusEnabled: false,
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'SUCCESS' | 'FAILED' | null>(null);
  const [testErrorMessage, setTestErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  const handleChange = (field: keyof AISettingsData, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  // Fetch settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [settingsRes, providersRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/settings/providers')
        ]);
        
        if (providersRes.ok) {
          const pData = await providersRes.json();
          if (pData.success && pData.data) {
            setAvailableProviders(pData.data);
          }
        }

        if (settingsRes.ok) {
          const dataRaw = await settingsRes.json();
          const data = dataRaw.success !== undefined ? dataRaw.data : dataRaw;
          dispatch({ type: 'SET_MULTIPLE', payload: data });
        }
      } catch (err) {
        console.error('Failed to load configurations from backend:', err);
      }
    };
    loadSettings();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setTestErrorMessage('');
    
    try {
      const res = await fetch('/api/settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: formData.provider,
          openRouterKey: formData.openRouterKey,
          openaiKey: formData.openaiKey,
          anthropicKey: formData.anthropicKey,
          xaiKey: formData.xaiKey,
        }),
      });

      const dataRaw = await res.json();
      const data = dataRaw.success !== undefined ? dataRaw.data : dataRaw;
      if (res.ok && dataRaw.success !== false) {
        setTestResult('SUCCESS');
      } else {
        setTestResult('FAILED');
        setTestErrorMessage(data.message || 'Authentication key test failed.');
      }
    } catch (err) {
      console.error(err);
      setTestResult('FAILED');
      setTestErrorMessage('Network error: Failed to reach backend test API.');
    } finally {
      setTesting(false);
      // Auto-clear message after 6s
      setTimeout(() => {
        setTestResult(null);
        setTestErrorMessage('');
      }, 6000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);
    
    try {
      const { showKey, ...saveData } = formData;
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (res.ok) {
        const dataRaw = await res.json();
        const data = dataRaw.success !== undefined ? dataRaw.data : dataRaw;
        dispatch({ type: 'SET_MULTIPLE', payload: data });
        setSaveStatus('AI parameters stored securely in Prisma Database!');
      } else {
        const data = await res.json();
        setSaveStatus(`Failed to persist configurations: ${data.message || 'Unknown server error'}`);
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('Network error! Failed to store configurations.');
    } finally {
      setSaving(false);
      // Auto-clear toast after 4s
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  return {
    formData,
    handleChange,
    availableProviders,
    testing,
    testResult,
    testErrorMessage,
    saving,
    saveStatus,
    handleTestConnection,
    handleSave,
  };
}
