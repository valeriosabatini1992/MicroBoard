'use client';
import React from 'react';
import { LABEL, SHORT } from '@/lib/logic';
import { CatType, Sample } from '@/lib/types';
import { useDashboard } from '@/lib/store';

export const Chip = ({ cat }: { cat: CatType }) => {
  return <span className={`chip ${cat}`}>{LABEL[cat]}</span>;
};

export const Seg = ({ s }: { s: Sample }) => {
  const { confirmSample } = useDashboard();
  
  return (
    <div className="seg" role="group" aria-label="Classificazione">
      {(['sig', 'col'] as CatType[]).map(c => {
        const on = s.status === 'confirmed' && s.cat === c;
        const sg = s.status === 'pending' && s.proposal && s.proposal.cat === c;
        return (
          <button
            key={c}
            type="button"
            className={`seg-b ${c} ${on ? 'on' : ''} ${sg ? 'sugg' : ''}`}
            aria-pressed={on}
            onClick={() => confirmSample(s.id, c)}
          >
            {SHORT[c]}
            {sg && <small>suggerita</small>}
          </button>
        );
      })}
    </div>
  );
};
