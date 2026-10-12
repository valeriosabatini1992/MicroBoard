'use client';
import React, { useState } from 'react';
import { useDashboard } from '@/lib/store';
import { fmt, fmtDMY, daysSince, isPendingCulture } from '@/lib/logic';

export const Queue = () => {
  const { db, setPid, updateSample } = useDashboard();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quickOrg, setQuickOrg] = useState('');
  const [quickMdro, setQuickMdro] = useState('');

  const items = db.samples
    .filter(s => isPendingCulture(s) && db.patients.some(p => p.id === s.pid))
    .sort((a, b) => a.date.localeCompare(b.date)); // Oldest first so most mature cultures appear on top

  if (!items.length) {
    return (
      <div className="empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔬</div>
        <strong style={{ fontSize: '18px' }}>Nessun esame colturale in corso</strong>
        <p className="muted" style={{ maxWidth: '500px', margin: '8px auto 0' }}>
          Tutte le colture richieste risultano refertate. I nuovi esami colturali contrassegnati come &quot;In corso&quot; compariranno qui per essere monitorati e ricontrollati periodicamente.
        </p>
      </div>
    );
  }

  const handleMarkNeg = (sid: string) => {
    if (confirm('Confermi l\'esito NEGATIVO per questa coltura?')) {
      updateSample(sid, {
        result: 'neg',
        label: 'Coltura negativa (nessun germe patogeno)',
        status: 'confirmed',
        at: new Date().toISOString().slice(0, 10),
      });
    }
  };

  const handleSavePositive = (sid: string) => {
    if (!quickOrg.trim()) {
      alert('Inserisci il nome del microrganismo isolato.');
      return;
    }
    updateSample(sid, {
      result: 'pos',
      org: quickOrg.trim(),
      mdro: quickMdro,
      status: 'confirmed',
      cat: 'sig',
      at: new Date().toISOString().slice(0, 10),
    });
    setEditingId(null);
    setQuickOrg('');
    setQuickMdro('');
  };

  return (
    <div className="list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
            Colturali in corso da ricontrollare ({items.length})
          </h2>
          <p className="muted" style={{ margin: '3px 0 0', fontSize: '13.5px' }}>
            Esami colturali richiesti e attualmente in incubazione. Ricontrolla con il laboratorio per aggiornare gli esiti.
          </p>
        </div>
      </div>

      {items.map(s => {
        const p = db.patients.find(x => x.id === s.pid)!;
        const days = daysSince(s.date);
        const isEditing = editingId === s.id;

        const incubationText = 
          days === 0 ? 'Prelevato oggi (in incubazione)' :
          days === 1 ? 'In incubazione da 24 ore (1 giorno)' :
          `In incubazione da ${days} giorni`;

        return (
          <article key={s.id} className="qitem pend" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="qtop">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn small" 
                  style={{ fontWeight: 700, background: 'var(--ink)', color: '#fff', border: 0 }}
                  onClick={() => setPid(p.id)}
                >
                  Letto {p.bed}
                </button>
                <h3 style={{ fontSize: '16px', margin: 0 }}>
                  {p.code} <span className="muted" style={{ fontWeight: 400, fontSize: '13.5px' }}>({p.age} anni, {p.sex})</span>
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="chip pend" style={{ fontSize: '12px', padding: '3px 8px' }}>
                  ⏳ {incubationText}
                </span>
                <button 
                  type="button" 
                  className="lnk" 
                  style={{ fontSize: '13px' }} 
                  onClick={() => setPid(p.id)}
                >
                  Apri scheda letto →
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
              <span className="tag" style={{ background: '#fff', fontWeight: 600, color: 'var(--ink)' }}>
                Sito: {s.site}
              </span>
              <span className="tag" style={{ background: '#fff' }}>
                {s.test}
              </span>
              <span className="tag">
                Data prelievo: {fmtDMY(s.date)}
              </span>
              {s.label && (
                <span className="muted" style={{ fontStyle: 'italic', fontSize: '13px' }}>
                  &quot;{s.label}&quot;
                </span>
              )}
            </div>

            {isEditing ? (
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid var(--line)', marginTop: '4px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '13.5px' }}>Registra positività microbiologica:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Nome germe (es. Pseudomonas aeruginosa)"
                    value={quickOrg}
                    onChange={e => setQuickOrg(e.target.value)}
                    style={{ flex: 1, minWidth: '220px', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--line-strong)' }}
                  />
                  <select 
                    value={quickMdro} 
                    onChange={e => setQuickMdro(e.target.value)}
                    style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--line-strong)' }}
                  >
                    <option value="">Nessun MDRO</option>
                    <option value="MRSA">MRSA</option>
                    <option value="VRE">VRE</option>
                    <option value="ESBL">ESBL</option>
                    <option value="CRE/CPE">CRE/CPE</option>
                    <option value="Pseudomonas CR">Pseudomonas CR</option>
                    <option value="Acinetobacter CR">Acinetobacter CR</option>
                    <option value="Candida auris">Candida auris</option>
                  </select>
                  <button type="button" className="btn small primary" onClick={() => handleSavePositive(s.id)}>Salva esito positivo</button>
                  <button type="button" className="btn small" onClick={() => setEditingId(null)}>Annulla</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px', alignItems: 'center' }}>
                <span className="muted" style={{ fontSize: '13px' }}>Aggiorna referto:</span>
                <button 
                  type="button" 
                  className="btn small"
                  style={{ color: 'var(--sig)', borderColor: 'var(--sig)' }}
                  onClick={() => {
                    setEditingId(s.id);
                    setQuickOrg('');
                    setQuickMdro('');
                  }}
                >
                  + Registra Positività (Germe)
                </button>
                <button 
                  type="button" 
                  className="btn small"
                  onClick={() => handleMarkNeg(s.id)}
                >
                  ✓ Registra Negativo
                </button>
                <button 
                  type="button" 
                  className="btn small"
                  onClick={() => {
                    document.dispatchEvent(new CustomEvent('open-sample-modal', { detail: { pid: p.id } }));
                  }}
                >
                  Compila scheda completa
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};
