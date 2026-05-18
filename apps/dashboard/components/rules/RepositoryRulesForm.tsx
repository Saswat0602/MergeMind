import React, { useState } from 'react';
import { useRepositoryRules } from '../../hooks/useRepositoryRules';

// ── Shared styling primitives ───────────────────────────────
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

export function RepositoryRulesForm() {
  const {
    repositories,
    selectedRepoId,
    setSelectedRepoId,
    rules,
    loadingRepos,
    loadingRules,
    saving,
    error,
    handleToggleRule,
    handleCreateRule,
    handleDeleteRule,
  } = useRepositoryRules();

  // Create rule form state
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleType, setNewRuleType] = useState('AI');
  const [showAddForm, setShowAddForm] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleDesc.trim()) return;

    const success = await handleCreateRule({
      name: newRuleName,
      description: newRuleDesc,
      pattern: newRulePattern,
      type: newRuleType,
    });

    if (success) {
      setNewRuleName('');
      setNewRuleDesc('');
      setNewRulePattern('');
      setNewRuleType('AI');
      setShowAddForm(false);
      setCreateSuccess(true);
      setTimeout(() => setCreateSuccess(false), 3000);
    }
  };

  if (loadingRepos) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <div className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <SectionCard title="Repository Rules" description="Configure repository-specific checks.">
        <div style={{
          padding: '24px', textAlign: 'center', background: 'var(--bg-elevated)',
          border: '1px dashed var(--border-soft)', borderRadius: 8, color: 'var(--text-secondary)'
        }}>
          No repositories found. Add repositories to GitHub integrations first to manage custom review rules.
        </div>
      </SectionCard>
    );
  }

  return (
    <div
      className="repository-rules-container"
      style={{
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
        width: '100%',
        flexWrap: 'wrap',
      }}
    >
      {/* LEFT COLUMN: Sidebar Repository List */}
      <div
        className="repository-sidebar-card"
        style={{
          width: '100%',
          maxWidth: '280px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Linked Repositories</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Select a repository to define dynamic check standards. Default fallback rules are automatically seeded.
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: '480px',
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {repositories.map((repo) => {
              const isSelected = repo.id === selectedRepoId;
              return (
                <button
                  key={repo.id}
                  type="button"
                  onClick={() => setSelectedRepoId(repo.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: isSelected ? 'var(--accent-dim)' : 'transparent',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
                    color: isSelected ? '#818cf8' : 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 500,
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, color: isSelected ? '#818cf8' : 'var(--text-secondary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                    {repo.fullName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Rules Grid Content */}
      <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Rules list grid */}
        <div className="settings-form-grid" style={{ gridTemplateColumns: '1fr 340px' }}>
          
          {/* Left column - Active rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionCard 
              title="Repository Standards" 
              description="Manage specific parameters the AI or regex models check on every pull request audit."
            >
              {loadingRules ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                  <div className="spinner" style={{ width: 20, height: 20 }} />
                </div>
              ) : rules.length === 0 ? (
                <div style={{
                  padding: '20px', textAlign: 'center', background: 'var(--bg-elevated)',
                  borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13
                }}>
                  No rules active. Add a custom rule to get started!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {rules.map((rule) => {
                    const isDefaultRule = ['Strict Type Safety', 'Security Shield', 'Async Error Boundaries', 'No Debug Logs in Production'].includes(rule.name);

                    return (
                      <div
                        key={rule.id}
                        style={{
                          padding: '16px',
                          background: 'var(--bg-elevated)',
                          border: rule.isEnabled ? '1px solid rgba(99,102,241,0.2)' : '1px solid var(--border-soft)',
                          borderRadius: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                          transition: 'border 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                {rule.name}
                              </span>
                              <span style={{
                                fontSize: 9,
                                fontWeight: 600,
                                background: rule.type === 'AI' ? 'rgba(99,102,241,0.1)' : 'rgba(52,211,153,0.1)',
                                color: rule.type === 'AI' ? 'var(--accent)' : '#34d399',
                                padding: '2px 6px',
                                borderRadius: 4,
                                textTransform: 'uppercase'
                              }}>
                                {rule.type} Rule
                              </span>
                              {isDefaultRule && (
                                <span style={{
                                  fontSize: 9,
                                  fontWeight: 600,
                                  background: 'rgba(255,255,255,0.05)',
                                  color: 'var(--text-secondary)',
                                  padding: '2px 6px',
                                  borderRadius: 4
                                }}>
                                  SYSTEM DEFAULT
                                </span>
                              )}
                            </div>
                            {rule.description && (
                              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                                {rule.description}
                              </p>
                            )}
                          </div>
                          <Toggle on={rule.isEnabled} onToggle={() => handleToggleRule(rule.id, rule.isEnabled)} />
                        </div>

                        {rule.pattern && (
                          <div style={{
                            fontSize: 10,
                            background: 'rgba(0,0,0,0.2)',
                            padding: '6px 10px',
                            borderRadius: 6,
                            fontFamily: 'monospace',
                            color: '#818cf8',
                            wordBreak: 'break-all',
                          }}>
                            Trigger pattern: {rule.pattern}
                          </div>
                        )}

                        {!isDefaultRule && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-soft)', paddingTop: 10 }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#f87171',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: 0
                              }}
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Rule
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right column - Add custom rule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionCard 
              title="Extend Standards" 
              description="Add custom regulatory audits or static code checks tailored specifically for your engineering pipeline."
            >
              {createSuccess && (
                <div style={{
                  padding: '9px 12px', textAlign: 'center', fontSize: 12, fontWeight: 500,
                  background: 'var(--success-dim)', color: '#34d399',
                  border: '1px solid rgba(16,185,129,0.2)', borderRadius: 7,
                }}>
                  Custom rule successfully created!
                </div>
              )}

              {!showAddForm ? (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 12, fontWeight: 600 }}
                >
                  + Add Custom Rule
                </button>
              ) : (
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <FieldGroup label="Rule Name">
                    <input
                      type="text"
                      required
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="e.g. Reject Absolute Imports"
                      className="form-input"
                      style={{ fontSize: 12 }}
                    />
                  </FieldGroup>

                  <FieldGroup label="Description">
                    <textarea
                      required
                      value={newRuleDesc}
                      onChange={(e) => setNewRuleDesc(e.target.value)}
                      placeholder="Audits PR imports to guarantee only relative packages are used in src/."
                      rows={3}
                      className="form-input"
                      style={{ resize: 'none', fontSize: 12, lineHeight: 1.5 }}
                    />
                  </FieldGroup>

                  <FieldGroup label="Regex Trigger Pattern (Optional)">
                    <input
                      type="text"
                      value={newRulePattern}
                      onChange={(e) => setNewRulePattern(e.target.value)}
                      placeholder="e.g. import .* from '@/'"
                      className="form-input"
                      style={{ fontSize: 12, fontFamily: 'monospace' }}
                    />
                  </FieldGroup>

                  <FieldGroup label="Validation Engine Type">
                    <select
                      value={newRuleType}
                      onChange={(e) => setNewRuleType(e.target.value)}
                      className="form-input"
                      style={{
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-soft)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        outline: 'none',
                        width: '100%',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      <option value="AI">AI Prompt Enforced</option>
                      <option value="REGEX">Regex Direct Filter</option>
                      <option value="LINT">Static Code Checker</option>
                    </select>
                  </FieldGroup>

                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '8px 0' }}
                    >
                      {saving ? 'Creating…' : 'Save Rule'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="btn btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '8px 0' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {error && (
                <div style={{
                  padding: '9px 12px',
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: 7,
                  fontSize: 11,
                  color: '#f87171',
                  lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}
            </SectionCard>
          </div>

        </div>

      </div>

    </div>
  );
}
