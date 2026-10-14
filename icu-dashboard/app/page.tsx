'use client';
import React, { useRef } from 'react';
import { DashboardProvider, useDashboard } from '@/lib/store';
import { BedBoard } from '@/components/BedBoard';
import { WardMap } from '@/components/WardMap';
import { Queue } from '@/components/Queue';
import { MdroList } from '@/components/MdroList';
import { PatientDetailModal } from '@/components/PatientDetailModal';
import { Modals } from '@/components/Modals';
import { AuthGate, logoutApp } from '@/components/AuthGate';
import { isPendingCulture } from '@/lib/logic';

const Header = () => {
  const { db, syncStatus, setOperator, exportData, importData, resetDemoData } = useDashboard();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result as string);
        if (!Array.isArray(d.patients) || !Array.isArray(d.samples)) throw new Error('formato');
        d.operator = d.operator || '';
        importData(d);
      } catch (err) {
        alert('File non valido: usa un file esportato da questa app.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <span className="sync-status" title="Sincronizzato in tempo reale su Firebase con tutti i dispositivi">
            🟢 Online (Firebase)
          </span>
        );
      case 'saving':
        return (
          <span className="sync-status" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }} title="Salvataggio sul cloud in corso...">
            🟡 Salvataggio...
          </span>
        );
      case 'error':
        return (
          <span className="sync-status" style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }} title="Errore di sincronizzazione online. Controlla le regole Firestore.">
            ⚠️ Errore Cloud
          </span>
        );
      default:
        return (
          <span className="sync-status">
            ⚪ Offline
          </span>
        );
    }
  };

  return (
    <header className="top">
      <div>
        <h1>MicroBoard</h1>
        {/* Didascalia nascosta su richiesta:
        <p>Terapia intensiva. Prototipo con pazienti e referti: le regole di classificazione sono esempi da validare con il microbiologo o l'infettivologo prima di qualsiasi uso reale.</p>
        */}
      </div>
      {/* Barra strumenti nascosta su richiesta (sync, operatore, nuovo esame, esporta/importa, demo, esci)
      <div className="tools">
        {getSyncBadge()}
        <label>Operatore 
          <input 
            type="text" 
            placeholder="Il tuo nome" 
            autoComplete="off"
            value={db.operator}
            onChange={(e) => setOperator(e.target.value)}
          />
        </label>
        <button className="btn primary" type="button" onClick={() => document.dispatchEvent(new CustomEvent('open-sample-modal'))}>
          + Nuovo esame
        </button>
        <button className="btn" type="button" onClick={exportData} title="Scarica backup JSON">Esporta</button>
        <button className="btn" type="button" onClick={() => fileInputRef.current?.click()} title="Carica backup JSON">Importa</button>
        <button className="btn" type="button" onClick={resetDemoData} title="Ripristina i 5 letti di prova iniziali su Firebase">
          Ripristina 5 Letti demo
        </button>
        <button className="btn" type="button" onClick={logoutApp} title="Esci dalla sessione protetta">
          Esci 🔒
        </button>
        <input type="file" accept="application/json" hidden ref={fileInputRef} onChange={handleImport} />
      </div>
      */}
    </header>
  );
};

const Stats = () => {
  const { db, setTab } = useDashboard();
  
  const pend = db.samples.filter(s => isPendingCulture(s) && db.patients.some(p => p.id === s.pid)).length;
  const sigP = new Set(db.samples.filter(s => s.result === 'pos' && s.status === 'confirmed' && s.cat === 'sig').map(s => s.pid)).size;
  const mdroP = new Set(db.samples.filter(s => s.result === 'pos' && s.mdro && !(s.status === 'confirmed' && s.cat === 'con') && db.patients.find(p => p.id === s.pid)).map(s => s.pid)).size;
  const isoP = db.patients.filter(p => p.iso).length;

  return (
    <section className="stats" aria-label="Riepilogo">
      <button type="button" className="stat pend" onClick={() => setTab('queue')}><b>{pend}</b>colturali in corso</button>
      <button type="button" className="stat sig" onClick={() => setTab('beds')}><b>{sigP}</b>pazienti con infezioni</button>
      <button type="button" className="stat mdro" onClick={() => setTab('mdro')}><b>{mdroP}</b>pazienti con MDRO</button>
      <button type="button" className="stat iso" onClick={() => setTab('mdro')}><b>{isoP}</b>in isolamento</button>
    </section>
  );
};

const Tabs = () => {
  const { db, ui, setTab } = useDashboard();
  const pend = db.samples.filter(s => isPendingCulture(s) && db.patients.some(p => p.id === s.pid)).length;

  const tabs = [
    { id: 'beds', label: 'Letti' },
    { id: 'map', label: 'Mappa reparto' },
    { id: 'queue', label: 'Da rivedere', count: pend },
    { id: 'mdro', label: 'MDRO e isolamenti' }
  ];

  return (
    <nav className="tabs" aria-label="Sezioni">
      {tabs.map(t => (
        <button 
          key={t.id} 
          type="button" 
          className="tab" 
          aria-current={ui.tab === t.id} 
          onClick={() => setTab(t.id)}
        >
          {t.label}
          {t.count ? <span className="n">{t.count}</span> : null}
        </button>
      ))}
    </nav>
  );
};

const DashboardContent = () => {
  const { ui } = useDashboard();
  
  return (
    <div className="wrap">
      <Header />
      <Stats />
      <Tabs />

      <div className="layout">
        <main id="list">
          {ui.tab === 'beds' && <BedBoard />}
          {ui.tab === 'map' && <WardMap />}
          {ui.tab === 'queue' && <Queue />}
          {ui.tab === 'mdro' && <MdroList />}
        </main>
      </div>
      <PatientDetailModal />
      <Modals />
    </div>
  );
};

export default function Page() {
  return (
    <AuthGate>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </AuthGate>
  );
}
