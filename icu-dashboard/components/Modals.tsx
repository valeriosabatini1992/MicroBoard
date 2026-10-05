'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/store';
import { todayISO, suggest, SITES, TESTS, MDROS, ORGS } from '@/lib/logic';
import { Chip } from './DashboardComponents';

export const Modals = () => {
  const { db, addSample, addPatient } = useDashboard();
  const [activeModal, setActiveModal] = useState<'sample' | 'admit' | null>(null);
  
  const [modalPid, setModalPid] = useState<string>('');
  const [modalBed, setModalBed] = useState<number>(0);

  // Sample form state
  const [fDate, setFDate] = useState(todayISO);
  const [fResult, setFResult] = useState<'pos' | 'neg' | 'pending'>('pos');
  const [fSite, setFSite] = useState('Sangue');
  const [fTest, setFTest] = useState('Colturale');
  const [fOrg, setFOrg] = useState('');
  const [fLabel, setFLabel] = useState('');
  const [fSp, setFSp] = useState('1');
  const [fSt, setFSt] = useState('2');
  const [fCfu, setFCfu] = useState('');
  const [fMdro, setFMdro] = useState('');
  const [fAb, setFAb] = useState('');
  const [fClin, setFClin] = useState(false);
  const [sErr, setSErr] = useState('');

  // Admit form state
  const [aCode, setACode] = useState('');
  const [aAge, setAAge] = useState('');
  const [aSex, setASex] = useState('M');
  const [aSum, setASum] = useState('');
  const [aErr, setAErr] = useState('');

  useEffect(() => {
    const handleSample = (e: any) => {
      setModalPid(e.detail?.pid || db.patients[0]?.id || '');
      setFDate(todayISO); setFResult('pos'); setFSite('Sangue'); setFTest('Colturale');
      setFOrg(''); setFLabel(''); setFSp('1'); setFSt('2'); setFCfu(''); setFMdro(''); setFAb(''); setFClin(false); setSErr('');
      setActiveModal('sample');
    };
    const handleAdmit = (e: any) => {
      setModalBed(e.detail?.bed || 0);
      setACode(''); setAAge(''); setASex('M'); setASum(''); setAErr('');
      setActiveModal('admit');
    };

    document.addEventListener('open-sample-modal', handleSample);
    document.addEventListener('open-admit-modal', handleAdmit);
    return () => {
      document.removeEventListener('open-sample-modal', handleSample);
      document.removeEventListener('open-admit-modal', handleAdmit);
    };
  }, [db.patients]);

  if (!activeModal) return null;

  const close = () => setActiveModal(null);

  const handleSaveSample = () => {
    if (!modalPid) { setSErr('Seleziona un paziente.'); return; }
    let finalOrg = fOrg.trim();
    let finalLabel = fLabel.trim();
    let finalMdro = fMdro;
    let finalAb = fAb.trim();
    let finalClin = fClin;
    let finalSp = fSp ? parseInt(fSp, 10) : null;
    let finalSt = fSt ? parseInt(fSt, 10) : null;
    let finalCfu = fCfu ? parseInt(fCfu, 10) : null;

    if (fResult === 'pos') {
      if (!finalOrg) { setSErr('Indica il germe o il reperto.'); return; }
      if (fSite === 'Sangue' && (finalSp == null || finalSt == null || finalSp < 1 || finalSt < finalSp)) {
        setSErr('Controlla i set: i positivi devono essere almeno 1 e non più dei totali.'); return;
      }
    } else {
      finalOrg = ''; finalMdro = ''; finalAb = ''; finalClin = false; finalSp = null; finalSt = null; finalCfu = null;
      if (!finalLabel) finalLabel = fResult === 'neg' ? 'Nessun germe isolato' : 'Risultato atteso';
    }

    if (fSite !== 'Sangue') { finalSp = null; finalSt = null; }

    addSample({
      id: '', pid: modalPid, date: fDate, result: fResult, site: fSite, test: fTest,
      org: finalOrg, label: finalLabel, setsPos: finalSp, setsTot: finalSt, cfu: finalCfu,
      mdro: finalMdro, ab: finalAb, clinical: finalClin, proposal: null, status: 'none', cat: null, by: '', at: '', note: ''
    });
    close();
  };

  const handleSaveAdmit = () => {
    const code = aCode.trim();
    const age = parseInt(aAge, 10);
    if (!code) { setAErr('Inserisci un codice paziente.'); return; }
    if (!age || isNaN(age)) { setAErr('Inserisci un\'età valida.'); return; }
    if (db.patients.some(p => p.code.toLowerCase() === code.toLowerCase())) { setAErr('Esiste già un paziente con questo codice.'); return; }

    addPatient({
      id: 'p' + Date.now(), bed: modalBed, code, age, sex: aSex, admitted: todayISO,
      summary: aSum.trim() || 'Quadro clinico non indicato', dx: '', iso: null, nodx: false
    });
    close();
  };

  const pos = fResult === 'pos';
  const showSets = pos && fSite === 'Sangue';
  const showCfu = pos && ['BAL', 'Aspirato tracheale', 'Urine', 'Punta di CVC'].includes(fSite);

  const previewSugg = pos && fOrg.trim() ? suggest({ result: 'pos', org: fOrg.trim(), site: fSite, test: fTest, setsPos: parseInt(fSp)||0, setsTot: parseInt(fSt)||0, cfu: parseInt(fCfu)||0, clinical: fClin }) : null;

  return (
    <>
      <div className="backdrop" onClick={close}></div>
      <div className="modal" role="dialog" aria-modal="true">
        {activeModal === 'sample' && (
          <>
            <div className="m-head">
              <h2>Nuovo esame microbiologico</h2>
              <button type="button" className="btn small" onClick={close}>Chiudi</button>
            </div>
            <div className="m-body">
              <label className="fld">Paziente
                <select value={modalPid} onChange={e => setModalPid(e.target.value)}>
                  {db.patients.slice().sort((a, b) => a.bed - b.bed).map(p => (
                    <option key={p.id} value={p.id}>Letto {p.bed}, {p.code}</option>
                  ))}
                </select>
              </label>
              <label className="fld">Data del prelievo<input type="date" value={fDate} max={todayISO} onChange={e => setFDate(e.target.value)} /></label>
              <label className="fld">Esito
                <select value={fResult} onChange={e => setFResult(e.target.value as any)}>
                  <option value="pos">Positivo</option><option value="neg">Negativo</option><option value="pending">In corso</option>
                </select>
              </label>
              <label className="fld">Tipo di campione
                <select value={fSite} onChange={e => setFSite(e.target.value)}>
                  {SITES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="fld">Esame
                <select value={fTest} onChange={e => setFTest(e.target.value)}>
                  {TESTS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              
              {pos ? (
                <label className="fld">Germe o reperto
                  <input type="text" list="orgs" placeholder="es. Klebsiella pneumoniae" value={fOrg} onChange={e => setFOrg(e.target.value)} autoComplete="off" />
                  <datalist id="orgs">{ORGS.map(o => <option key={o} value={o} />)}</datalist>
                </label>
              ) : (
                <label className="fld">Cosa è stato richiesto
                  <input type="text" placeholder="es. Pannello meningoencefalite" value={fLabel} onChange={e => setFLabel(e.target.value)} />
                </label>
              )}

              {showSets && (
                <>
                  <label className="fld">Set positivi<input type="number" min="0" max="8" value={fSp} onChange={e => setFSp(e.target.value)} /></label>
                  <label className="fld">Set totali<input type="number" min="1" max="8" value={fSt} onChange={e => setFSt(e.target.value)} /></label>
                </>
              )}
              {showCfu && (
                <label className="fld">Carica (UFC/ml o UFC)<input type="number" min="0" placeholder="es. 100000" value={fCfu} onChange={e => setFCfu(e.target.value)} /></label>
              )}

              {pos && (
                <>
                  <label className="fld">Profilo di resistenza
                    <select value={fMdro} onChange={e => setFMdro(e.target.value)}>
                      {MDROS.map(v => <option key={v} value={v}>{v || 'Nessun MDRO'}</option>)}
                    </select>
                  </label>
                  <label className="fld full">Antibiogramma sintetico<input type="text" placeholder="es. Meropenem R, colistina S" value={fAb} onChange={e => setFAb(e.target.value)} /></label>
                  <label className="check full">
                    <input type="checkbox" checked={fClin} onChange={e => setFClin(e.target.checked)} />
                    <span>Sospetto clinico di infezione (febbre, aumento indici di flogosi, segni nel sito, nuova terapia antibiotica)</span>
                  </label>

                  <div className="full preview" aria-live="polite">
                    {!fOrg.trim() ? (
                      <span className="muted">Indica il germe o il reperto per vedere la proposta di classificazione.</span>
                    ) : previewSugg ? (
                      <>
                        <strong>Proposta del sistema</strong>
                        <div><Chip cat={previewSugg.cat} /></div>
                        <span className="muted">{previewSugg.reason}</span>
                        <span className="muted">La proposta va confermata da un medico nella coda "Da rivedere".</span>
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </div>
            <div className="m-foot">
              <p className="err" role="alert">{sErr}</p>
              <button type="button" className="btn" onClick={close}>Annulla</button>
              <button type="button" className="btn primary" onClick={handleSaveSample}>Salva esame</button>
            </div>
          </>
        )}

        {activeModal === 'admit' && (
          <>
            <div className="m-head">
              <h2>Assegna paziente al letto {modalBed}</h2>
              <button type="button" className="btn small" onClick={close}>Chiudi</button>
            </div>
            <div className="m-body">
              <label className="fld full">Codice paziente (non usare nome e cognome)<input type="text" placeholder="es. TI-0440" value={aCode} onChange={e => setACode(e.target.value)} autoComplete="off" /></label>
              <label className="fld">Età<input type="number" min="0" max="120" value={aAge} onChange={e => setAAge(e.target.value)} /></label>
              <label className="fld">Sesso
                <select value={aSex} onChange={e => setASex(e.target.value)}>
                  <option>F</option><option>M</option>
                </select>
              </label>
              <label className="fld full">Quadro clinico<input type="text" placeholder="es. Polmonite grave, ventilazione meccanica" value={aSum} onChange={e => setASum(e.target.value)} /></label>
            </div>
            <div className="m-foot">
              <p className="err" role="alert">{aErr}</p>
              <button type="button" className="btn" onClick={close}>Annulla</button>
              <button type="button" className="btn primary" onClick={handleSaveAdmit}>Assegna</button>
            </div>
          </>
        )}
      </div>
    </>
  );
};
