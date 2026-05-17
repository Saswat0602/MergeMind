export function ThreatHeatmap() {
  return (
    <div className="lg:col-span-4 glass-card p-6 border border-white/5 bg-slate-900/10 rounded-xl shadow-lg flex flex-col gap-4">
      <div>
        <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Threat Severity Heatmap</h3>
        <p className="text-[10px] text-slate-500 font-medium">Critical vulnerability density matrix</p>
      </div>

      <div className="grid grid-cols-7 gap-2.5 mt-2">
        {Array.from({ length: 28 }).map((_, i) => {
          const intensities = [
            'bg-emerald-500/10 border-emerald-500/20 text-emerald-500/40',
            'bg-emerald-500/20 border-emerald-500/30 text-emerald-500/50',
            'bg-amber-500/25 border-amber-500/30 text-amber-500/60',
            'bg-rose-500/30 border-rose-500/40 text-rose-400/80',
            'bg-rose-500/60 border-rose-500/70 text-rose-100 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
          ];
          const level = i % 5 === 0 ? 4 : i % 3 === 0 ? 2 : i % 7 === 0 ? 3 : i % 2 === 0 ? 1 : 0;
          const titleMsg = `Severity Alert Intensity Level ${level}`;

          return (
            <div
              key={i}
              title={titleMsg}
              className={`aspect-square w-full rounded-md border flex items-center justify-center text-[8px] font-black transition-all hover:scale-110 cursor-pointer ${intensities[level]}`}
            >
              {level > 2 ? '!' : ''}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mt-2 px-0.5">
        <span>Clean (0)</span>
        <span className="flex gap-1.5 items-center">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/30"></span>
          <span className="w-2.5 h-2.5 rounded bg-amber-500/25 border border-amber-500/30"></span>
          <span className="w-2.5 h-2.5 rounded bg-rose-500/50 border border-rose-500/60"></span>
        </span>
        <span>Critical (100)</span>
      </div>
    </div>
  );
}
