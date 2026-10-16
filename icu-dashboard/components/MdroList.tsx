'use client';
import React from 'react';
import { useDashboard } from '@/lib/store';
import { daysSince, fmt } from '@/lib/logic';
import { Chip } from './DashboardComponents';

export const MdroList = () => {
  const { db, startIsolation, stopIsolation } = useDashboard();

  const isPos = (s: any) => s.result === 'pos';
  const isMdro = (s: any) => isPos(s) && Boolean(s.mdro);
  const needsIso = (p: any) => !p.iso && db.samples.filter(s => s.pid === p.id).some(isMdro);

  const noIso = db.patients.filter(needsIso);
  const isoRows = db.patients.filter(p => p.iso).sort((a, b) => String(a.bed).localeCompare(String(b.bed), undefined, { numeric: true }));
  const mRows = db.samples.filter(s => isMdro(s) && db.patients.find(p => p.id === s.pid)).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      {noIso.length > 0 && (
        <div className="list" style={{ marginBottom: '16px' }}>
          {noIso.map(p => (
            <div key={p.id} className="alert">
              <span><strong>Letto {p.bed}, {p.code}:</strong> germe MDRO senza isolamento attivo.</span>
              <button type="button" className="btn small" onClick={() => startIsolation(p.id, 'Contatto')}>
                Avvia isolamento di contatto
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="sec">Isolamenti attivi</h2>
      {isoRows.length > 0 ? (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Paziente</th>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Durata</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isoRows.map(p => (
                <tr key={p.id}>
                  <td><strong>Letto {p.bed}</strong><br /><span className="muted">{p.code}</span></td>
                  <td>{p.iso!.type}</td>
                  <td>{p.iso!.reason}</td>
                  <td>dal {fmt(p.iso!.since)}, giorno {daysSince(p.iso!.since) + 1}</td>
                  <td>
                    <button type="button" className="btn small" onClick={() => stopIsolation(p.id)}>Revoca</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">Nessun isolamento attivo.</div>
      )}

      <h2 className="sec">Germi multiresistenti (MDRO)</h2>
      {mRows.length > 0 ? (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Paziente</th>
                <th>Germe</th>
                <th>Profilo</th>
                <th>Sito</th>
                <th>Data</th>
                <th>Classificazione</th>
              </tr>
            </thead>
            <tbody>
              {mRows.map(s => {
                const p = db.patients.find(x => x.id === s.pid)!;
                return (
                  <tr key={s.id}>
                    <td><strong>Letto {p.bed}</strong><br /><span className="muted">{p.code}</span></td>
                    <td>{s.org}</td>
                    <td><span className="badge mdro">{s.mdro}</span></td>
                    <td>{s.site}</td>
                    <td>{fmt(s.date)}</td>
                    <td>
                      <Chip cat={s.status === 'confirmed' ? s.cat! : s.proposal!.cat} />
                      {s.status === 'pending' && ' '}<span className="tag pending" style={{display: s.status === 'pending' ? 'inline-block' : 'none'}}>da rivedere</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">Nessun germe MDRO registrato.</div>
      )}
    </>
  );
};
