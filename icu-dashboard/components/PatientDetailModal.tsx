'use client';
import React, { useEffect, useState } from 'react';
import { useDashboard } from '@/lib/store';
import { BEDS, fmt, fmtDMY, daysSince, isPendingCulture } from '@/lib/logic';
import { CatType, Sample } from '@/lib/types';
import { Chip } from './DashboardComponents';

const SHORT_CAT: Record<string, string> = {
  sig: '🔴 Infezione',
  col: '🟡 Col.',
  con: '⚪ Cont.',
  val: '🔵 Incerto',
  pend: '⏳ In corso',
};

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

  const [expandedSampleId, setExpandedSampleId] = useState<string | null>(null);
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

  const fmtShortDate = (s: string) => {
    if (!s) return '';
    const parts = s.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return s;
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
        {/* Left Column: Rapid Bed Selector (Desktop) */}
        <aside className="bed-quick-nav desktop-only" aria-label="Elenco rapido letti">
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
              {/* Ultra-Compact Top Bar */}
              <div className="p-modal-header">
                <div className="p-modal-header-left">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                    <h2 id="modal-patient-title" className="p-modal-title">
                      Letto {currentPatient.bed}
                    </h2>
                    <span className="p-header-badge">{currentPatient.code}</span>
                    <span className="muted p-patient-meta">
                      {currentPatient.age}a {currentPatient.sex} • Ricoverato {fmtShortDate(currentPatient.admitted)} (gg {daysSince(currentPatient.admitted) + 1})
                    </span>
                  </div>
                </div>

                <div className="p-modal-header-actions">
                  <button 
                    type="button" 
                    className="btn small primary p-btn-add"
                    onClick={() => {
                      document.dispatchEvent(new CustomEvent('open-sample-modal', { detail: { pid: currentPatient.id } }));
                    }}
                    title="Nuovo esame"
                  >
                    + Esame
                  </button>

                  {ui.confirmFree === currentPatient.id ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button type="button" className="btn small danger" onClick={() => freeBed(currentPatient.id)}>Conferma</button>
                      <button type="button" className="btn small" onClick={() => setConfirmFree(null)}>Annulla</button>
                    </div>
                  ) : (
                    <button type="button" className="btn small desktop-only" onClick={() => setConfirmFree(currentPatient.id)}>Libera</button>
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

              {/* Compact Diagnosis & Isolation Strip */}
              <div className="p-modal-summary-bar">
                <div className="p-summary-text">
                  <strong>{currentPatient.summary}</strong>
                  {currentPatient.dx && <span className="muted"> — {currentPatient.dx}</span>}
                </div>

                <div className="p-summary-tags">
                  {needsIso && (
                    <span className="mini-badge-alert" onClick={() => startIsolation(currentPatient.id, 'Contatto')}>
                      ⚠️ MDRO senza isolamento!
                    </span>
                  )}
                  {currentPatient.iso ? (
                    <span className="mini-badge-iso" title={currentPatient.iso.reason}>
                      🛡️ Isolam. {currentPatient.iso.type.toLowerCase()} (gg {daysSince(currentPatient.iso.since) + 1})
                      <button type="button" className="btn-iso-revoke" onClick={() => stopIsolation(currentPatient.id)}>✕</button>
                    </span>
                  ) : (
                    <div className="desktop-only" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                      <span className="muted" style={{ fontSize: '11.5px' }}>Isolamento:</span>
                      {['Contatto', 'Droplet'].map(t => (
                        <button key={t} type="button" className="btn small" style={{ fontSize: '11px', padding: '1px 5px' }} onClick={() => startIsolation(currentPatient.id, t)}>{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Main Body: Ultra-Dense Single-Line Exam Records */}
              <div className="p-modal-body">
                <div className="exam-table-bar">
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>
                    Referti microbiologici ({ss.length})
                  </span>
                  <span className="muted" style={{ fontSize: '11.5px' }}>
                    {ss.filter(s => getEffectiveCat(s) === 'sig').length} Infezioni • Tocca per dettagli
                  </span>
                </div>

                {ss.length > 0 ? (
                  <div className="dense-exam-container">
                    {/* Header Row (Desktop only) */}
                    <div className="dense-row-header desktop-only">
                      <div className="d-col d-date">DATA</div>
                      <div className="d-col d-site">SITO</div>
                      <div className="d-col d-test">ESAME</div>
                      <div className="d-col d-result">MICRORGANISMO / ESITO</div>
                      <div className="d-col d-cat">INTERPRETAZIONE</div>
                      <div className="d-col d-act">AZIONI</div>
                    </div>

                    {/* Exam List */}
                    <div className="dense-row-list">
                      {ss.map(s => {
                        const isPending = s.result === 'pending';
                        const isNegative = s.result === 'neg';
                        const isPositive = s.result === 'pos';
                        const effectiveCat = getEffectiveCat(s);
                        const isExpanded = expandedSampleId === s.id;
                        const isEditingThis = editingSampleId === s.id;

                        const rowClass = isPositive 
                          ? `dense-row ${effectiveCat}` 
                          : isNegative 
                          ? 'dense-row neg' 
                          : 'dense-row pend';

                        return (
                          <div key={s.id} className="dense-item-wrapper">
                            <div 
                              className={rowClass}
                              onClick={() => setExpandedSampleId(isExpanded ? null : s.id)}
                            >
                              {/* Date */}
                              <div className="d-col d-date font-mono">
                                <span className="desktop-only">{fmtDMY(s.date)}</span>
                                <span className="mobile-only">{fmtShortDate(s.date)}</span>
                              </div>

                              {/* Site */}
                              <div className="d-col d-site">
                                <span className="site-pill-dense" title={s.site}>{s.site}</span>
                              </div>

                              {/* Test (Desktop) */}
                              <div className="d-col d-test desktop-only muted" title={s.test}>
                                {s.test}
                              </div>

                              {/* Result / Organism */}
                              <div className="d-col d-result">
                                {isPositive && (
                                  <div className="d-res-content">
                                    <strong className={`d-org-text ${effectiveCat === 'sig' ? 'sig' : ''}`}>
                                      {s.org}
                                    </strong>
                                    {s.mdro && <span className="badge mdro mini-tag">{s.mdro}</span>}
                                    {s.setsTot && <span className="mini-tag muted desktop-only">{s.setsPos}/{s.setsTot} set</span>}
                                    {s.cfu && <span className="mini-tag muted desktop-only">{s.cfu >= 1000 ? `10^${Math.round(Math.log10(s.cfu))}` : s.cfu} UFC</span>}
                                    {s.clinical && <span className="mini-tag alert-tag desktop-only">Clinico</span>}
                                    {s.ab && (
                                      <span className="d-ab-snippet muted desktop-only" title={s.ab}>
                                        • {s.ab}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {isNegative && (
                                  <div className="d-res-content">
                                    <span className="badge-neg">Negativo</span>
                                    <span className="muted d-label-text">{s.label || 'Nessun germe'}</span>
                                  </div>
                                )}

                                {isPending && (
                                  <div className="d-res-content">
                                    <span className="badge-pend">⏳ In corso</span>
                                    <span className="muted d-label-text">{s.label || 'Attesa referto'}</span>
                                  </div>
                                )}
                              </div>

                              {/* Category / Chip */}
                              <div className="d-col d-cat">
                                {isPositive ? (
                                  <>
                                    <span className="desktop-only"><Chip cat={effectiveCat === 'pend' ? 'val' : effectiveCat} /></span>
                                    <span className={`chip ${effectiveCat === 'pend' ? 'val' : effectiveCat} mini-chip mobile-only`}>
                                      {SHORT_CAT[effectiveCat]}
                                    </span>
                                  </>
                                ) : isPending ? (
                                  <span className="chip pend mini-chip">In corso</span>
                                ) : (
                                  <span className="chip con mini-chip">Negativo</span>
                                )}
                              </div>

                              {/* Actions / Dropdown (Desktop) */}
                              <div className="d-col d-act" onClick={e => e.stopPropagation()}>
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
                                  <div style={{ display: 'flex', gap: '3px' }}>
                                    <button 
                                      type="button" 
                                      className="btn small" 
                                      style={{ fontSize: '10.5px', padding: '1px 5px', color: 'var(--sig)', borderColor: 'var(--sig)' }}
                                      onClick={() => handleQuickReferta(s.id)}
                                      title="Registra germe isolato"
                                    >
                                      + Pos
                                    </button>
                                    <button 
                                      type="button" 
                                      className="btn small" 
                                      style={{ fontSize: '10.5px', padding: '1px 5px' }}
                                      onClick={() => handleSaveNegative(s.id)}
                                      title="Registra come negativo"
                                    >
                                      Neg
                                    </button>
                                  </div>
                                )}

                                {isNegative && (
                                  <span className="muted" style={{ fontSize: '11px' }}>—</span>
                                )}
                              </div>

                              {/* Expand Chevron Icon */}
                              <div className="d-expand-icon mobile-only">
                                {isExpanded ? '▲' : '▼'}
                              </div>
                            </div>

                            {/* Expandable Details Drawer (Mobile & Desktop) */}
                            {isExpanded && (
                              <div className="dense-expanded-drawer">
                                <div className="drawer-grid">
                                  {isPositive && (
                                    <>
                                      {s.ab && (
                                        <div className="drawer-item">
                                          <strong>Antibiogramma:</strong> <span>{s.ab}</span>
                                        </div>
                                      )}
                                      {(s.setsTot || s.cfu || s.clinical) && (
                                        <div className="drawer-item">
                                          <strong>Dettagli prelievo:</strong>{' '}
                                          {s.setsTot && `${s.setsPos}/${s.setsTot} set positivi • `}
                                          {s.cfu && `${s.cfu} UFC • `}
                                          {s.clinical && `Sospetto clinico confermato`}
                                        </div>
                                      )}
                                      <div className="drawer-item-cat">
                                        <strong>Classificazione:</strong>
                                        <div className="drawer-cat-buttons">
                                          {(['sig', 'col', 'con', 'val'] as CatType[]).map(c => (
                                            <button
                                              key={c}
                                              type="button"
                                              className={`btn small ${s.cat === c ? 'primary' : ''}`}
                                              style={{ fontSize: '12px', padding: '3px 8px' }}
                                              onClick={() => confirmSample(s.id, c)}
                                            >
                                              {SHORT_CAT[c]}
                                            </button>
                                          ))}
                                          {s.status === 'confirmed' && (
                                            <button
                                              type="button"
                                              className="btn small"
                                              style={{ fontSize: '12px', padding: '3px 8px', color: 'var(--muted)' }}
                                              onClick={() => reopenSample(s.id)}
                                            >
                                              Riapri
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  {isPending && (
                                    <div className="drawer-item">
                                      <span>Esame in corso dal {fmtDMY(s.date)} ({daysSince(s.date)} gg fa).</span>
                                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                        <button type="button" className="btn small primary" onClick={() => handleQuickReferta(s.id)}>
                                          + Inserisci Positività (Germe)
                                        </button>
                                        <button type="button" className="btn small" onClick={() => handleSaveNegative(s.id)}>
                                          ✓ Segna Negativo
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {isNegative && (
                                    <div className="drawer-item muted">
                                      Esito negativo refertato il {fmtDMY(s.date)}. Nessuna crescita microbica.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Quick Editor for Positives */}
                            {isEditingThis && (
                              <div className="inline-quick-edit">
                                <span style={{ fontWeight: 600, fontSize: '12.5px' }}>Referta positività:</span>
                                <input 
                                  type="text" 
                                  placeholder="Nome germe (es. S. aureus)"
                                  value={quickOrg}
                                  onChange={e => setQuickOrg(e.target.value)}
                                  style={{ padding: '3px 7px', fontSize: '12.5px', borderRadius: '4px', border: '1px solid var(--line-strong)', flex: 1 }}
                                />
                                <select 
                                  value={quickMdro} 
                                  onChange={e => setQuickMdro(e.target.value)}
                                  style={{ padding: '3px 5px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--line-strong)' }}
                                >
                                  <option value="">No MDRO</option>
                                  <option value="MRSA">MRSA</option>
                                  <option value="VRE">VRE</option>
                                  <option value="ESBL">ESBL</option>
                                  <option value="CRE/CPE">CRE/CPE</option>
                                  <option value="Pseudomonas CR">Pseudomonas CR</option>
                                  <option value="Acinetobacter CR">Acinetobacter CR</option>
                                </select>
                                <button type="button" className="btn small primary" style={{ fontSize: '12px', padding: '3px 8px' }} onClick={() => handleSavePositive(s.id)}>Salva</button>
                                <button type="button" className="btn small" style={{ fontSize: '12px', padding: '3px 8px' }} onClick={() => setEditingSampleId(null)}>Annulla</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="empty" style={{ padding: '24px', textAlign: 'center' }}>
                    Nessun esame registrato per questo letto.
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
