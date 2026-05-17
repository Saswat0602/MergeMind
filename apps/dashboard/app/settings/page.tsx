'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAISettings } from '../../hooks/useAISettings';
import { useGitHubSettings } from '../../hooks/useGitHubSettings';
import { AISettingsForm } from '../../components/settings/AISettingsForm';
import { GitHubSettingsForm } from '../../components/settings/GitHubSettingsForm';

export default function SettingsPage() {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'AI' | 'GITHUB'>('AI');

  // AI Hook
  const aiHook = useAISettings();

  // GitHub Hook
  const ghHook = useGitHubSettings();

  return (
    <div className="min-h-screen bg-[#070913] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.1),rgba(255,255,255,0))] text-[#f3f4f6] px-6 py-10 md:px-12 max-w-7xl mx-auto flex flex-col gap-8 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Header section */}
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/40 pb-6 z-10">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              ← Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-800/40 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
              System Configuration
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mt-3 tracking-tight bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-400 bg-clip-text text-transparent">
            System Settings Panel
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Calibrate deep learning models, prompt strategies, and credentials for autonomous audits.</p>
        </div>
      </header>

      {/* Tabs list switches */}
      <div className="flex border-b border-slate-800/60 pb-3 gap-2 overflow-x-auto relative z-10">
        <button
          onClick={() => setActiveSettingsTab('AI')}
          className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 ${
            activeSettingsTab === 'AI'
              ? 'bg-violet-600/90 text-white border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          AI Audit Configurations
        </button>
        <button
          onClick={() => setActiveSettingsTab('GITHUB')}
          className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 ${
            activeSettingsTab === 'GITHUB'
              ? 'bg-violet-600/90 text-white border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          GitHub Application Setup
        </button>
      </div>

      {/* Content Form Panels */}
      <section className="relative z-10">
        {activeSettingsTab === 'AI' ? (
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
      </section>
    </div>
  );
}
