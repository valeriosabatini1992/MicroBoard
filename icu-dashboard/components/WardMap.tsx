'use client';
import React from 'react';
import { useDashboard } from '@/lib/store';
import { Patient } from '@/lib/types';
import layout from '@/lib/ward-layout.json';

export type IsolationType = 'Contatto' | 'Droplet' | 'Respiratorio' | 'Standard';

interface IsoConfig {
  id: IsolationType;
  label: string;
  subLabel?: string;
  color: string;
  bg: string;
  border: string;
}

const ISO_CONFIGS: Record<IsolationType, IsoConfig> = {
  Contatto: {
    id: 'Contatto',
    label: 'Contatto',
    color: '#B45309',
    bg: '#FEF3C7',
    border: '#F59E0B',
  },
  Droplet: {
    id: 'Droplet',
    label: 'Droplet',
    color: '#0369A1',
    bg: '#E0F2FE',
    border: '#38BDF8',
  },
  Respiratorio: {
    id: 'Respiratorio',
    label: 'Respiratorio',
    color: '#7E22CE',
    bg: '#F3E8FF',
    border: '#A855F7',
  },
  Standard: {
    id: 'Standard',
    label: 'Standard',
    subLabel: 'Immunodepressi',
    color: '#0F766E',
    bg: '#CCFBF1',
    border: '#14B8A6',
  },
};

// Render SVG icon by isolation type
const renderIsoIcon = (type: IsolationType, size = 16, color?: string) => {
  const iconColor = color || ISO_CONFIGS[type]?.color || 'currentColor';

  switch (type) {
    case 'Contatto':
      // Open hand / contact icon
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 11V6a2 2 0 0 0-4 0v5" />
          <path d="M14 10V4a2 2 0 0 0-4 0v7" />
          <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      );
    case 'Droplet':
      // Water droplets
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={iconColor}>
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      );
    case 'Respiratorio':
      // Face / surgical mask
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="8" width="16" height="10" rx="3" fill={iconColor} fillOpacity="0.25" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="7" y1="14.5" x2="17" y2="14.5" />
          <path d="M4 10.5C2 11 1 12 1 13s1 2 3 2.5" />
          <path d="M20 10.5c2 .5 3 1.5 3 2.5s-1 2-3 2.5" />
        </svg>
      );
    case 'Standard':
      // Shield (protective for immunosuppressed patients)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={iconColor}>
          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
        </svg>
      );
  }
};

const getIsolationType = (p?: Patient | null): IsolationType | null => {
  if (!p || !p.iso?.type) return null;
  const t = p.iso.type.trim().toLowerCase();
  if (t.includes('contatt')) return 'Contatto';
  if (t.includes('droplet')) return 'Droplet';
  if (t.includes('respirat') || t.includes('aereo') || t.includes('airborne')) return 'Respiratorio';
  if (t.includes('standard') || t.includes('immuno')) return 'Standard';
  return null;
};

// Word-wrapping function with strict boundaries and ellipsis
function wrapDiagnosis(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        if (lines.length >= maxLines) {
          // Reached max allowed lines: add ellipsis to last line
          let last = lines[lines.length - 1];
          if (last.length > maxCharsPerLine - 2) {
            last = last.slice(0, maxCharsPerLine - 3);
          }
          lines[lines.length - 1] = last.trimEnd() + '…';
          return lines;
        }
        currentLine = word;
      } else {
        // Single word exceeds line width
        lines.push(word.slice(0, maxCharsPerLine - 1) + '…');
        if (lines.length >= maxLines) return lines;
        currentLine = '';
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  } else if (currentLine && lines.length === maxLines) {
    let last = lines[lines.length - 1];
    if (last.length > maxCharsPerLine - 2) {
      last = last.slice(0, maxCharsPerLine - 3);
    }
    lines[lines.length - 1] = last.trimEnd() + '…';
  }

  return lines;
}

