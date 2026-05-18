import React, { useState } from 'react';

interface TimelinePoint {
  date: string;
  tokens: number;
  cost: number;
}

interface DashboardChartsProps {
  stats: {
    totalPrs: number;
    activeRepositories: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    totalTokens: number;
    totalCost: number;
    dailyTimeline?: TimelinePoint[];
  } | null;
}

export function DashboardCharts({ stats }: DashboardChartsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!stats) return null;

  // 1. Concentric Severity Rings Calculations
  const high = stats.highSeverityCount || 0;
  const medium = stats.mediumSeverityCount || 0;
  const low = stats.lowSeverityCount || 0;
  const totalFindings = high + medium + low;

  // Radius for concentric rings
  const outerRadius = 75;  // Low (Success - green)
  const middleRadius = 55; // Medium (Warning - orange)
  const innerRadius = 35;  // High (Danger - red)

  const calcDash = (radius: number, count: number) => {
    const circ = 2 * Math.PI * radius;
    if (totalFindings === 0) return { strokeDasharray: `${circ}`, strokeDashoffset: circ };
    const pct = count / totalFindings;
    const offset = circ - pct * circ;
    return {
      strokeDasharray: `${circ}`,
      strokeDashoffset: offset === circ ? circ - 2 : offset, // show tiny tick if > 0
    };
  };

  // 2. 7-Day Area Chart Calculations
  const defaultTimeline: TimelinePoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0],
      tokens: 0,
      cost: 0.0,
    };
  });

  const timeline = stats.dailyTimeline && stats.dailyTimeline.length === 7 
    ? stats.dailyTimeline 
    : defaultTimeline;

  const maxCost = Math.max(...timeline.map(t => t.cost), 0.001);
  const chartWidth = 540;
  const chartHeight = 170;
  const paddingX = 40;
  const paddingY = 20;

  const points = timeline.map((d, index) => {
    const x = paddingX + index * ((chartWidth - 2 * paddingX) / 6);
    const y = chartHeight - paddingY - (d.cost / maxCost) * (chartHeight - 2 * paddingY);
    return { x, y, date: d.date, cost: d.cost, tokens: d.tokens };
  });

  // SVG Area path string
  const areaPath = points.length > 0 
    ? `M ${points[0].x} ${chartHeight - paddingY} ` +
      points.map(p => `L ${p.x} ${p.y}`).join(' ') +
      ` L ${points[points.length - 1].x} ${chartHeight - paddingY} Z`
    : '';

  // SVG Line path string
  const linePath = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const formatDate = (dateStr: string) => {
    try {
      const [, month, day] = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month, 10) - 1]} ${day}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: 20,
      width: '100%',
      marginBottom: 6,
    }}>
      {/* ── Severity Distribution Concentric Chart ── */}
      <div className="card" style={{
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(22,25,32,0.7) 100%)',
        border: '1px solid var(--border-soft)',
      }}>
        {/* Glow Filter */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Security Audit Standards
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
            Concentric finding proportions by severity check
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28, justifyContent: 'center', flex: 1 }}>
          {/* Donut SVG Ring */}
          <div style={{ width: 170, height: 170, position: 'relative', flexShrink: 0 }}>
            <svg width="170" height="170" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
              {/* Concentric Backing Circles */}
              <circle cx="100" cy="100" r={outerRadius} fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="10" />
              <circle cx="100" cy="100" r={middleRadius} fill="none" stroke="rgba(245, 158, 11, 0.05)" strokeWidth="10" />
              <circle cx="100" cy="100" r={innerRadius} fill="none" stroke="rgba(239, 68, 68, 0.05)" strokeWidth="10" />

              {/* Glowing Segments */}
              {/* Outer circle: Low (Emerald green) */}
              <circle
                cx="100"
                cy="100"
                r={outerRadius}
                fill="none"
                stroke="var(--success)"
                strokeWidth="10"
                strokeLinecap="round"
                {...calcDash(outerRadius, low)}
                filter="url(#glow-green)"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />

              {/* Middle circle: Medium (Warning orange) */}
              <circle
                cx="100"
                cy="100"
                r={middleRadius}
                fill="none"
                stroke="var(--warning)"
                strokeWidth="10"
                strokeLinecap="round"
                {...calcDash(middleRadius, medium)}
                filter="url(#glow-orange)"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />

              {/* Inner circle: High (Danger red) */}
              <circle
                cx="100"
                cy="100"
                r={innerRadius}
                fill="none"
                stroke="var(--danger)"
                strokeWidth="10"
                strokeLinecap="round"
                {...calcDash(innerRadius, high)}
                filter="url(#glow-red)"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                {totalFindings}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                Warnings
              </span>
            </div>
          </div>

          {/* Legends */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 100 }}>
            {/* Low Severity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>Low Severity</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{low} findings</span>
              </div>
            </div>

            {/* Medium Severity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--warning)', boxShadow: '0 0 8px var(--warning)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>Medium Severity</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{medium} findings</span>
              </div>
            </div>

            {/* High Severity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--danger)', boxShadow: '0 0 8px var(--danger)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>High Severity</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{high} findings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7-Day API Cost Timeline spline area Chart ── */}
      <div className="card" style={{
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(22,25,32,0.7) 100%)',
        border: '1px solid var(--border-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              AI Pipeline Compute Cost
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
              Weekly API spend and openrouter token consumption
            </p>
          </div>
          <div style={{
            fontSize: 10,
            background: 'var(--accent-dim)',
            color: '#818cf8',
            borderRadius: 12,
            padding: '3px 9px',
            fontWeight: 700,
            border: '1px solid rgba(99,102,241,0.2)',
          }}>
            7 Days Audit Trend
          </div>
        </div>

        {/* Spline Area SVG chart */}
        <div style={{ position: 'relative', height: 170, width: '100%', marginTop: 8 }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.00" />
              </linearGradient>
              <filter id="glow-line" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid Line Baselines */}
            <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1={paddingX} y1={(chartHeight) / 2} x2={chartWidth - paddingX} y2={(chartHeight) / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            {/* Filled Area under line */}
            <path d={areaPath} fill="url(#area-gradient)" />

            {/* Main Spline cost Line */}
            <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="3" filter="url(#glow-line)" />

            {/* Anchor glowing interactive Dots */}
            {points.map((p, index) => {
              const isHovered = hoveredIdx === index;
              return (
                <g key={index}>
                  {/* Invisible broad pointer layer */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="15"
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIdx(index)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                  {/* Glow ring */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 8 : 4}
                    fill="var(--accent)"
                    style={{
                      transition: 'all 0.15s ease-out',
                      opacity: isHovered ? 0.4 : 0,
                    }}
                  />
                  {/* Internal anchor core */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 4.5 : 3}
                    fill="#ffffff"
                    stroke="var(--accent)"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    style={{ transition: 'all 0.15s ease-out', cursor: 'pointer' }}
                  />
                  {/* Date labels on horizontal axis */}
                  <text
                    x={p.x}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    fill="var(--text-secondary)"
                    style={{ fontSize: 9, fontFamily: 'monospace' }}
                  >
                    {formatDate(p.date)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating glassmorphic tooltip */}
          {hoveredIdx !== null && (
            <div style={{
              position: 'absolute',
              top: Math.max(points[hoveredIdx].y - 65, 0),
              left: Math.min(Math.max(points[hoveredIdx].x - 65, 10), chartWidth - 140),
              background: 'rgba(22, 25, 32, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 8,
              padding: '6px 10px',
              pointerEvents: 'none',
              boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              zIndex: 10,
              minWidth: 120,
              transition: 'all 0.1s ease-out',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)' }}>
                {formatDate(points[hoveredIdx].date)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#ffffff' }}>
                ${points[hoveredIdx].cost.toFixed(4)}
              </span>
              <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                {points[hoveredIdx].tokens.toLocaleString()} tokens
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
