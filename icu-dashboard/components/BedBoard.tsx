'use client';
import React from 'react';
import { useDashboard } from '@/lib/store';
import { CatType, Sample } from '@/lib/types';
import { BEDS } from '@/lib/logic';

export const BedBoard = () => {
  const { db, ui, setPid } = useDashboard();

  const getEffectiveCat = (s: Sample): CatType | 'pend' => {
    return s.status === 'confirmed' ? (s.cat as CatType) : 'pend';
  };

  const bedCards = Array.from({ length: BEDS }, (_, i) => {
    const n = i + 1;
    const p = db.patients.find(x => x.bed === n);

    if (!p) {
      return (
        <button key={`bed-${n}`} type="button" className="bed free" onClick={() => {
          // In a real app we'd open the modal here, but for now let's just trigger a global event or store action
          document.dispatchEvent(new CustomEvent('open-admit-modal', { detail: { bed: n } }));
        }}>
          <span className="bed-head"><span className="bed-no">Letto {n}</span></span>
          <span><span className="free-t">Libero</span><br/><span className="free-a">Assegna paziente</span></span>
        </button>
      );
    }

    const pos = db.samples.filter(s => s.pid === p.id && s.result === 'pos');
    const by = (c: CatType | 'pend') => pos.filter(s => getEffectiveCat(s) === c);
    
    const level = by('sig').length ? 'sig' : by('pend').length ? 'pend' : by('col').length ? 'col' : by('con').length ? 'con' : 'none';
    
    const infections = by('sig').sort((a, b) => b.date.localeCompare(a.date));
    const others = [...by('pend'), ...by('col'), ...by('con')].sort((a, b) => b.date.localeCompare(a.date));
    
    const getUnique = (arr: Sample[]) => {
      const seen = new Set();
      return arr.filter(s => {
        if (seen.has(s.org)) return false;
        seen.add(s.org);
        return true;
      });
    };

    const displaySamples = [...getUnique(infections), ...getUnique(others)].slice(0, 4);
    const totalCount = new Set([...infections, ...others].map(s => s.org)).size;
    const hasMore = totalCount > 4;
    const tagTxt: Record<string, string> = { sig: 'Infezione', pend: 'Incerto', col: 'Col.', con: 'Cont.' };

    const isMdro = (s: Sample) => s.result === 'pos' && s.mdro && !(s.status === 'confirmed' && s.cat === 'con');
    const mdros = Array.from(new Set(pos.filter(isMdro).map(s => s.mdro)));

    return (
      <button 
        key={`bed-${n}`} 
        type="button" 
        className={`bed ${level} ${ui.pid === p.id ? 'selected' : ''}`}
        onClick={() => setPid(p.id)}
      >
        <span className="bed-head">
          <span className="bed-no">Letto {n}</span>
          <span className="bed-id">{p.code}, {p.age} {p.sex}</span>
        </span>
        <span className="bed-sum">{p.summary}</span>
        
        {displaySamples.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', width: '100%' }}>
            {displaySamples.map((s, idx) => {
              const cat = getEffectiveCat(s);
              return (
                <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%' }}>
                  <div className={`org ${cat}`} style={{ width: '4px', height: '14px', flexShrink: 0, borderRadius: '2px', background: cat === 'sig' ? 'var(--sig)' : cat === 'pend' ? 'var(--pend)' : cat === 'col' ? 'var(--col-b)' : 'var(--con-b)' }} />
                  <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                    <span style={{ fontWeight: cat === 'sig' ? 700 : 500, color: cat === 'sig' ? 'var(--sig)' : 'inherit' }}>{s.org}</span>
                    {s.mdro && <span className="badge mdro" style={{ marginLeft: '4px', fontSize: '9px', padding: '1px 3px' }}>{s.mdro.replace(/ .*/,'')}</span>}
                  </div>
                  <div className="muted" style={{ width: '45px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left', fontSize: '11px' }}>{s.site}</div>
                  <div style={{ width: '55px', flexShrink: 0, textAlign: 'left' }}>
                    <span className={`chip ${cat}`} style={{ fontSize: '9px', padding: '1px 3px' }}>{tagTxt[cat]}</span>
                  </div>
                  <div className="muted" style={{ width: '45px', flexShrink: 0, textAlign: 'right', fontSize: '11px' }}>
                    {new Date(s.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </div>
                </div>
              );
            })}
            {hasMore && <div className="muted" style={{ fontSize: '11px', marginTop: '2px', textAlign: 'left' }}>+ altri {totalCount - 4} referti</div>}
          </div>
        ) : (
          <span className="bed-sum">Nessuna positività</span>
        )}

        {(mdros.length > 0 || p.iso || p.nodx) && (
          <span className="badges">
            {mdros.map(m => <span key={m} className="badge mdro">{m}</span>)}
            {p.iso && <span className="badge iso">Isolamento {p.iso.type.toLowerCase()}</span>}
            {p.nodx && <span className="badge nodx">Eziologia non identificata</span>}
          </span>
        )}
      </button>
    );
  });

  return <div className="beds">{bedCards}</div>;
};