export const WardMap = () => {
  const { db, ui, setPid } = useDashboard();
  const [vx, vy, vw, vh] = layout.viewBox;

  const openFree = (bed: string) => {
    const n = Number(bed);
    document.dispatchEvent(new CustomEvent('open-admit-modal', { detail: { bed: Number.isNaN(n) ? bed : n } }));
  };

  return (
    <div className="ward-map-wrap">
      {/* Legend for isolation types with icons */}
      <div className="ward-legend" aria-label="Legenda tipi di isolamento">
        {(Object.keys(ISO_CONFIGS) as IsolationType[]).map(key => {
          const cfg = ISO_CONFIGS[key];
          return (
            <span key={key} className="ward-legend-item">
              <span 
                className="ward-legend-icon-badge" 
                style={{ background: cfg.bg, borderColor: cfg.border }}
              >
                {renderIsoIcon(key, 15, cfg.color)}
              </span>
              <strong style={{ color: cfg.color }}>{cfg.label}</strong>
              {cfg.subLabel && <span className="muted" style={{ fontSize: '11px' }}>({cfg.subLabel})</span>}
            </span>
          );
        })}
        <span className="ward-legend-item">
          <span className="ward-legend-icon-badge free-badge" />
          <span>Libero</span>
        </span>
      </div>

      <svg
        className="ward-map"
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        role="img"
        aria-label="Piantina del reparto con numero letto, isolamento e diagnosi"
      >
        {layout.beds.map(b => {
          const p = db.patients.find(x => String(x.bed) === b.id);
          const isOpen = b.kind === 'open_space';
          const nx = b.anchors.number.x;
          const ny = b.anchors.number.y;
          const cx = b.anchors.center.x;
          const selected = p && ui.pid === p.id;
          const isoType = getIsolationType(p);
          const isoCfg = isoType ? ISO_CONFIGS[isoType] : null;

          // Bed diagnosis text: prefer dx, fallback to summary
          const diagnosis = p ? (p.dx?.trim() || p.summary?.trim() || 'Nessuna diagnosi registrata') : '';

          if (!p) {
            return (
              <g
                key={b.id}
                className="wm-bed free"
                role="button"
                tabIndex={0}
                aria-label={`Letto ${b.label} libero - Clicca per assegnare`}
                onClick={() => openFree(b.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openFree(b.id); }}
              >
                <title>{`Letto ${b.label} · Libero`}</title>
                <rect className="wm-shape" x={b.x} y={b.y} width={b.w} height={b.h} fill="#FFFFFF" />
                
                {/* Only Bed Number */}
                <text className="wm-no" x={nx} y={ny}>{b.label}</text>

                {/* Free label centered without overflowing */}
                <text 
                  className="wm-free" 
                  x={isOpen ? b.x + b.w / 2 + 10 : cx} 
                  y={isOpen ? b.y + b.h / 2 + 5 : b.anchors.center.y + 6} 
                  textAnchor="middle"
                >
                  Libero
                </text>
              </g>
            );
          }

          // Text wrapping parameters calibrated to keep text strictly inside the box
          if (isOpen) {
            // Narrow open-space beds (10-13, h ≈ 41, w ≈ 143.6)
            // Layout: [Bed No] [Iso Icon] [Diagnosis 1 line]
            const isoBadgeWidth = isoCfg ? 22 : 0;
            const textStartX = b.x + 34 + (isoCfg ? 26 : 0);
            const availableTextWidth = b.x + b.w - textStartX - 8;
            const maxChars = Math.max(10, Math.floor(availableTextWidth / 6.2));
            const wrapped = wrapDiagnosis(diagnosis, maxChars, 1);

            return (
              <g
                key={b.id}
                className={`wm-bed occupied ${selected ? 'selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`Letto ${b.label}, ${diagnosis}${isoType ? ` - Isolamento ${isoType}` : ''}`}
                onClick={() => setPid(p.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPid(p.id); }}
              >
                <title>{`Letto ${b.label} · ${diagnosis}${isoType ? ` · Isolamento ${isoType}` : ''}`}</title>
                <rect className="wm-shape" x={b.x} y={b.y} width={b.w} height={b.h} fill="#FFFFFF" />
                
                {/* Only Bed Number */}
                <text className="wm-no-open" x={b.x + 7} y={b.y + b.h / 2 + 6}>{b.label}</text>

                {/* Isolation Symbol only (no text) */}
                {isoCfg && (
                  <g transform={`translate(${b.x + 32}, ${b.y + (b.h - 22) / 2})`}>
                    <rect width="22" height="22" rx="5" fill={isoCfg.bg} stroke={isoCfg.border} strokeWidth="1.3" />
                    <g transform="translate(3, 3)">
                      {renderIsoIcon(isoCfg.id, 16, isoCfg.color)}
                    </g>
                  </g>
                )}

                {/* Diagnosis strictly inside box */}
                {wrapped.map((line, i) => (
                  <text 
                    key={i} 
                    x={textStartX} 
                    y={b.y + b.h / 2 + 4} 
                    className="wm-dx-text"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          }

          // Standard rooms (h: 76-116, w: 114-140)
          // Top row: Bed Number on left, Isolation Symbol badge on right
          // Body: Patient diagnosis wrapped neatly on multiple lines inside box boundaries
          const badgeX = b.x + b.w - 28;
          const badgeY = b.y + 7;
          const textMarginX = b.x + 10;
          const maxLineWidth = b.w - 20;
          const maxCharsPerLine = Math.max(14, Math.floor(maxLineWidth / 6.4));
          const maxLines = b.h > 100 ? 4 : b.h > 80 ? 3 : 2;
          const wrapped = wrapDiagnosis(diagnosis, maxCharsPerLine, maxLines);
          const startTextY = b.y + 40;
          const lineHeight = 14;

          return (
            <g
              key={b.id}
              className={`wm-bed occupied ${selected ? 'selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`Letto ${b.label}, ${diagnosis}${isoType ? ` - Isolamento ${isoType}` : ''}`}
              onClick={() => setPid(p.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPid(p.id); }}
            >
              <title>{`Letto ${b.label} · ${diagnosis}${isoType ? ` · Isolamento ${isoType}` : ''}`}</title>
              {/* Clean white room background */}
              <rect className="wm-shape" x={b.x} y={b.y} width={b.w} height={b.h} fill="#FFFFFF" />
              
              {/* Only Bed Number */}
              <text className="wm-no" x={nx} y={ny}>{b.label}</text>

              {/* Isolation Symbol only (no words, compact badge) */}
              {isoCfg && (
                <g transform={`translate(${badgeX}, ${badgeY})`}>
                  <rect width="21" height="21" rx="5" fill={isoCfg.bg} stroke={isoCfg.border} strokeWidth="1.3" />
                  <g transform="translate(2.5, 2.5)">
                    {renderIsoIcon(isoCfg.id, 16, isoCfg.color)}
                  </g>
                </g>
              )}

              {/* Patient Diagnosis (wrapped lines, perfectly within box) */}
              <g className="wm-dx-group">
                {wrapped.map((line, idx) => (
                  <text
                    key={idx}
                    x={textMarginX}
                    y={startTextY + idx * lineHeight}
                    className="wm-dx-text"
                  >
                    {line}
                  </text>
                ))}
              </g>
            </g>
          );
        })}

        {/* Structure partitions and outlines */}
        <g stroke="var(--line-strong)" strokeWidth={1} strokeDasharray="5 4" fill="none" pointerEvents="none">
          {layout.structure.virtualLines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>
        <g fill="none" stroke="var(--ink)" strokeLinecap="square" pointerEvents="none">
          {layout.structure.rects.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} strokeWidth={2.4} />
          ))}
          {layout.structure.lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} strokeWidth={l.width >= 2 ? 2 : 1.5} />
          ))}
        </g>
      </svg>
    </div>
  );
};
