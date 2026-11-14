'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/store';
import { todayISO, suggest, SITES, TESTS, MDROS, ORGS, ANTIBIOTIC_LIST, ADMINISTRATION_ROUTES, STOP_REASONS } from '@/lib/logic';
import { Chip } from './DashboardComponents';
import { Patient, Sample, AntibioticTherapy, CatType } from '@/lib/types';
import { Pencil, Pill, StopCircle, UserCheck } from 'lucide-react';

export const Modals = () => {
  const { 
    db, 
    addSample, 
    updateSample, 
    addPatient, 
    updatePatient, 
    addAntibiotic, 
    updateAntibiotic, 
    stopAntibiotic 
  } = useDashboard();

  const [activeModal, setActiveModal] = useState<'sample' | 'edit-sample' | 'admit' | 'edit-patient' | 'abx' | 'stop-abx' | null>(null);
  
  // Sample form state
  const [editingSampleId, setEditingSampleId] = useState<string | null>(null);
  const [modalPid, setModalPid] = useState<string>('');
  const [fDate, setFDate] = useState(todayISO);
  const [fResult, setFResult] = useState<'pos' | 'neg' | 'pending'>('pos');
  const [fSite, setFSite] = useState('Sangue');
  const [fBloodSite, setFBloodSite] = useState('CVP/CVC');
  const [fCompleteBlood, setFCompleteBlood] = useState(false);
  const [fTest, setFTest] = useState('Colturale');
  const [fOrg, setFOrg] = useState('');
  const [fLabel, setFLabel] = useState('');
  const [fSp, setFSp] = useState('1');
  const [fSt, setFSt] = useState('2');
  const [fCfu, setFCfu] = useState('');
  const [fMdro, setFMdro] = useState('');
  const [fCat, setFCat] = useState<CatType>('sig');
  const [sErr, setSErr] = useState('');

  // Admit form state
  const [modalBed, setModalBed] = useState<number | string>(0);
  const [aCode, setACode] = useState('');
  const [aAge, setAAge] = useState('');
  const [aSex, setASex] = useState('M');
  const [aSum, setASum] = useState('');
  const [aErr, setAErr] = useState('');

  // Edit Patient form state
  const [editPatientId, setEditPatientId] = useState<string>('');
  const [epBed, setEpBed] = useState<number | string>(1);
  const [epCode, setEpCode] = useState('');
  const [epAge, setEpAge] = useState('');
  const [epSex, setEpSex] = useState('M');
  const [epAdmitted, setEpAdmitted] = useState(todayISO);
  const [epSum, setEpSum] = useState('');
  const [epDx, setEpDx] = useState('');
  const [epIsoType, setEpIsoType] = useState('Nessuno');
  const [epIsoReason, setEpIsoReason] = useState('');
  const [epIsoSince, setEpIsoSince] = useState(todayISO);
  const [epNodx, setEpNodx] = useState(false);
  const [epErr, setEpErr] = useState('');

  // Antibiotic form state
  const [abxEditingId, setAbxEditingId] = useState<string | null>(null);
  const [abxPid, setAbxPid] = useState<string>('');
  const [abxDrug, setAbxDrug] = useState('');
  const [abxDosage, setAbxDosage] = useState('');
  const [abxRoute, setAbxRoute] = useState('EV');
  const [abxStartDate, setAbxStartDate] = useState(todayISO);
  const [abxEndDate, setAbxEndDate] = useState('');
  const [abxStatus, setAbxStatus] = useState<'active' | 'completed'>('active');
  const [abxIndication, setAbxIndication] = useState('');
  const [abxStopReason, setAbxStopReason] = useState('');
  const [abxNote, setAbxNote] = useState('');
  const [abxErr, setAbxErr] = useState('');

  // Quick Stop Antibiotic dialog state
  const [stoppingAbx, setStoppingAbx] = useState<AntibioticTherapy | null>(null);
  const [stopDate, setStopDate] = useState(todayISO);
  const [stopReason, setStopReason] = useState('Completato ciclo terapeutico');
  const [stopCustomReason, setStopCustomReason] = useState('');

  useEffect(() => {
    const handleNewSample = (e: any) => {
      setEditingSampleId(null);
      setModalPid(e.detail?.pid || db.patients[0]?.id || '');
      setFDate(todayISO); setFResult('pos'); setFSite('Sangue'); setFBloodSite('CVP/CVC'); setFCompleteBlood(false); setFTest('Colturale');
      setFOrg(''); setFLabel(''); setFSp('1'); setFSt('2'); setFCfu(''); setFMdro(''); setFCat('sig'); setSErr('');
      setActiveModal('sample');
    };

    const handleEditSample = (e: any) => {
      const s: Sample = e.detail?.sample;
      if (!s) return;
      setEditingSampleId(s.id);
      setModalPid(s.pid);
      setFDate(s.date || todayISO);
      setFResult(s.result);
      setFSite(s.site || 'Sangue');
      setFBloodSite(s.bloodDrawSite || 'CVP/CVC');
      setFCompleteBlood(Boolean(s.isCompleteBloodCulture));
      setFTest(s.test || 'Colturale');
      setFOrg(s.org || '');
      setFLabel(s.label || '');
      setFSp(s.setsPos != null ? String(s.setsPos) : '1');
      setFSt(s.setsTot != null ? String(s.setsTot) : '2');
      setFCfu(s.cfu != null ? String(s.cfu) : '');
      setFMdro(s.mdro || '');
      setFCat(s.cat || (s.proposal?.cat || 'sig'));
      setSErr('');
      setActiveModal('edit-sample');
    };

    const handleAdmit = (e: any) => {
      setModalBed(e.detail?.bed || 0);
      setACode(''); setAAge(''); setASex('M'); setASum(''); setAErr('');
      setActiveModal('admit');
    };

    const handleEditPatient = (e: any) => {
      const p: Patient = e.detail?.patient;
      if (!p) return;
      setEditPatientId(p.id);
      setEpBed(p.bed);
      setEpCode(p.code);
      setEpAge(String(p.age || ''));
      setEpSex(p.sex || 'M');
      setEpAdmitted(p.admitted || todayISO);
      setEpSum(p.summary || '');
      setEpDx(p.dx || '');
      setEpIsoType(p.iso?.type || 'Nessuno');
      setEpIsoReason(p.iso?.reason || '');
      setEpIsoSince(p.iso?.since || todayISO);
      setEpNodx(Boolean(p.nodx));
      setEpErr('');
      setActiveModal('edit-patient');
    };

    const handleAbxModal = (e: any) => {
      const pId = e.detail?.pid || db.patients[0]?.id || '';
      const existing: AntibioticTherapy | undefined = e.detail?.antibiotic;
      setAbxPid(pId);
      if (existing) {
        setAbxEditingId(existing.id);
        setAbxDrug(existing.drug || '');
        setAbxDosage(existing.dosage || '');
        setAbxRoute(existing.route || 'EV');
        setAbxStartDate(existing.startDate || todayISO);
        setAbxEndDate(existing.endDate || '');
        setAbxStatus(existing.status === 'completed' || existing.status === 'stopped' ? 'completed' : 'active');
        setAbxIndication(existing.indication || '');
        setAbxStopReason(existing.stopReason || '');
        setAbxNote(existing.note || '');
      } else {
        setAbxEditingId(null);
        setAbxDrug('');
        setAbxDosage('');
        setAbxRoute('EV');
        setAbxStartDate(todayISO);
        setAbxEndDate('');
        setAbxStatus('active');
        setAbxIndication('');
        setAbxStopReason('');
        setAbxNote('');
      }
      setAbxErr('');
      setActiveModal('abx');
    };

    const handleStopAbxModal = (e: any) => {
      const existing: AntibioticTherapy = e.detail?.antibiotic;
      if (!existing) return;
      setStoppingAbx(existing);
      setStopDate(todayISO);
      setStopReason('Completato ciclo terapeutico');
      setStopCustomReason('');
      setActiveModal('stop-abx');
    };

    document.addEventListener('open-sample-modal', handleNewSample);
    document.addEventListener('open-edit-sample-modal', handleEditSample);
    document.addEventListener('open-admit-modal', handleAdmit);
    document.addEventListener('open-edit-patient-modal', handleEditPatient);
    document.addEventListener('open-abx-modal', handleAbxModal);
    document.addEventListener('open-stop-abx-modal', handleStopAbxModal);

    return () => {
      document.removeEventListener('open-sample-modal', handleNewSample);
      document.removeEventListener('open-edit-sample-modal', handleEditSample);
      document.removeEventListener('open-admit-modal', handleAdmit);
      document.removeEventListener('open-edit-patient-modal', handleEditPatient);
      document.removeEventListener('open-abx-modal', handleAbxModal);
      document.removeEventListener('open-stop-abx-modal', handleStopAbxModal);
    };
  }, [db.patients]);

  if (!activeModal) return null;

  const close = () => setActiveModal(null);

  // Save Sample (New or Edit)
  const handleSaveSample = () => {
    if (!modalPid) { setSErr('Seleziona un paziente.'); return; }
    let finalOrg = fOrg.trim();
    let finalLabel = fLabel.trim();
    let finalMdro = fMdro;
    let finalSp = fSp ? parseInt(fSp, 10) : null;
    let finalSt = fSt ? parseInt(fSt, 10) : null;
    let finalCfu = fCfu ? parseInt(fCfu, 10) : null;
    const isBlood = fSite === 'Sangue';
    const finalBloodSite = isBlood ? (fBloodSite.trim() || 'CVP/CVC') : undefined;
    const finalCompleteBlood = isBlood ? fCompleteBlood : false;

    if (fResult === 'pos') {
      if (!finalOrg) { setSErr('Indica il germe o il reperto.'); return; }
      if (isBlood && (finalSp == null || finalSt == null || finalSp < 1 || finalSt < finalSp)) {
        setSErr('Controlla i set: i positivi devono essere almeno 1 e non più dei totali.'); return;
      }
    } else {
      finalOrg = ''; finalMdro = ''; finalSp = null; finalSt = null; finalCfu = null;
      if (!finalLabel) {
        if (finalCompleteBlood) {
          finalLabel = fResult === 'neg' ? 'Emocoltura completa (CVP/CVC) negativa' : 'Emocoltura completa (CVP/CVC) in corso';
        } else {
          finalLabel = fResult === 'neg' ? 'Nessun germe isolato' : 'Risultato atteso';
        }
      }
    }

    if (!isBlood) { finalSp = null; finalSt = null; }

    if (activeModal === 'edit-sample' && editingSampleId) {
      updateSample(editingSampleId, {
        date: fDate,
        result: fResult,
        site: fSite,
        test: fTest,
        org: finalOrg,
        label: finalLabel,
        setsPos: finalSp,
        setsTot: finalSt,
        cfu: finalCfu,
        mdro: finalMdro,
        cat: fResult === 'pos' ? fCat : null,
        status: fResult === 'pos' ? 'confirmed' : fResult === 'neg' ? 'confirmed' : 'pending',
        bloodDrawSite: finalBloodSite,
        isCompleteBloodCulture: finalCompleteBlood,
      });
    } else {
      addSample({
        id: '', pid: modalPid, date: fDate, result: fResult, site: fSite, test: fTest,
        org: finalOrg, label: finalLabel, setsPos: finalSp, setsTot: finalSt, cfu: finalCfu,
        mdro: finalMdro, bloodDrawSite: finalBloodSite, isCompleteBloodCulture: finalCompleteBlood,
        proposal: null, status: 'none', cat: null, by: '', at: '', note: ''
      });
    }
    close();
  };

  // Save Admit
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

  // Save Edit Patient
  const handleSaveEditPatient = () => {
    const code = epCode.trim();
    const age = parseInt(epAge, 10);
    if (!code) { setEpErr('Inserisci un codice paziente.'); return; }
    if (!age || isNaN(age)) { setEpErr('Inserisci un\'età valida.'); return; }

    const isBedTakenByOther = db.patients.some(p => p.id !== editPatientId && String(p.bed) === String(epBed));
    if (isBedTakenByOther) {
      setEpErr(`Il Letto ${epBed} è già occupato da un altro paziente.`);
      return;
    }

    const isoData = epIsoType === 'Nessuno' ? null : {
      type: epIsoType,
      since: epIsoSince || todayISO,
      reason: epIsoReason.trim() || 'Motivo clinico non indicato'
    };

    updatePatient(editPatientId, {
      code,
      bed: Number.isNaN(Number(epBed)) ? epBed : Number(epBed),
      age,
      sex: epSex,
      admitted: epAdmitted || todayISO,
      summary: epSum.trim() || 'Quadro clinico non indicato',
      dx: epDx.trim(),
      iso: isoData,
      nodx: epNodx
    });
    close();
  };

  // Save Antibiotic
  const handleSaveAntibiotic = () => {
    const drug = abxDrug.trim();
    const dosage = abxDosage.trim();
    if (!drug) { setAbxErr('Inserisci il nome del farmaco/antibiotico.'); return; }
    if (!dosage) { setAbxErr('Inserisci il dosaggio e la posologia (es. 2g q8h).'); return; }
    if (!abxStartDate) { setAbxErr('Inserisci la data di inizio terapia.'); return; }

    const finalStopReason = abxStatus === 'completed' ? (abxStopReason.trim() || 'Completato ciclo terapeutico') : undefined;
    const finalEndDate = abxStatus === 'completed' ? (abxEndDate || todayISO) : null;

    if (abxEditingId) {
      updateAntibiotic(abxEditingId, {
        drug,
        dosage,
        route: abxRoute,
        startDate: abxStartDate,
        endDate: finalEndDate,
        status: abxStatus,
        indication: abxIndication.trim(),
        stopReason: finalStopReason,
        note: abxNote.trim()
      });
    } else {
      addAntibiotic({
        pid: abxPid,
        drug,
        dosage,
        route: abxRoute,
        startDate: abxStartDate,
        endDate: finalEndDate,
        status: abxStatus,
        indication: abxIndication.trim(),
        stopReason: finalStopReason,
        note: abxNote.trim()
      });
    }
    close();
  };

  // Confirm Stop Antibiotic
  const handleConfirmStopAbx = () => {
    if (!stoppingAbx) return;
    const reason = stopReason === 'Altro' ? (stopCustomReason.trim() || 'Altro motivo') : stopReason;
    stopAntibiotic(stoppingAbx.id, reason, stopDate);
    close();
  };

  const pos = fResult === 'pos';
  const isBlood = fSite === 'Sangue';
  const showSets = pos && isBlood;
  const showCfu = pos && ['BAL', 'Aspirato tracheale', 'Urine'].includes(fSite);

  const previewSugg = pos && fOrg.trim() ? suggest({ result: 'pos', org: fOrg.trim(), site: fSite, test: fTest, setsPos: parseInt(fSp)||0, setsTot: parseInt(fSt)||0, cfu: parseInt(fCfu)||0 }) : null;

  return (
    <>
      <div className="backdrop" onClick={close}></div>
      <div className="modal" role="dialog" aria-modal="true">
        
        {/* MODAL 1: NEW / EDIT SAMPLE */}
        {(activeModal === 'sample' || activeModal === 'edit-sample') && (
          <>
            <div className="m-head">
              <h2>{activeModal === 'edit-sample' ? 'Modifica esame microbiologico' : 'Nuovo esame microbiologico'}</h2>
              <button type="button" className="btn small" onClick={close}>Chiudi</button>
            </div>
            <div className="m-body">
              <label className="fld">Paziente
                <select value={modalPid} onChange={e => setModalPid(e.target.value)} disabled={activeModal === 'edit-sample'}>
                  {db.patients.slice().sort((a, b) => String(a.bed).localeCompare(String(b.bed), undefined, { numeric: true })).map(p => (
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
                <select value={fSite} onChange={e => {
                  const val = e.target.value;
                  setFSite(val);
                  if (val === 'Sangue') {
                    setFBloodSite('CVP/CVC');
                  }
                }}>
                  {SITES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>

              {isBlood && (
                <>
                  <label className="check full" style={{ marginTop: '2px', marginBottom: '2px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                    <input 
                      type="checkbox" 
                      checked={fCompleteBlood} 
                      onChange={e => {
                        const checked = e.target.checked;
                        setFCompleteBlood(checked);
                        if (checked) {
                          setFBloodSite('CVP/CVC');
                          setFSt('2');
                        }
                      }} 
                    />
                    <span style={{ fontWeight: 600 }}>
                      Emocoltura completa (1 set aerobi/anaerobi da CVP e 1 set aerobi/anaerobi da CVC)
                    </span>
                  </label>

                  <label className="fld">Sito di prelievo
                    <input 
                      type="text" 
                      list="blood-sites" 
                      placeholder="es. CVP/CVC" 
                      value={fBloodSite} 
                      onChange={e => setFBloodSite(e.target.value)} 
                    />
                    <datalist id="blood-sites">
                      <option value="CVP/CVC">CVP/CVC (Periferico + Centrale)</option>
                      <option value="CVP">CVP (Catetere venoso periferico)</option>
                      <option value="CVC">CVC (Catetere venoso centrale)</option>
                    </datalist>
                  </label>
                </>
              )}

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

                  {activeModal === 'edit-sample' && (
                    <label className="fld">Classificazione clinica
                      <select value={fCat} onChange={e => setFCat(e.target.value as CatType)}>
                        <option value="sig">🔴 Infezione significativa</option>
                        <option value="col">🟡 Colonizzazione</option>
                      </select>
                    </label>
                  )}

                  <div className="full preview" aria-live="polite">
                    {!fOrg.trim() ? (
                      <span className="muted">Indica il germe o il reperto per vedere la proposta di classificazione.</span>
                    ) : previewSugg ? (
                      <>
                        <strong>Proposta del sistema</strong>
                        <div><Chip cat={previewSugg.cat} /></div>
                        <span className="muted">{previewSugg.reason}</span>
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </div>
            <div className="m-foot">
              <p className="err" role="alert">{sErr}</p>
              <button type="button" className="btn" onClick={close}>Annulla</button>
              <button type="button" className="btn primary" onClick={handleSaveSample}>
                {activeModal === 'edit-sample' ? 'Salva modifiche esame' : 'Salva esame'}
              </button>
            </div>
          </>
        )}

        {/* MODAL 2: ADMIT PATIENT */}
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

        {/* MODAL 3: EDIT PATIENT */}
        {activeModal === 'edit-patient' && (
          <>
            <div className="m-head">
              <h2>Modifica Dati Paziente — Letto {epBed}</h2>
              <button type="button" className="btn small" onClick={close}>Chiudi</button>
            </div>
            <div className="m-body">
              <label className="fld">Letto assegnato
                <input 
                  type="text" 
                  value={epBed} 
                  onChange={e => setEpBed(e.target.value)}
                  placeholder="es. 1, 2, 9bis"
                />
              </label>
              <label className="fld">Codice paziente
                <input type="text" value={epCode} onChange={e => setEpCode(e.target.value)} autoComplete="off" />
              </label>
              <label className="fld">Età
                <input type="number" min="0" max="120" value={epAge} onChange={e => setEpAge(e.target.value)} />
              </label>
              <label className="fld">Sesso
                <select value={epSex} onChange={e => setEpSex(e.target.value)}>
                  <option>F</option><option>M</option>
                </select>
              </label>
              <label className="fld">Data ricovero
                <input type="date" value={epAdmitted} max={todayISO} onChange={e => setEpAdmitted(e.target.value)} />
              </label>
              <label className="fld">Misure d'isolamento
                <select value={epIsoType} onChange={e => setEpIsoType(e.target.value)}>
                  <option value="Nessuno">Nessun isolamento</option>
                  <option value="Contatto">Contatto</option>
                  <option value="Droplet">Droplet</option>
                  <option value="Respiratorio">Respiratorio (Aereo)</option>
                  <option value="Standard">Standard</option>
                </select>
              </label>

              {epIsoType !== 'Nessuno' && (
                <>
                  <label className="fld">Data inizio isolamento
                    <input type="date" value={epIsoSince} max={todayISO} onChange={e => setEpIsoSince(e.target.value)} />
                  </label>
                  <label className="fld">Motivo isolamento
                    <input type="text" placeholder="es. Portatore KPC, MRSA respiratorio" value={epIsoReason} onChange={e => setEpIsoReason(e.target.value)} />
                  </label>
                </>
              )}

              <label className="fld full">Sintesi clinica / Quadro d'ingresso
                <input type="text" placeholder="es. Sepsi addominale post-operatoria, shock settico" value={epSum} onChange={e => setEpSum(e.target.value)} />
              </label>

              <label className="fld full">Diagnosi microbiologica / Eziologica
                <input type="text" placeholder="es. VAP da Pseudomonas aeruginosa CR" value={epDx} onChange={e => setEpDx(e.target.value)} />
              </label>

              <label className="check full" style={{ marginTop: '4px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                <input 
                  type="checkbox" 
                  checked={epNodx} 
                  onChange={e => setEpNodx(e.target.checked)} 
                />
                <span>Segnala eziologia non ancora identificata / in approfondimento</span>
              </label>
            </div>
            <div className="m-foot">
              <p className="err" role="alert">{epErr}</p>
              <button type="button" className="btn" onClick={close}>Annulla</button>
              <button type="button" className="btn primary" onClick={handleSaveEditPatient}>Salva modifiche paziente</button>
            </div>
          </>
        )}

        {/* MODAL 4: NEW / EDIT ANTIBIOTIC THERAPY */}
        {activeModal === 'abx' && (
          <>
            <div className="m-head">
              <h2>{abxEditingId ? 'Modifica Terapia Antibiotica' : 'Nuova Terapia Antibiotica'}</h2>
              <button type="button" className="btn small" onClick={close}>Chiudi</button>
            </div>
            <div className="m-body">
              <label className="fld">Paziente
                <select value={abxPid} onChange={e => setAbxPid(e.target.value)} disabled={Boolean(abxEditingId)}>
                  {db.patients.slice().sort((a, b) => String(a.bed).localeCompare(String(b.bed), undefined, { numeric: true })).map(p => (
                    <option key={p.id} value={p.id}>Letto {p.bed}, {p.code}</option>
                  ))}
                </select>
              </label>

              <label className="fld">Farmaco / Molecola
                <input 
                  type="text" 
                  list="abx-list" 
                  placeholder="es. Meropenem" 
                  value={abxDrug} 
                  onChange={e => setAbxDrug(e.target.value)} 
                  autoComplete="off"
                  autoFocus
                />
                <datalist id="abx-list">
                  {ANTIBIOTIC_LIST.map(a => <option key={a} value={a} />)}
                </datalist>
              </label>

              <label className="fld">Dosaggio e Posologia
                <input 
                  type="text" 
                  placeholder="es. 2g q8h (inf. 3h)" 
                  value={abxDosage} 
                  onChange={e => setAbxDosage(e.target.value)} 
                />
              </label>

              <label className="fld">Via di somministrazione
                <select value={abxRoute} onChange={e => setAbxRoute(e.target.value)}>
                  {ADMINISTRATION_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>

              <label className="fld">Data inizio terapia
                <input type="date" value={abxStartDate} onChange={e => setAbxStartDate(e.target.value)} />
              </label>

              <label className="fld">Stato terapia
                <select value={abxStatus} onChange={e => setAbxStatus(e.target.value as any)}>
                  <option value="active">🟢 In corso (Attiva)</option>
                  <option value="completed">⚪ Conclusa / Storico</option>
                </select>
              </label>

              <label className="fld full">Indicazione clinica / Focus infettivo
                <input 
                  type="text" 
                  placeholder="es. Polmonite associata a ventilatore (VAP), Sepsi da CVC, Empirica" 
                  value={abxIndication} 
                  onChange={e => setAbxIndication(e.target.value)} 
                />
              </label>

              {abxStatus === 'completed' && (
                <>
                  <label className="fld">Data fine terapia
                    <input type="date" value={abxEndDate || todayISO} onChange={e => setAbxEndDate(e.target.value)} />
                  </label>

                  <label className="fld">Motivo conclusione
                    <input 
                      type="text" 
                      list="stop-reasons-list"
                      placeholder="es. De-escalation su antibiogramma" 
                      value={abxStopReason} 
                      onChange={e => setAbxStopReason(e.target.value)} 
                    />
                    <datalist id="stop-reasons-list">
                      {STOP_REASONS.map(r => <option key={r} value={r} />)}
                    </datalist>
                  </label>
                </>
              )}

              <label className="fld full">Note terapeutiche / Adeguamento renale (opzionale)
                <input 
                  type="text" 
                  placeholder="es. Monitoraggio TDM vancomicina mirato a trough 15-20 mcg/ml" 
                  value={abxNote} 
                  onChange={e => setAbxNote(e.target.value)} 
                />
              </label>
            </div>
            <div className="m-foot">
              <p className="err" role="alert">{abxErr}</p>
              <button type="button" className="btn" onClick={close}>Annulla</button>
              <button type="button" className="btn primary" onClick={handleSaveAntibiotic}>
                {abxEditingId ? 'Salva modifiche terapia' : 'Registra terapia'}
              </button>
            </div>
          </>
        )}

        {/* MODAL 5: STOP ANTIBIOTIC QUICK DIALOG */}
        {activeModal === 'stop-abx' && stoppingAbx && (
          <>
            <div className="m-head">
              <h2>Sospendi / Termina Terapia: {stoppingAbx.drug}</h2>
              <button type="button" className="btn small" onClick={close}>Chiudi</button>
            </div>
            <div className="m-body">
              <div className="full" style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}>
                <div><strong>Farmaco:</strong> {stoppingAbx.drug} ({stoppingAbx.dosage} {stoppingAbx.route || 'EV'})</div>
                <div className="muted" style={{ marginTop: '2px' }}>Iniziato il {stoppingAbx.startDate} {stoppingAbx.indication ? `per ${stoppingAbx.indication}` : ''}</div>
              </div>

              <label className="fld">Data di conclusione
                <input type="date" value={stopDate} max={todayISO} onChange={e => setStopDate(e.target.value)} />
              </label>

              <label className="fld">Motivo sospensione
                <select value={stopReason} onChange={e => setStopReason(e.target.value)}>
                  {STOP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>

              {stopReason === 'Altro' && (
                <label className="fld full">Specifica motivo
                  <input 
                    type="text" 
                    placeholder="Specifica il motivo clinico..." 
                    value={stopCustomReason} 
                    onChange={e => setStopCustomReason(e.target.value)} 
                    autoFocus
                  />
                </label>
              )}
            </div>
            <div className="m-foot">
              <button type="button" className="btn" onClick={close}>Annulla</button>
              <button type="button" className="btn primary" onClick={handleConfirmStopAbx}>
                Conferma conclusione e sposta nello storico
              </button>
            </div>
          </>
        )}

      </div>
    </>
  );
};
