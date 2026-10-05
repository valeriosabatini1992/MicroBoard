'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DB, Patient, Sample, CatType } from './types';
import { seed } from './data';
import { todayISO, suggest } from './logic';

interface DashboardContextType {
  db: DB;
  ui: {
    tab: string;
    pid: string | null;
    confirmFree: string | null;
  };
  setTab: (tab: string) => void;
  setPid: (pid: string | null) => void;
  setConfirmFree: (pid: string | null) => void;
  setOperator: (op: string) => void;
  confirmSample: (sid: string, cat: CatType) => void;
  reopenSample: (sid: string) => void;
  startIsolation: (pid: string, type: string) => void;
  stopIsolation: (pid: string) => void;
  toggleNodx: (pid: string) => void;
  freeBed: (pid: string) => void;
  addSample: (sample: Sample) => void;
  addPatient: (patient: Patient) => void;
  exportData: () => void;
  importData: (db: DB) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within a DashboardProvider');
  return ctx;
};

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<DB>(seed);
  const [ui, setUi] = useState({
    tab: 'beds',
    pid: null as string | null,
    confirmFree: null as string | null
  });

  const updateDb = (fn: (draft: DB) => void) => {
    setDb(prev => {
      const next = { ...prev, patients: [...prev.patients], samples: [...prev.samples] };
      fn(next);
      return next;
    });
  };

  const updateUi = (updates: Partial<typeof ui>) => {
    setUi(prev => ({ ...prev, ...updates }));
  };

  const setTab = (tab: string) => updateUi({ tab });
  const setPid = (pid: string | null) => updateUi({ pid, confirmFree: null });
  const setConfirmFree = (confirmFree: string | null) => updateUi({ confirmFree });
  const setOperator = (operator: string) => updateDb(d => { d.operator = operator; });

  const confirmSample = (sid: string, cat: CatType) => {
    updateDb(d => {
      const s = d.samples.find(x => x.id === sid);
      if (s) {
        s.status = 'confirmed';
        s.cat = cat;
        s.by = d.operator.trim() || 'Operatore';
        s.at = todayISO;
      }
    });
  };

  const reopenSample = (sid: string) => {
    updateDb(d => {
      const s = d.samples.find(x => x.id === sid);
      if (s) {
        s.status = 'pending';
        s.cat = null;
        s.by = '';
        s.at = '';
      }
    });
  };

  const startIsolation = (pid: string, type: string) => {
    updateDb(d => {
      const p = d.patients.find(x => x.id === pid);
      if (p) {
        const m = d.samples.filter(s => s.pid === p.id && s.result === 'pos' && s.mdro && !(s.status === 'confirmed' && s.cat === 'con'))[0];
        p.iso = {
          type,
          since: todayISO,
          reason: m ? (m.mdro + (m.org ? ' (' + m.org + ')' : '')) : 'Motivo non indicato'
        };
      }
    });
  };

  const stopIsolation = (pid: string) => {
    updateDb(d => {
      const p = d.patients.find(x => x.id === pid);
      if (p) p.iso = null;
    });
  };

  const toggleNodx = (pid: string) => {
    updateDb(d => {
      const p = d.patients.find(x => x.id === pid);
      if (p) p.nodx = !p.nodx;
    });
  };

  const freeBed = (pid: string) => {
    updateDb(d => {
      d.patients = d.patients.filter(p => p.id !== pid);
      d.samples = d.samples.filter(s => s.pid !== pid);
    });
    updateUi({ pid: null, confirmFree: null });
  };

  const addSample = (sample: Sample) => {
    updateDb(d => {
      d.samples.push(sample);
    });
    updateUi({ pid: sample.pid });
  };

  const addPatient = (patient: Patient) => {
    updateDb(d => {
      d.patients.push(patient);
    });
    updateUi({ pid: patient.id, tab: 'beds' });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const l = document.createElement('a');
    l.href = url;
    l.download = 'microbiologia-ti-' + todayISO + '.json';
    document.body.appendChild(l);
    l.click();
    l.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  const importData = (newDb: DB) => {
    setDb(newDb);
    updateUi({ pid: null, tab: 'beds' });
  };

  return (
    <DashboardContext.Provider value={{
      db, ui, setTab, setPid, setConfirmFree, setOperator,
      confirmSample, reopenSample, startIsolation, stopIsolation,
      toggleNodx, freeBed, addSample, addPatient, exportData, importData
    }}>
      {children}
    </DashboardContext.Provider>
  );
};
