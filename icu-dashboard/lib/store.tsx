'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { DB, Patient, Sample, CatType } from './types';
import { seed } from './data';
import { todayISO } from './logic';
import { firestore } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'microboard_data_v2';
const WARD_DOC_ID = 'main';

interface DashboardContextType {
  db: DB;
  ui: {
    tab: string;
    pid: string | null;
    confirmFree: string | null;
  };
  syncStatus: 'synced' | 'saving' | 'error' | 'offline';
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
  updateSample: (sid: string, updates: Partial<Sample>) => void;
  addPatient: (patient: Patient) => void;
  exportData: () => void;
  importData: (db: DB) => void;
  resetDemoData: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within a DashboardProvider');
  return ctx;
};

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<DB>(seed);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error' | 'offline'>('synced');
  const [ui, setUi] = useState({
    tab: 'beds',
    pid: null as string | null,
    confirmFree: null as string | null
  });

  const isRemoteUpdate = useRef(false);

  // Synchronize in Realtime with Firebase Firestore
  useEffect(() => {
    const docRef = doc(firestore, 'wards', WARD_DOC_ID);

    // Initial local cache fallback
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.patients && parsed?.samples) {
          setDb(parsed);
        }
      }
    } catch (e) {
      console.warn('Cache locale read error:', e);
    }

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as DB;
          if (Array.isArray(remoteData.patients) && Array.isArray(remoteData.samples)) {
            isRemoteUpdate.current = true;
            setDb(remoteData);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
            } catch (err) {}
            setSyncStatus('synced');
          }
        } else {
          // Document does not exist in Firestore yet: initialize with seed (5 demo beds)
          setDoc(docRef, seed).catch((err) => {
            console.error('Inizializzazione Firestore fallita:', err);
          });
        }
      },
      (error) => {
        console.error('Firestore snapshot error:', error);
        setSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, []);

  // Save changes to Firestore
  const saveToFirestore = async (newDb: DB) => {
    setSyncStatus('saving');
    try {
      const docRef = doc(firestore, 'wards', WARD_DOC_ID);
      await setDoc(docRef, newDb);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDb));
      } catch (e) {}
      setSyncStatus('synced');
    } catch (error) {
      console.error('Errore salvataggio Firestore:', error);
      setSyncStatus('error');
    }
  };

  const updateDb = (fn: (draft: DB) => void) => {
    setDb(prev => {
      const next = { ...prev, patients: [...prev.patients], samples: [...prev.samples] };
      fn(next);
      saveToFirestore(next);
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
        const m = d.samples.filter(s => s.pid === p.id && s.result === 'pos' && s.mdro)[0];
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
      const sampleWithId: Sample = {
        ...sample,
        id: sample.id || ('s' + Date.now() + Math.random().toString(36).substring(2, 6))
      };
      d.samples.push(sampleWithId);
    });
    updateUi({ pid: sample.pid });
  };

  const updateSample = (sid: string, updates: Partial<Sample>) => {
    updateDb(d => {
      const s = d.samples.find(x => x.id === sid);
      if (s) {
        Object.assign(s, updates);
      }
    });
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
    saveToFirestore(newDb);
    updateUi({ pid: null, tab: 'beds' });
  };

  const resetDemoData = () => {
    if (confirm('Vuoi ripristinare i 5 letti demo iniziali? Tutte le modifiche (anche online) verranno sovrascritte.')) {
      setDb(seed);
      saveToFirestore(seed);
      updateUi({ pid: null, tab: 'beds' });
    }
  };

  return (
    <DashboardContext.Provider value={{
      db, ui, syncStatus, setTab, setPid, setConfirmFree, setOperator,
      confirmSample, reopenSample, startIsolation, stopIsolation,
      toggleNodx, freeBed, addSample, updateSample, addPatient, exportData, importData, resetDemoData
    }}>
      {children}
    </DashboardContext.Provider>
  );
};
