import { useEffect, useState } from 'react';

export function useAISettings() {
  const [apiKey, setApiKey] = useState('sk-or-v1-****************************************');
  const [showKey, setShowKey] = useState(false);
  const [primaryModel, setPrimaryModel] = useState('deepseek/deepseek-v4-flash:free');
  const [fallbackModel, setFallbackModel] = useState('arcee-ai/trinity-large-thinking:free');
  const [temperature, setTemperature] = useState(0.1);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState(
    `You are an elite, highly specialized AI code auditor. Analyze the pull request diff for:
1. Critical security bugs and OWASP vulnerabilities.
2. Major execution hotpaths and latency bottlenecks.
3. Logical deadlocks, edge cases, and standard cleanups.

Adopt a clean, direct, and constructive technical persona. Offer actionable, production-grade refactored code blocks in your responses.`
  );
  const [bypassSignature, setBypassSignature] = useState(true);
  const [isConsensusEnabled, setIsConsensusEnabled] = useState(false);

  // Interaction / Loading states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'SUCCESS' | 'FAILED' | null>(null);
  const [testErrorMessage, setTestErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Fetch settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const dataRaw = await res.json();
          const data = dataRaw.success !== undefined ? dataRaw.data : dataRaw;
          if (data.openRouterKey) setApiKey(data.openRouterKey);
          if (data.defaultModel) setPrimaryModel(data.defaultModel);
          if (data.fallbackModel) setFallbackModel(data.fallbackModel);
          if (data.temperature !== undefined) setTemperature(data.temperature);
          if (data.maxTokens !== undefined) setMaxTokens(data.maxTokens);
          if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
          if (data.bypassSignature !== undefined) setBypassSignature(data.bypassSignature);
          if (data.isConsensusEnabled !== undefined) setIsConsensusEnabled(data.isConsensusEnabled);
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
          openRouterKey: apiKey,
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
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openRouterKey: apiKey,
          defaultModel: primaryModel,
          fallbackModel: fallbackModel,
          temperature,
          maxTokens,
          systemPrompt,
          bypassSignature,
          isFallbackEnabled: true,
          isConsensusEnabled,
        }),
      });

      if (res.ok) {
        const dataRaw = await res.json();
        const data = dataRaw.success !== undefined ? dataRaw.data : dataRaw;
        if (data.openRouterKey) setApiKey(data.openRouterKey);
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
    apiKey,
    showKey,
    primaryModel,
    fallbackModel,
    temperature,
    maxTokens,
    systemPrompt,
    bypassSignature,
    isConsensusEnabled,
    testing,
    testResult,
    testErrorMessage,
    saving,
    saveStatus,
    setApiKey,
    setShowKey,
    setPrimaryModel,
    setFallbackModel,
    setTemperature,
    setMaxTokens,
    setSystemPrompt,
    setBypassSignature,
    setIsConsensusEnabled,
    handleTestConnection,
    handleSave,
  };
}
