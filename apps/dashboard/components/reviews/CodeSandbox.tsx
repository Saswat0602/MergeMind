import React from 'react';
import { ReviewComment } from '../../types';

function checkSyntax(code: string, filePath: string): string | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  if (ext === 'json') {
    try {
      JSON.parse(code);
      return null;
    } catch (err: any) {
      return `Invalid JSON structure - ${err.message}`;
    }
  }
  
  if (['js', 'ts', 'jsx', 'tsx'].includes(ext || '')) {
    const stack: string[] = [];
    const open = ['{', '[', '('];
    const close = ['}', ']', ')'];
    const matching: Record<string, string> = {
      '}': '{',
      ']': '[',
      ')': '(',
    };
    
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inTemplateLiteral = false;
    let inLineComment = false;
    let inBlockComment = false;
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const nextChar = code[i + 1];
      
      if (inLineComment) {
        if (char === '\n') inLineComment = false;
        continue;
      }
      if (inBlockComment) {
        if (char === '*' && nextChar === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }
      if (inSingleQuote) {
        if (char === "'" && code[i - 1] !== '\\') inSingleQuote = false;
        continue;
      }
      if (inDoubleQuote) {
        if (char === '"' && code[i - 1] !== '\\') inDoubleQuote = false;
        continue;
      }
      if (inTemplateLiteral) {
        if (char === '`' && code[i - 1] !== '\\') inTemplateLiteral = false;
        continue;
      }
      
      if (char === '/' && nextChar === '/') {
        inLineComment = true;
        i++;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
      
      if (char === "'") { inSingleQuote = true; continue; }
      if (char === '"') { inDoubleQuote = true; continue; }
      if (char === '`') { inTemplateLiteral = true; continue; }
      
      if (open.includes(char)) {
        stack.push(char);
      } else if (close.includes(char)) {
        const top = stack.pop();
        if (top !== matching[char]) {
          return `Unbalanced token detected: unmatched closing '${char}'`;
        }
      }
    }
    
    if (stack.length > 0) {
      return `Unbalanced token detected: unclosed '${stack[stack.length - 1]}'`;
    }
  }
  
  return null;
}

interface CodeSandboxProps {
  comment: ReviewComment;
  editedSuggestions: Record<string, string>;
  setEditedSuggestions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  applyingFixId: string | null;
  applySuccessId: string | null;
  applyError: Record<string, string>;
  branchName: string;
  onApplyCommit: (commentId: string, filePath: string, lineNumber: number) => void;
}

export function CodeSandbox({
  comment,
  editedSuggestions,
  setEditedSuggestions,
  applyingFixId,
  applySuccessId,
  applyError,
  branchName,
  onApplyCommit,
}: CodeSandboxProps) {
  if (!comment.suggestion) return null;

  const currentCode = editedSuggestions[comment.id] || '';
  const syntaxError = checkSyntax(currentCode, comment.filePath);

  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"></span>
          Interactive Sandbox Code Editor
        </span>
        <span className="text-[10px] text-slate-500 font-mono">Tweak suggested fix manually</span>
      </div>

      <div className="rounded-xl overflow-hidden border border-white/10 bg-[#090b14]/90 font-mono text-xs leading-6 shadow-2xl relative">
        {/* Sandbox Header */}
        <div className="flex justify-between items-center bg-[#0e111c] px-4 py-3 border-b border-white/5 text-[10px] font-bold text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            </span>
            <span className="border-l border-white/10 pl-2.5 ml-1 text-slate-500">sandbox.tsx</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentCode);
              }}
              className="hover:text-white transition flex items-center gap-1 text-slate-500 font-bold"
              title="Copy edited code"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy
            </button>
          </div>
        </div>

        {/* Code Editor Body */}
        <div className="flex min-h-[120px] max-h-[350px] overflow-y-auto">
          {/* Line Numbers */}
          <div className="select-none bg-[#0a0d16] text-[#334155] text-right px-3.5 py-4 border-r border-white/5 font-mono text-[11px] leading-5 flex flex-col">
            {(currentCode.split('\n')).map((_, index) => (
              <span key={index}>{index + 1}</span>
            ))}
          </div>
          {/* Editable Text Area */}
          <textarea
            value={currentCode}
            onChange={(e) => {
              const val = e.target.value;
              setEditedSuggestions(prev => ({ ...prev, [comment.id]: val }));
            }}
            className="flex-1 min-w-0 w-full bg-transparent text-slate-100 font-mono text-[11px] leading-5 p-4 outline-none resize-none border-none focus:ring-0 placeholder-slate-600 min-h-[120px]"
            style={{ whiteSpace: 'pre', overflowX: 'auto' }}
            spellCheck="false"
          />
        </div>

        {/* Commit Actions Panel */}
        <div className="bg-[#0b0e18] px-4 py-3 border-t border-white/5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 min-w-0">
            <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="truncate">Will push directly to branch `{branchName || 'main'}`</span>
          </span>
          <div className="flex items-center gap-3 justify-end shrink-0">
            {applySuccessId === comment.id ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Hotfix Pushed!
              </span>
            ) : (
              <button
                onClick={() => onApplyCommit(comment.id, comment.filePath, comment.lineNumber)}
                disabled={applyingFixId === comment.id || !!syntaxError}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition-all border ${
                  applyingFixId === comment.id || !!syntaxError
                    ? 'bg-indigo-600/20 text-indigo-400/40 border-indigo-500/10 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/40 hover:border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] cursor-pointer'
                }`}
              >
                {applyingFixId === comment.id ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400/20 border-t-indigo-200 animate-spin"></div>
                    Applying Hotfix...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Apply Commit
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Client-side Syntax Checking Banner */}
        {syntaxError && (
          <div className="bg-rose-500/10 px-4 py-2.5 border-t border-rose-500/20 text-[10px] font-semibold text-rose-400 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Syntax Warning: {syntaxError}</span>
          </div>
        )}

        {applyError[comment.id] && (
          <div className="bg-rose-500/10 px-4 py-2.5 border-t border-rose-500/20 text-[10px] font-semibold text-rose-400">
            Error: {applyError[comment.id]}
          </div>
        )}
      </div>
    </div>
  );
}
