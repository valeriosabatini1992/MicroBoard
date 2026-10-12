'use client';
import React, { useEffect, useState } from 'react';
import { useDashboard } from '@/lib/store';
import { BEDS, fmt, fmtDMY, daysSince, LABEL, isPendingCulture } from '@/lib/logic';
import { CatType, Sample } from '@/lib/types';
import { Chip } from './DashboardComponents';

export const PatientDetailModal = () => {
  const { 
    db, 
    ui, 
    setPid, 
    setConfirmFree, 
    startIsolation, 
    stopIsolation, 
    freeBed, 
    confirmSample, 
    reopenSample,
    updateSample 
  } = useDashboard();

  const [editingSampleId, setEditingSampleId] = useState<string | null>(null);
  const [quickOrg, setQuickOrg] = useState('');
  const [quickMdro, setQuickMdro] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ui.pid) {
        setPid(null);
        setConfirmFree(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ui.pid, setPid, setConfirmFree]);

  if (!ui.pid) return null;

  const currentPatient = db.patients.find(x => x.id === ui.pid);
  const ss = currentPatient ? db.samples.filter(s => s.pid === currentPatient.id).sort((a, b) => b.date.localeCompare(a.date)) : [];

  const isPos = (s: Sample) => s.result === 'pos';
  const isMdro = (s: Sample) => isPos(s) && s.mdro && !(s.status === 'confirmed' && s.cat === 'con');
  const needsIso = currentPatient && !currentPatient.iso && ss.some(isMdro);

  const getEffectiveCat = (s: Sample): CatType | 'pend' => {
    return s.status === 'confirmed' ? (s.cat as CatType) : 'pend';
  };

  const handleQuickReferta = (sid: string) => {
    setEditingSampleId(sid);
    setQuickOrg('');
    setQuickMdro('');
  };

  const handleSavePositive = (sid: string) => {
    if (!quickOrg.trim()) {
      alert('Inserisci il nome del germe isolato.');
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
    setEditingSampleId(null);
  };

  const handleSaveNegative = (sid: string) => {
    updateSample(sid, {
      result: 'neg',
      label: 'Coltura negativa (nessun germe patogeno)',
      status: 'confirmed',
      at: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop" 
        onClick={() => { setPid(null); setConfirmFree(null); }}
        aria-hidden="true"
      />

      {/* Centered Large Modal Dialog */}
      <div 
        className="patient-modal-dialog" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-patient-title"
      >
        {/* Left Column: Rapid Bed Selector */}
        <aside className="bed-quick-nav" aria-label="Elenco rapido letti">
          <div className="bed-nav-header">
            <h3>Letti T.I.</h3>
            <span className="muted" style={{ fontSize: '12px' }}>12 Letti</span>
          </div>
          <div className="bed-nav-list">
            {Array.from({ length: BEDS }, (_, i) => i + 1).map(bedNum => {
              const p = db.patients.find(x => x.bed === bedNum);
              const isSelected = currentPatient && currentPatient.bed === bedNum;
              
              if (!p) {
                return (
                  <button
                    key={`nav-bed-${bedNum}`}
                    type="button"
                    className="bed-nav-item free"
                    onClick={() => {
                      document.dispatchEvent(new CustomEvent('open-admit-modal', { detail: { bed: bedNum } }));
                    }}
                    title={`Letto ${bedNum} libero - Clicca per assegnare`}
                  >
                    <div className="nav-bed-num">L{bedNum}</div>
                    <div className="nav-bed-info">
                      <span className="nav-bed-status muted">Libero</span>
                    </div>
                  </button>
                );
              }

              // Check infections / status for indicator dot
              const pSamples = db.samples.filter(s => s.pid === p.id && s.result === 'pos');
              const hasSig = pSamples.some(s => getEffectiveCat(s) === 'sig');
              const hasCol = pSamples.some(s => getEffectiveCat(s) === 'col');
              const hasPend = db.samples.some(s => s.pid === p.id && (isPendingCulture(s) || getEffectiveCat(s) === 'pend'));
              const hasMdro = pSamples.some(isMdro);

              const dotColor = hasSig ? 'var(--sig)' : hasCol ? 'var(--col-b)' : hasPend ? 'var(--pend)' : 'var(--line-strong)';

              return (
                <button
                  key={`nav-bed-${bedNum}`}
                  type="button"
                  className={`bed-nav-item ${isSelected ? 'active' : ''}`}
                  onClick={() => { setPid(p.id); setConfirmFree(null); }}
                  aria-current={isSelected ? 'true' : undefined}
                >
                  <div className="nav-bed-num">
                    L{bedNum}
                    <span 
                      className="nav-status-dot" 
                      style={{ background: dotColor }} 
                      title={hasSig ? 'Infezione attiva' : hasCol ? 'Colonizzazione' : hasPend ? 'Esami in corso' : 'Stabile'} 
                    />
                  </div>
                  <div className="nav-bed-info">
                    <span className="nav-bed-code">{p.code}</span>
                    <span className="nav-bed-summary muted">{p.summary}</span>
                  </div>
                  <div className="nav-bed-badges">
                    {hasMdro && <span className="mini-badge mdro" title="MDRO">M</span>}
                    {p.iso && <span className="mini-badge iso" title={`Isolamento ${p.iso.type}`}>I</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Area: Patient Content */}
        <section className="patient-modal-main">
          {currentPatient ? (
            <>
              {/* Header Bar */}
              <div className="p-modal-header">
                <div className="p-modal-header-left">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <h2 id="modal-patient-title" style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
                      Letto {currentPatient.bed}
                    </h2>
                    <span className="p-header-badge">{currentPatient.code}</span>
                    <span className="muted" style={{ fontSize: '14px' }}>
                      {currentPatient.age} anni, {currentPatient.sex} • Ricoverato il {fmtDMY(currentPatient.admitted)} (Giorno {daysSince(currentPatient.admitted) + 1})
                    </span>
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '14px' }}>
                    <strong>{currentPatient.summary}</strong>
                    {currentPatient.dx && <span className="muted"> — {currentPatient.dx}</span>}
                  </div>
                </div>

                <div className="p-modal-header-actions">
                  <button 
                    type="button" 
                    className="btn small primary"
                    onClick={() => {
                      document.dispatchEvent(new CustomEvent('open-sample-modal', { detail: { pid: currentPatient.id } }));
                    }}
                  >
                    + Nuovo esame
                  </button>

                  {ui.confirmFree === currentPatient.id ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span className="muted" style={{ fontSize: '12px' }}>Sicuro?</span>
                      <button type="button" className="btn small danger" onClick={() => freeBed(currentPatient.id)}>Conferma</button>
                      <button type="button" className="btn small" onClick={() => setConfirmFree(null)}>Annulla</button>
                    </div>
                  ) : (
                    <button type="button" className="btn small" onClick={() => setConfirmFree(currentPatient.id)}>Libera letto</button>
                  )}

                  <button 
                    type="button" 
                    className="btn-close-modal" 
                    onClick={() => { setPid(null); setConfirmFree(null); }}
                    aria-label="Chiudi finestra"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Sub-Header: Isolation & Alert */}
              <div className="p-modal-sub">
                {needsIso && (
                  <div className="alert" style={{ width: '100%', marginBottom: '8px' }}>
                    <span><strong>⚠️ Germe MDRO rilevato senza isolamento attivo!</strong></span>
                    <button type="button" className="btn small" onClick={() => startIsolation(currentPatient.id, 'Contatto')}>
                      Avvia isolamento di contatto
                    </button>
                  </div>
                )}

                <div className="iso-compact-bar">
                  {currentPatient.iso ? (
                    <div className="iso-box on" style={{ width: '100%', padding: '8px 12px' }}>
                      <div>
                        <strong>🛡️ Isolamento {currentPatient.iso.type.toLowerCase()}</strong>, giorno {daysSince(currentPatient.iso.since) + 1} (dal {fmtDMY(currentPatient.iso.since)})
                        <span className="muted" style={{ marginLeft: '8px' }}>— {currentPatient.iso.reason}</span>
                      </div>
                      <button type="button" className="btn small" onClick={() => stopIsolation(currentPatient.id)}>Revoca</button>
                    </div>
                  ) : (
                    <div className="iso-box" style={{ width: '100%', padding: '6px 12px' }}>
                      <span className="muted" style={{ fontSize: '13.5px' }}>Nessun isolamento attivo</span>
                      <div className="btn-row" style={{ margin: 0 }}>
                        <span className="muted" style={{ fontSize: '13px' }}>Attiva:</span>
                        {['Contatto', 'Droplet', 'Aereo'].map(t => (
                          <button key={t} type="button" className="btn small" onClick={() => startIsolation(currentPatient.id, t)}>{t}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Table: Compact Single-Line Exam Records */}
              <div className="p-modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                    Referti microbiologici ({ss.length})
                  </h3>
                  <span className="muted" style={{ fontSize: '13px' }}>
                    Tutti i dati compattati su riga singola con classificazione rapida
                  </span>
                </div>

                {ss.length > 0 ? (
                  <div className="compact-exam-table-wrap">
                    {/* Table Column Headers */}
                    <div className="exam-row-header">
                      <div className="c-col c-date">DATA</div>
                      <div className="c-col c-site">SITO / CAMPIONE</div>
                      <div className="c-col c-test">ESAME</div>
                      <div className="c-col c-result">ESITO / MICRORGANISMO / ANTIBIOGRAMMA</div>
                      <div className="c-col c-cat">INTERPRETAZIONE</div>
                      <div className="c-col c-actions">AZIONI</div>
                    </div>

                    {/* Table Rows */}
                    <div className="exam-row-list">
                      {ss.map(s => {
                        const isPending = s.result === 'pending';
                        const isNegative = s.result === 'neg';
                        const isPositive = s.result === 'pos';
                        const effectiveCat = getEffectiveCat(s);

                        const rowClass = isPositive 
                          ? `exam-row ${effectiveCat}` 
                          : isNegative 
                          ? 'exam-row neg' 
                          : 'exam-row pend';

                        const isEditingThis = editingSampleId === s.id;

                        return (
                          <div key={s.id} className="exam-row-container">
                            <div className={rowClass}>
                              {/* Date */}
                              <div className="c-col c-date font-mono">
                                {fmtDMY(s.date)}
                              </div>

                              {/* Site */}
                              <div className="c-col c-site">
                                <span className="site-pill">{s.site}</span>
                              </div>

                              {/* Test */}
                              <div className="c-col c-test muted" title={s.test}>
                                {s.test}
                              </div>

                              {/* Result & Organism */}
                              <div className="c-col c-result">
                                {isPositive && (
                                  <div className="c-res-line">
                                    <strong className="c-org-name" style={{ color: effectiveCat === 'sig' ? 'var(--sig)' : 'inherit' }}>
                                      {s.org}
                                    </strong>
                                    {s.mdro && <span className="badge mdro mini-tag">{s.mdro}</span>}
                                    {s.setsTot && <span className="mini-tag muted">{s.setsPos}/{s.setsTot} set</span>}
                                    {s.cfu && <span className="mini-tag muted">{s.cfu >= 1000 ? `10^${Math.round(Math.log10(s.cfu))}` : s.cfu} UFC</span>}
                                    {s.clinical && <span className="mini-tag alert-tag">Sospetto clinico</span>}
                                    {s.ab && (
                                      <span className="c-ab-text muted" title={s.ab}>
                                        • {s.ab}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {isNegative && (
                                  <div className="c-res-line">
                                    <span className="badge-neg">Negativo</span>
                                    <span className="muted" style={{ fontSize: '13px' }}>
                                      {s.label || 'Nessuna crescita microbica'}
                                    </span>
                                  </div>
                                )}

                                {isPending && (
                                  <div className="c-res-line">
                                    <span className="badge-pend">⏳ In corso</span>
                                    <span className="muted" style={{ fontSize: '13px' }}>
                                      {s.label || 'In attesa di referto microbiologico'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Category / Interpretation */}
                              <div className="c-col c-cat">
                                {isPositive ? (
                                  <Chip cat={effectiveCat === 'pend' ? 'val' : effectiveCat} />
                                ) : isPending ? (
                                  <span className="chip pend" style={{ fontSize: '11px', padding: '1px 6px' }}>In corso</span>
                                ) : (
                                  <span className="chip con" style={{ fontSize: '11px', padding: '1px 6px' }}>Negativo</span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="c-col c-actions">
                                {isPositive && (
                                  <select 
                                    className="quick-cat-select"
                                    value={s.status === 'confirmed' ? s.cat! : (s.proposal?.cat || 'val')}
                                    onChange={(e) => confirmSample(s.id, e.target.value as CatType)}
                                    title="Modifica classificazione"
                                  >
                                    <option value="sig">🔴 Infezione</option>
                                    <option value="col">🟡 Colonizz.</option>
                                    <option value="con">⚪ Contam.</option>
                                    <option value="val">🔵 Incerto</option>
                                  </select>
                                )}

                                {isPending && (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button 
                                      type="button" 
                                      className="btn small" 
                                      style={{ fontSize: '11px', padding: '2px 5px', color: 'var(--sig)', borderColor: 'var(--sig)' }}
                                      onClick={() => handleQuickReferta(s.id)}
                                      title="Registra germe isolato"
                                    >
                                      + Pos
                                    </button>
                                    <button 
                                      type="button" 
                                      className="btn small" 
                                      style={{ fontSize: '11px', padding: '2px 5px' }}
                                      onClick={() => handleSaveNegative(s.id)}
                                      title="Registra come negativo"
                                    >
                                      Neg
                                    </button>
                                  </div>
                                )}

                                {isNegative && (
                                  <span className="muted" style={{ fontSize: '12px' }}>—</span>
                                )}
                              </div>
                            </div>

                            {/* Inline quick editor if user clicks + Pos for a pending sample */}
                            {isEditingThis && (
                              <div className="inline-quick-edit">
                                <span style={{ fontWeight: 600, fontSize: '13px' }}>Referta positività:</span>
                                <input 
                                  type="text" 
                                  placeholder="Nome microrganismo (es. S. aureus)"
                                  value={quickOrg}
                                  onChange={e => setQuickOrg(e.target.value)}
                                  style={{ padding: '4px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--line-strong)', flex: 1 }}
                                />
                                <select 
                                  value={quickMdro} 
                                  onChange={e => setQuickMdro(e.target.value)}
                                  style={{ padding: '4px 6px', fontSize: '12.5px', borderRadius: '4px', border: '1px solid var(--line-strong)' }}
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
                                <button type="button" className="btn small primary" onClick={() => handleSavePositive(s.id)}>Salva</button>
                                <button type="button" className="btn small" onClick={() => setEditingSampleId(null)}>Chiudi</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="empty" style={{ padding: '28px', textAlign: 'center' }}>
                    Nessun esame microbiologico registrato per questo paziente.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty" style={{ margin: 'auto' }}>
              Seleziona un letto per visualizzare la scheda.
            </div>
          )}
        </section>
      </div>
    </>
  );
};
