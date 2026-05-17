'use client';

import React, { useState } from 'react';
import { useAISettings } from '../../hooks/useAISettings';
import { useGitHubSettings } from '../../hooks/useGitHubSettings';
import { AISettingsForm } from '../../components/settings/AISettingsForm';
import { GitHubSettingsForm } from '../../components/settings/GitHubSettingsForm';
import { PageHeader } from '../../components/layout/PageHeader';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'AI' | 'GITHUB'>('AI');

  const aiHook = useAISettings();
  const ghHook = useGitHubSettings();

  return (
    <div className="page-content">
      <PageHeader
        title="Settings"
        subtitle="Configure AI models, API keys, and GitHub integration"
      />

      {/* Tab nav */}
      <div className="tab-list" style={{ marginBottom: 4 }}>
        <button
          className={`tab-btn${activeTab === 'AI' ? ' active' : ''}`}
          onClick={() => setActiveTab('AI')}
        >
          AI Configuration
        </button>
        <button
          className={`tab-btn${activeTab === 'GITHUB' ? ' active' : ''}`}
          onClick={() => setActiveTab('GITHUB')}
        >
          GitHub Setup
        </button>
      </div>

      {/* Form content */}
      <div>
        {activeTab === 'AI' ? (
          <AISettingsForm
            apiKey={aiHook.apiKey}
            setApiKey={aiHook.setApiKey}
            showKey={aiHook.showKey}
            setShowKey={aiHook.setShowKey}
            primaryModel={aiHook.primaryModel}
            setPrimaryModel={aiHook.setPrimaryModel}
            fallbackModel={aiHook.fallbackModel}
            setFallbackModel={aiHook.setFallbackModel}
            temperature={aiHook.temperature}
            setTemperature={aiHook.setTemperature}
            maxTokens={aiHook.maxTokens}
            setMaxTokens={aiHook.setMaxTokens}
            systemPrompt={aiHook.systemPrompt}
            setSystemPrompt={aiHook.setSystemPrompt}
            bypassSignature={aiHook.bypassSignature}
            setBypassSignature={aiHook.setBypassSignature}
            isConsensusEnabled={aiHook.isConsensusEnabled}
            setIsConsensusEnabled={aiHook.setIsConsensusEnabled}
            testing={aiHook.testing}
            testResult={aiHook.testResult}
            testErrorMessage={aiHook.testErrorMessage}
            saving={aiHook.saving}
            saveStatus={aiHook.saveStatus}
            handleTestConnection={aiHook.handleTestConnection}
            handleSave={aiHook.handleSave}
          />
        ) : (
          <GitHubSettingsForm
            gitHubAppId={ghHook.gitHubAppId}
            setGitHubAppId={ghHook.setGitHubAppId}
            gitHubPrivateKey={ghHook.gitHubPrivateKey}
            setGitHubPrivateKey={ghHook.setGitHubPrivateKey}
            gitHubWebhookSecret={ghHook.gitHubWebhookSecret}
            setGitHubWebhookSecret={ghHook.setGitHubWebhookSecret}
            gitHubClientId={ghHook.gitHubClientId}
            setGitHubClientId={ghHook.setGitHubClientId}
            gitHubClientSecret={ghHook.gitHubClientSecret}
            setGitHubClientSecret={ghHook.setGitHubClientSecret}
            showGitHubPrivateKey={ghHook.showGitHubPrivateKey}
            setShowGitHubPrivateKey={ghHook.setShowGitHubPrivateKey}
            showGitHubWebhookSecret={ghHook.showGitHubWebhookSecret}
            setShowGitHubWebhookSecret={ghHook.setShowGitHubWebhookSecret}
            showGitHubClientSecret={ghHook.showGitHubClientSecret}
            setShowGitHubClientSecret={ghHook.setShowGitHubClientSecret}
            testingGitHub={ghHook.testingGitHub}
            testGitHubResult={ghHook.testGitHubResult}
            testGitHubErrorMessage={ghHook.testGitHubErrorMessage}
            savingGitHub={ghHook.savingGitHub}
            saveGitHubStatus={ghHook.saveGitHubStatus}
            handleTestGitHubConnection={ghHook.handleTestGitHubConnection}
            handleSaveGitHub={ghHook.handleSaveGitHub}
          />
        )}
      </div>
    </div>
  );
}
