'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

interface ReviewComment {
  id: string;
  filePath: string;
  lineNumber: number;
  content: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'SECURITY' | 'PERFORMANCE' | 'STYLE';
  suggestion: string | null;
}

interface UsageLog {
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  cost: number;
}

interface Review {
  id: string;
  summary: string;
  severityScore: number;
  comments: ReviewComment[];
  usageLogs: UsageLog[];
  branchName?: string;
  commitMessage?: string;
  gitDiff?: string | null;
}

interface PRDetails {
  id: string;
  number: number;
  title: string;
  state: string;
  authorHandle: string;
  htmlUrl: string;
  repository: {
    fullName: string;
    name: string;
  };
  reviews: Review[];
}

export default function ReviewReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [pr, setPr] = useState<PRDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SECURITY' | 'PERFORMANCE' | 'STYLE' | 'DIFF'>('ALL');

  const fetchPRDetails = async () => {
    try {
      const res = await fetch(`/api/dashboard/prs/${resolvedParams.id}`);
      if (!res.ok) {
        throw new Error('API server returned error code. Loading mock diagnostics fallback.');
      }
      const data = await res.json();
      setPr(data);
    } catch (err) {
      console.warn('Could not fetch PR from API. Loading fallback high-fidelity mock report details.');
      loadMockReport();
    } finally {
      setLoading(false);
    }
  };

  const loadMockReport = () => {
    setPr({
      id: resolvedParams.id,
      number: 42,
      title: 'feat: Add JWT refresh token session strategy',
      state: 'open',
      authorHandle: 'saswat0602',
      htmlUrl: 'https://github.com/Saswat0602/MergeMind/pull/42',
      repository: {
        fullName: 'Saswat0602/MergeMind',
        name: 'MergeMind',
      },
      reviews: [
        {
          id: 'rev-1',
          summary: 'This pull request introduces a JWT refresh token rotation mechanism to secure user sessions. It adds endpoints for token refresh, session validation, and updates the database schema to track active refresh tokens securely in database model tables.',
          severityScore: 82,
          branchName: 'feature/auth-refresh',
          commitMessage: 'feat: Add JWT refresh token rotation mechanism',
          gitDiff: `diff --git a/apps/api/src/auth/auth.service.ts b/apps/api/src/auth/auth.service.ts
index b312ad9..fa3a21c 100644
--- a/apps/api/src/auth/auth.service.ts
+++ b/apps/api/src/auth/auth.service.ts
@@ -71,9 +71,9 @@ export class AuthService {
   }
 
   async validateSession(token: string) {
-    // TODO: Vulnerability here
-    const session = await this.prisma.$queryRawUnsafe(
-      \`SELECT * FROM "Session" WHERE token = '\${token}'\`
-    );
-    return session;
+    return this.prisma.session.findFirst({
+      where: { token },
+    });
   }
 
   async validateUser(email: string, pass: string): Promise<any> {
diff --git a/apps/api/src/auth/jwt.strategy.ts b/apps/api/src/auth/jwt.strategy.ts
index e3a11f2..c2e11d1 100644
--- a/apps/api/src/auth/jwt.strategy.ts
+++ b/apps/api/src/auth/jwt.strategy.ts
@@ -38,5 +38,5 @@ export class JwtStrategy extends PassportStrategy(Strategy) {
   async validate(payload: any) {
-    console.log('JWT auth verified successfully: ' + JSON.stringify(payload));
+    this.logger.debug(\`Validating token payload for user \${payload.sub}\`);
     return { userId: payload.sub, username: payload.username };
   }`,
          usageLogs: [
            {
              modelName: 'qwen/qwen-2.5-coder-32b-instruct',
              promptTokens: 4250,
              completionTokens: 820,
              totalTokens: 5070,
              latencyMs: 3420,
              cost: 0.0011,
            }
          ],
          comments: [
            {
              id: 'c-1',
              filePath: 'apps/api/src/auth/auth.service.ts',
              lineNumber: 74,
              content: 'SQL Injection Vulnerability. The SQL query uses string interpolation directly to fetch session details by token string. This allows malicious actors to craft SQL strings inside refresh token fields to bypass authentication blocks.',
              severity: 'HIGH',
              type: 'SECURITY',
              suggestion: 'async validateSession(token: string) {\n  return this.prisma.session.findFirst({\n    where: { token },\n  });\n}',
            },
            {
              id: 'c-2',
              filePath: 'apps/api/src/auth/auth.controller.ts',
              lineNumber: 19,
              content: 'Missing input validation DTO. The `/auth/refresh` endpoint accepts raw JSON body without proper DTO validation wrapper classes. Malformed fields could lead to server crash on null pointer checks.',
              severity: 'MEDIUM',
              type: 'SECURITY',
              suggestion: 'import { IsString, IsNotEmpty } from \'class-validator\';\n\nexport class RefreshTokenDto {\n  @IsString()\n  @IsNotEmpty()\n  token: string;\n}',
            },
            {
              id: 'c-3',
              filePath: 'apps/api/src/auth/auth.service.ts',
              lineNumber: 145,
              content: 'Performance Bug: Blocking Cryptographic Execution. The password comparison utilizes synchronous `bcrypt.compareSync` call blocks inside an async NestJS lifecycle handler. This will block Node.js single-thread Event Loop on high traffic volumes.',
              severity: 'MEDIUM',
              type: 'PERFORMANCE',
              suggestion: 'const isMatch = await bcrypt.compare(password, user.passwordHash);',
            },
            {
              id: 'c-4',
              filePath: 'apps/api/src/auth/jwt.strategy.ts',
              lineNumber: 41,
              content: 'Console.log found in production code. Avoid exposing internal authorization traces inside stdout logs. Use standard structured `Logger` class from `@nestjs/common`.',
              severity: 'LOW',
              type: 'STYLE',
              suggestion: 'this.logger.debug(`Validating token payload for user ${payload.sub}`);',
            }
          ]
        }
      ]
    });
  };

  useEffect(() => {
    fetchPRDetails();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070913] text-slate-100 flex-col gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400">Loading AI diagnostics details...</p>
      </div>
    );
  }

  if (!pr || pr.reviews.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070913] text-slate-100 px-6">
        <h2 className="text-2xl font-bold text-rose-500">Analysis Data Unavailable</h2>
        <p className="text-sm text-slate-400 mt-2">No completed AI reviews were found for this Pull Request.</p>
        <Link href="/" className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-sm border border-slate-700 transition">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const latestReview = pr.reviews[0];
  const comments = latestReview.comments;
  const usage = latestReview.usageLogs[0];

  const filteredComments = activeTab === 'ALL' 
    ? comments 
    : activeTab === 'DIFF'
      ? []
      : comments.filter(c => c.type === activeTab);

  const getScoreBadgeColor = (score: number) => {
    if (score > 70) return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    if (score > 30) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    }
  };

  const renderDiffLineByLine = (diffText: string | null | undefined) => {
    if (!diffText) {
      return (
        <div className="glass-card p-12 text-center text-slate-500 text-sm border border-white/5 rounded-xl bg-slate-900/10">
          No Git Diff text stored for this Pull Request.
        </div>
      );
    }

    const lines = diffText.split('\n');
    return (
      <div className="rounded-xl overflow-hidden border border-slate-800/80 font-mono text-xs bg-[#090b14] leading-6 shadow-xl">
        <div className="flex justify-between items-center bg-[#0d111d] px-4 py-2.5 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
          <span>Git Diff Native Patch</span>
          <span className="text-violet-400 font-bold">{lines.length} lines</span>
        </div>
        <div className="overflow-x-auto p-4 flex flex-col font-medium">
          {lines.map((line, idx) => {
            let lineClass = 'text-slate-300';
            let bgClass = '';
            
            if (line.startsWith('+') && !line.startsWith('+++')) {
              lineClass = 'text-emerald-400 font-semibold';
              bgClass = 'bg-emerald-500/5 px-2 -mx-2 rounded';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              lineClass = 'text-rose-400 font-semibold';
              bgClass = 'bg-rose-500/5 px-2 -mx-2 rounded';
            } else if (line.startsWith('@@')) {
              lineClass = 'text-cyan-400 font-bold';
              bgClass = 'bg-cyan-950/10 px-2 -mx-2 rounded text-[11px]';
            } else if (line.startsWith('diff --git') || line.startsWith('index ')) {
              lineClass = 'text-indigo-300 font-bold';
              bgClass = 'bg-indigo-950/20 px-2 -mx-2 rounded py-0.5 mt-2';
            }

            return (
              <pre key={idx} className={`${lineClass} ${bgClass} whitespace-pre`}>
                <code>{line}</code>
              </pre>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070913] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(255,255,255,0))] text-[#f3f4f6] px-6 py-10 md:px-12 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Decorative Grid Panel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Back button and PR header */}
      <header className="relative flex flex-col gap-4 border-b border-slate-800/40 pb-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-100 transition w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Hub
        </Link>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
              {pr.repository.fullName}
            </span>
            <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              #{pr.number}
            </span>
            {latestReview.branchName && (
              <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {latestReview.branchName}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-2 max-w-3xl">
            {pr.title}
          </h1>
          {latestReview.commitMessage && (
            <div className="mt-3 flex items-center gap-2 bg-slate-900/40 border border-slate-800/80 rounded-lg px-3.5 py-2 w-fit max-w-3xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Latest Commit</span>
              <span className="text-xs text-slate-300 font-mono italic">"{latestReview.commitMessage}"</span>
            </div>
          )}
        </div>
      </header>

      {/* Grid split */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Left Column: Stats and Summary */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Diagnostic score */}
          <div className={`glass-card p-6 flex flex-col items-center text-center gap-4 border border-white/5 bg-slate-900/10 rounded-xl shadow-lg`}>
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Severity Threat Rating</span>
            <div className="relative flex items-center justify-center mt-2">
              {/* Radial Glow Meter */}
              <div className={`w-32 h-32 rounded-full border-[8px] border-slate-800/50 flex flex-col items-center justify-center ${getScoreBadgeColor(latestReview.severityScore)}`}>
                <span className="text-3xl font-black">{latestReview.severityScore}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">/ 100</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-5">
              {latestReview.severityScore > 70 
                ? 'CRITICAL WARNING: Highly dangerous code patterns detected. Secure prior to merge.' 
                : latestReview.severityScore > 30 
                  ? 'MODERATE: Non-blocking performance bugs or minor validations need refactoring.' 
                  : 'CLEAN: Excellent code structure. Minor cleanups might apply.'}
            </p>
          </div>

          {/* AI Summary card */}
          <div className="glass-card p-6 flex flex-col gap-3 border border-white/5 bg-slate-900/10 rounded-xl shadow-lg">
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">AI Executive Review</span>
            <p className="text-sm text-slate-300 leading-6 font-medium">
              {latestReview.summary}
            </p>
          </div>

          {/* AI token usage metadata */}
          {usage && (
            <div className="glass-card p-6 flex flex-col gap-4 border border-white/5 bg-slate-900/10 rounded-xl shadow-lg">
              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Diagnostic Performance logs</span>
              
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between border-b border-slate-800/30 pb-2">
                  <span className="text-slate-500 font-medium">LLM Model:</span>
                  <span className="font-mono text-slate-300">{usage.modelName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 pb-2">
                  <span className="text-slate-500 font-medium">Latency Speed:</span>
                  <span className="text-slate-300 font-semibold">{(usage.latencyMs / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 pb-2">
                  <span className="text-slate-500 font-medium">Token Footprint:</span>
                  <span className="text-slate-300 font-semibold">{usage.totalTokens.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">OpenRouter Spend:</span>
                  <span className="text-violet-400 font-bold">${usage.cost.toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Code recommendations */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Tab Selector */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800/50 pb-4">
            {(['ALL', 'SECURITY', 'PERFORMANCE', 'STYLE', 'DIFF'] as const).map(tab => {
              const getTabStyle = (t: typeof tab) => {
                if (activeTab !== t) return 'text-slate-400 hover:text-slate-200 bg-slate-800/20 hover:bg-slate-800/40 border-transparent';
                if (t === 'SECURITY') return 'text-rose-400 bg-rose-400/10 border-rose-500/30';
                if (t === 'PERFORMANCE') return 'text-amber-400 bg-amber-400/10 border-amber-500/30';
                if (t === 'STYLE') return 'text-violet-400 bg-violet-400/10 border-violet-500/30';
                if (t === 'DIFF') return 'text-indigo-400 bg-indigo-400/10 border-indigo-500/30';
                return 'text-blue-400 bg-blue-400/10 border-blue-500/30';
              };

              const getCount = (t: typeof tab) => {
                if (t === 'ALL') return comments.length;
                if (t === 'DIFF') return 'Full';
                return comments.filter(c => c.type === t).length;
              };

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold border rounded-lg transition-all flex items-center gap-1.5 ${getTabStyle(tab)}`}
                >
                  {tab === 'DIFF' ? 'Git Patch Diff' : tab}
                  <span className="text-[10px] opacity-75 font-black border-l pl-1.5 ml-0.5 border-current/20">{getCount(tab)}</span>
                </button>
              );
            })}
          </div>

          {/* Recommendations list */}
          <div className="flex flex-col gap-6">
            {activeTab === 'DIFF' ? (
              renderDiffLineByLine(latestReview.gitDiff)
            ) : filteredComments.length === 0 ? (
              <div className="glass-card p-12 text-center text-slate-500 text-sm border border-white/5 bg-slate-900/10 rounded-xl">
                No active recommendations matching this diagnostics filter.
              </div>
            ) : (
              filteredComments.map(c => {
                const getGlow = (severity: string) => {
                  if (severity === 'HIGH') return 'border-l-4 border-l-rose-500';
                  if (severity === 'MEDIUM') return 'border-l-4 border-l-amber-500';
                  return 'border-l-4 border-l-violet-400';
                };

                return (
                  <div key={c.id} className={`glass-card p-6 flex flex-col gap-4 border border-white/5 bg-slate-900/10 rounded-xl shadow-lg ${getGlow(c.severity)}`}>
                    
                    {/* Comment card title */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white leading-6 truncate max-w-md">
                          {c.filePath}
                        </h4>
                        <span className="text-xs text-slate-500 font-mono">Line {c.lineNumber}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          {c.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getSeverityBadgeColor(c.severity)}`}>
                          {c.severity}
                        </span>
                      </div>
                    </div>

                    {/* Comment description */}
                    <p className="text-sm text-slate-300 leading-6 font-medium">
                      {c.content}
                    </p>

                    {/* Commit suggestion block */}
                    {c.suggestion && (
                      <div className="flex flex-col gap-2 mt-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suggested Fix</span>
                        <div className="rounded-lg overflow-hidden border border-slate-800 font-mono text-xs bg-slate-950/80">
                          <div className="flex justify-between items-center bg-slate-900/60 px-4 py-2 border-b border-slate-800 text-[10px] font-bold text-slate-500">
                            <span>REPLACEMENT CODE block</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(c.suggestion || '')}
                              className="hover:text-white transition"
                              title="Copy code"
                            >
                              Copy Suggestion
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-slate-300 leading-5">
                            <code>{c.suggestion}</code>
                          </pre>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
