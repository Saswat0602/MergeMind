export function QualityChart() {
  return (
    <div className="lg:col-span-8 glass-card p-6 border border-white/5 bg-slate-900/10 rounded-xl shadow-lg flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Historical Quality Trend</h3>
          <p className="text-[10px] text-slate-500 font-medium">Daily average severity rating timeline</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500"></span>
            Avg Severity Score
          </span>
        </div>
      </div>

      <div className="w-full h-[180px] mt-2 relative">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line x1="0" y1="20" x2="500" y2="20" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1="0" y1="60" x2="500" y2="60" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />

          {/* Chart Line & Area Area */}
          <path
            d="M 0 95 C 40 80, 40 40, 83 40 C 120 40, 130 82, 166 82 C 200 82, 220 18, 250 18 C 290 18, 300 50, 333 50 C 370 50, 380 32, 416 32 C 460 32, 460 45, 500 45 L 500 120 L 0 120 Z"
            fill="url(#area-grad)"
          />
          <path
            d="M 0 95 C 40 80, 40 40, 83 40 C 120 40, 130 82, 166 82 C 200 82, 220 18, 250 18 C 290 18, 300 50, 333 50 C 370 50, 380 32, 416 32 C 460 32, 460 45, 500 45"
            fill="none"
            stroke="url(#line-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Data Node Circles */}
          <circle cx="0" cy="95" r="4" fill="#818cf8" stroke="#070913" strokeWidth="1.5" />
          <circle cx="83" cy="40" r="4" fill="#818cf8" stroke="#070913" strokeWidth="1.5" />
          <circle cx="166" cy="82" r="4" fill="#a78bfa" stroke="#070913" strokeWidth="1.5" />
          <circle cx="250" cy="18" r="4" fill="#a78bfa" stroke="#070913" strokeWidth="1.5" />
          <circle cx="333" cy="50" r="4" fill="#ec4899" stroke="#070913" strokeWidth="1.5" />
          <circle cx="416" cy="32" r="4" fill="#ec4899" stroke="#070913" strokeWidth="1.5" />
          <circle cx="500" cy="45" r="4" fill="#ec4899" stroke="#070913" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 font-mono mt-1 px-1">
        <span>May 11</span>
        <span>May 12</span>
        <span>May 13</span>
        <span>May 14</span>
        <span>May 15</span>
        <span>May 16</span>
        <span>May 17 (Today)</span>
      </div>
    </div>
  );
}
