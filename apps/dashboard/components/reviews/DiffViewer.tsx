interface DiffViewerProps {
  gitDiff: string | null | undefined;
}

export function DiffViewer({ gitDiff }: DiffViewerProps) {
  if (!gitDiff) {
    return (
      <div className="glass-card p-12 text-center text-slate-500 text-sm border border-white/5 rounded-xl bg-slate-900/10">
        No Git Diff text stored for this Pull Request.
      </div>
    );
  }

  const lines = gitDiff.split('\n');

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
}
