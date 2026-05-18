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

  // 2. 7-Day spline cost curve Line Chart Calculations
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
      {/* ── Severity Distribution Concentric Chart (Flat Design) ── */}
      <div className="card" style={{
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-soft)',
        boxShadow: 'none',
      }}>
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
              <circle cx="100" cy="100" r={outerRadius} fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="10" />
              <circle cx="100" cy="100" r={middleRadius} fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="10" />
              <circle cx="100" cy="100" r={innerRadius} fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="10" />

              {/* Flat Clean Segments (No Glow Filters) */}
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

          {/* Legends (Flat Design) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 100 }}>
            {/* Low Severity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>Low Severity</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{low} findings</span>
              </div>
            </div>

            {/* Medium Severity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>Medium Severity</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{medium} findings</span>
              </div>
            </div>

            {/* High Severity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>High Severity</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{high} findings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7-Day API Cost Timeline spline Line Chart (Flat Design) ── */}
      <div className="card" style={{
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-soft)',
        boxShadow: 'none',
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
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            borderRadius: 12,
            padding: '3px 9px',
            fontWeight: 700,
            border: '1px solid var(--border-soft)',
          }}>
            7 Days Audit Trend
          </div>
        </div>

        {/* Flat SVG Line chart (No linear gradient fills, no glow filters) */}
        <div style={{ position: 'relative', height: 170, width: '100%', marginTop: 8 }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            {/* Grid Line Baselines */}
            <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1={paddingX} y1={(chartHeight) / 2} x2={chartWidth - paddingX} y2={(chartHeight) / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            {/* Flat Cost Line (No Filter) */}
            <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" />

            {/* Flat Dots */}
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
                  {/* Flat core dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 5 : 3.5}
                    fill={isHovered ? 'var(--accent)' : '#ffffff'}
                    stroke="var(--accent)"
                    strokeWidth="1.5"
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

          {/* Floating flat tooltip */}
          {hoveredIdx !== null && (
            <div style={{
              position: 'absolute',
              top: Math.max(points[hoveredIdx].y - 65, 0),
              left: Math.min(Math.max(points[hoveredIdx].x - 65, 10), chartWidth - 140),
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-soft)',
              borderRadius: 6,
              padding: '6px 10px',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
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
              <span style={{ fontSize: 8.5, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {points[hoveredIdx].tokens.toLocaleString()} tokens
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
