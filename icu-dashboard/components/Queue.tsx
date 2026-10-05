'use client';
import React from 'react';
import { useDashboard } from '@/lib/store';
import { Chip, Seg } from './DashboardComponents';
import { fmt } from '@/lib/logic';

const RANK: Record<string, number> = { sig: 0, val: 1, col: 2, con: 3 };

export const Queue = () => {
  const { db, setPid } = useDashboard();

  const items = db.samples
    .filter(s => s.result === 'pos' && s.status === 'pending' && db.patients.find(p => p.id === s.pid))
    .sort((a, b) => {
      const rankA = a.proposal ? RANK[a.proposal.cat] : 99;
      const rankB = b.proposal ? RANK[b.proposal.cat] : 99;
      return (rankA - rankB) || b.date.localeCompare(a.date);
    });

  if (!items.length) {
    return (
      <div className="empty">
        <strong>Nessuna positività da rivedere</strong>
        Le nuove positività compaiono qui finché un medico non le classifica.
      </div>
    );
  }

  return (
    <div className="list">
      {items.map(s => {
        const p = db.patients.find(x => x.id === s.pid)!;
        return (
          <article key={s.id} className={`qitem ${s.proposal?.cat === 'sig' ? 'sig' : ''}`}>
            <div className="qtop">
              <h3>{s.org}</h3>
              <button type="button" className="lnk" onClick={() => setPid(p.id)}>
                Letto {p.bed}, {p.code}
              </button>
            </div>
            <div className="tags">
              {s.proposal && <Chip cat={s.proposal.cat} />}
              <span className="tag">{s.site}, {s.test}</span>
              <span className="tag">{fmt(s.date)}</span>
              {s.mdro && <span className="badge mdro">{s.mdro}</span>}
              {s.setsTot && <span className="tag">{s.setsPos} set su {s.setsTot}</span>}
            </div>
            <p className="reason">{s.proposal?.reason}</p>
            {s.ab && <p className="ab">{s.ab}</p>}
            <Seg s={s} />
          </article>
        );
      })}
    </div>
  );
};
