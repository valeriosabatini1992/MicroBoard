'use client';
import React from 'react';
import { useDashboard } from '@/lib/store';
import { daysSince, fmt, LABEL } from '@/lib/logic';
import { Chip, Seg } from './DashboardComponents';

export const DetailSidebar = () => {
  const { db, ui, setPid, setConfirmFree, startIsolation, stopIsolation, toggleNodx, freeBed, reopenSample } = useDashboard();

  const p = db.patients.find(x => x.id === ui.pid);
  if (!p) return null;

  const ss = db.samples.filter(s => s.pid === p.id).sort((a, b) => b.date.localeCompare(a.date));

  const isPos = (s: any) => s.result === 'pos';
  const isMdro = (s: any) => isPos(s) && s.mdro && !(s.status === 'confirmed' && s.cat === 'con');
  const needsIso = !p.iso && ss.some(isMdro);

  const eff = (s: any) => s.status === 'confirmed' ? s.cat : 'pend';

  return (
    <aside className="detail" aria-label="Scheda paziente">
      <div className="d-head">
        <div className="d-row">
          <h2>Letto {p.bed}</h2>
          <button type="button" className="btn small" onClick={() => { setPid(null); setConfirmFree(null); }}>Chiudi</button>
        </div>
        <div className="muted">{p.code}, {p.age} anni, {p.sex}. Ricoverato il {fmt(p.admitted)} (giorno {daysSince(p.admitted) + 1}).</div>
      </div>
      <div className="d-body">
        <div>
          <h3>{p.summary}</h3>
          {p.dx && <div className="dx">{p.dx}</div>}
        </div>

        {needsIso && (
          <div className="alert">
            <span><strong>Germe MDRO senza isolamento attivo.</strong></span>
            <button type="button" className="btn small" onClick={() => startIsolation(p.id, 'Contatto')}>
              Avvia isolamento di contatto
            </button>
          </div>
        )}

        {p.iso ? (
          <div className="iso-box on">
            <div>
              <strong>Isolamento {p.iso.type.toLowerCase()}</strong>, giorno {daysSince(p.iso.since) + 1} (dal {fmt(p.iso.since)})
              <br /><span className="muted">{p.iso.reason}</span>
            </div>
            <button type="button" className="btn small" onClick={() => stopIsolation(p.id)}>Revoca</button>
          </div>
        ) : (
          <div className="iso-box">
            <span className="muted">Nessun isolamento attivo</span>
            <div className="btn-row">
              <span className="muted">Avvia:</span>
              {['Contatto', 'Droplet', 'Aereo'].map(t => (
                <button key={t} type="button" className="btn small" onClick={() => startIsolation(p.id, t)}>{t}</button>
              ))}
            </div>
          </div>
        )}

        <div className="d-row">
          <h3>Esami</h3>
          <button type="button" className="btn small primary" onClick={() => {
            document.dispatchEvent(new CustomEvent('open-sample-modal', { detail: { pid: p.id } }));
          }}>Aggiungi esame</button>
        </div>

        <div className="timeline">
          {ss.length ? ss.map(s => {
            const head = (
              <div className="samp-top">
                <span className="date">{fmt(s.date)}</span>
                <span>{s.site}, {s.test}</span>
              </div>
            );
            if (!isPos(s)) {
              return (
                <article key={s.id} className="samp neg">
                  {head}
                  <div className="tags">
                    <span className={`tag ${s.result === 'neg' ? 'neg' : 'pending'}`}>{s.result === 'neg' ? 'Negativo' : 'In corso'}</span>
                    <span>{s.label}</span>
                  </div>
                </article>
              );
            }
            const cls = eff(s);
            return (
              <article key={s.id} className={`samp ${cls}`}>
                {head}
                <h4>{s.org}</h4>
                <div className="tags">
                  {s.mdro && <span className="badge mdro">{s.mdro}</span>}
                  {s.setsTot && <span className="tag">{s.setsPos} set su {s.setsTot}</span>}
                  {s.cfu && <span className="tag">{s.cfu >= 1000 ? `10^${Math.round(Math.log10(s.cfu))}` : s.cfu} UFC</span>}
                  {s.clinical && <span className="tag">Sospetto clinico</span>}
                </div>
                {s.ab && <p className="ab">{s.ab}</p>}
                
                {s.status === 'pending' ? (
                  <div className="prop">
                    <div><Chip cat={s.proposal!.cat} /></div>
                    <span className="muted">{s.proposal!.reason}</span>
                    <span>Conferma la classificazione:</span>
                    <Seg s={s} />
                  </div>
                ) : (
                  <>
                    <div className="tags"><Chip cat={s.cat!} /></div>
                    {s.note && <p className="ab">{s.note}</p>}
                    <div className="audit">
                      {s.proposal && s.proposal.cat !== s.cat && <span>Il sistema proponeva: {LABEL[s.proposal.cat].toLowerCase()}.</span>}
                      <button type="button" onClick={() => reopenSample(s.id)}>Riapri</button>
                    </div>
                    <details>
                      <summary className="muted" style={{ fontSize: '12.5px', cursor: 'pointer' }}>Cambia classificazione</summary>
                      <div style={{ marginTop: '6px' }}><Seg s={s} /></div>
                    </details>
                  </>
                )}
              </article>
            );
          }) : (
            <div className="empty">Nessun esame registrato.</div>
          )}
        </div>

        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          {ui.confirmFree === p.id ? (
            <>
              <span className="muted">Rimuove paziente ed esami dall&apos;elenco.</span>
              <button type="button" className="btn small danger" onClick={() => freeBed(p.id)}>Conferma</button>
              <button type="button" className="btn small" onClick={() => setConfirmFree(null)}>Annulla</button>
            </>
          ) : (
            <button type="button" className="btn small" onClick={() => setConfirmFree(p.id)}>Libera letto</button>
          )}
        </div>
      </div>
    </aside>
  );
};
