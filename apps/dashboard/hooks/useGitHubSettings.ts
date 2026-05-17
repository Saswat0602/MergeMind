import { useEffect, useState } from 'react';

export function useGitHubSettings() {
  const [gitHubAppId, setGitHubAppId] = useState('');
  const [gitHubPrivateKey, setGitHubPrivateKey] = useState('');
  const [gitHubWebhookSecret, setGitHubWebhookSecret] = useState('');
  const [gitHubClientId, setGitHubClientId] = useState('');
  const [gitHubClientSecret, setGitHubClientSecret] = useState('');

  const [showGitHubPrivateKey, setShowGitHubPrivateKey] = useState(false);
  const [showGitHubWebhookSecret, setShowGitHubWebhookSecret] = useState(false);
  const [showGitHubClientSecret, setShowGitHubClientSecret] = useState(false);

  const [testingGitHub, setTestingGitHub] = useState(false);
  const [testGitHubResult, setTestGitHubResult] = useState<'SUCCESS' | 'FAILED' | null>(null);
  const [testGitHubErrorMessage, setTestGitHubErrorMessage] = useState('');
  const [savingGitHub, setSavingGitHub] = useState(false);
  const [saveGitHubStatus, setSaveGitHubStatus] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const ghRes = await fetch('/api/settings/github');
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          if (ghData.appId) setGitHubAppId(ghData.appId);
          if (ghData.privateKey) setGitHubPrivateKey(ghData.privateKey);
          if (ghData.webhookSecret) setGitHubWebhookSecret(ghData.webhookSecret);
          if (ghData.clientId) setGitHubClientId(ghData.clientId);
          if (ghData.clientSecret) setGitHubClientSecret(ghData.clientSecret);
        }
      } catch (err) {
        console.error('Failed to load GitHub settings from backend:', err);
      }
    };
    loadSettings();
  }, []);

  const handleTestGitHubConnection = async () => {
    setTestingGitHub(true);
    setTestGitHubResult(null);
    setTestGitHubErrorMessage('');

    try {
      const res = await fetch('/api/settings/github/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: gitHubAppId,
          privateKey: gitHubPrivateKey,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestGitHubResult('SUCCESS');
      } else {
        setTestGitHubResult('FAILED');
        setTestGitHubErrorMessage(data.message || 'Handshake rejected by GitHub App Endpoint.');
      }
    } catch (err) {
      setTestGitHubResult('FAILED');
      setTestGitHubErrorMessage('Network error: Failed to reach backend handshake API.');
    } finally {
      setTestingGitHub(false);
      setTimeout(() => {
        setTestGitHubResult(null);
        setTestGitHubErrorMessage('');
      }, 6000);
    }
  };

  const handleSaveGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGitHub(true);
    setSaveGitHubStatus(null);

    try {
      const res = await fetch('/api/settings/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: gitHubAppId,
          privateKey: gitHubPrivateKey,
          webhookSecret: gitHubWebhookSecret,
          clientId: gitHubClientId,
          clientSecret: gitHubClientSecret,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.privateKey) setGitHubPrivateKey(data.privateKey);
        if (data.webhookSecret) setGitHubWebhookSecret(data.webhookSecret);
        if (data.clientSecret) setGitHubClientSecret(data.clientSecret);
        setSaveGitHubStatus('GitHub configurations stored securely in database!');
      } else {
        const data = await res.json();
        setSaveGitHubStatus(`Failed: ${data.message || 'Unknown server error'}`);
      }
    } catch (err) {
      setSaveGitHubStatus('Network error! Failed to store configurations.');
    } finally {
      setSavingGitHub(false);
      setTimeout(() => setSaveGitHubStatus(null), 4000);
    }
  };

  return {
    gitHubAppId,
    gitHubPrivateKey,
    gitHubWebhookSecret,
    gitHubClientId,
    gitHubClientSecret,
    showGitHubPrivateKey,
    showGitHubWebhookSecret,
    showGitHubClientSecret,
    testingGitHub,
    testGitHubResult,
    testGitHubErrorMessage,
    savingGitHub,
    saveGitHubStatus,
    setGitHubAppId,
    setGitHubPrivateKey,
    setGitHubWebhookSecret,
    setGitHubClientId,
    setGitHubClientSecret,
    setShowGitHubPrivateKey,
    setShowGitHubWebhookSecret,
    setShowGitHubClientSecret,
    handleTestGitHubConnection,
    handleSaveGitHub,
  };
}
