'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { DB, Patient, Sample, CatType, AntibioticTherapy, PatientDevice } from './types';
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
  deleteSample: (sid: string) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (pid: string, updates: Partial<Patient>) => void;
  deletePatient: (pid: string) => void;
  addAntibiotic: (abx: Omit<AntibioticTherapy, 'id'> | AntibioticTherapy) => void;
  updateAntibiotic: (id: string, updates: Partial<AntibioticTherapy>) => void;
  stopAntibiotic: (id: string, stopReason?: string, endDate?: string) => void;
  deleteAntibiotic: (id: string) => void;
  addDevice: (device: Omit<PatientDevice, 'id'> | PatientDevice) => void;
  updateDevice: (id: string, updates: Partial<PatientDevice>) => void;
  deleteDevice: (id: string) => void;
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
    tab: 'map',
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
            if (!remoteData.antibiotics) {
              remoteData.antibiotics = seed.antibiotics || [];
            }
            if (!remoteData.devices) {
              remoteData.devices = seed.devices || [];
            }
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
      // Sanitize JSON payload to strip any undefined values and prevent Firestore rejection
      const cleanDb: DB = JSON.parse(JSON.stringify(newDb));
      const docRef = doc(firestore, 'wards', WARD_DOC_ID);
      await setDoc(docRef, cleanDb);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanDb));
      } catch (e) {}
      setSyncStatus('synced');
    } catch (error) {
      console.error('Errore salvataggio Firestore:', error);
      setSyncStatus('error');
    }
  };

  const updateDb = (fn: (draft: DB) => void) => {
    setDb(prev => {
      const next: DB = { 
        ...prev, 
        patients: [...prev.patients], 
        samples: [...prev.samples],
        antibiotics: prev.antibiotics ? [...prev.antibiotics] : [],
        devices: prev.devices ? [...prev.devices] : []
      };
      fn(next);
      const cleanDb: DB = JSON.parse(JSON.stringify(next));
      saveToFirestore(cleanDb);
      return cleanDb;
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
      if (d.antibiotics) {
        d.antibiotics = d.antibiotics.filter(a => a.pid !== pid);
      }
      if (d.devices) {
        d.devices = d.devices.filter(dev => dev.pid !== pid);
      }
    });
    updateUi({ pid: null, confirmFree: null });
  };

  const deletePatient = (pid: string) => {
    freeBed(pid);
  };

  const updatePatient = (pid: string, updates: Partial<Patient>) => {
    updateDb(d => {
      const p = d.patients.find(x => x.id === pid);
      if (p) {
        Object.assign(p, updates);
      }
    });
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

  const deleteSample = (sid: string) => {
    updateDb(d => {
      d.samples = d.samples.filter(s => s.id !== sid);
    });
  };

  const addPatient = (patient: Patient) => {
    const cleanPatient: Patient = {
      id: patient.id || ('p' + Date.now()),
      bed: patient.bed,
      code: patient.code,
      age: patient.age,
      sex: patient.sex,
      admitted: patient.admitted,
      summary: patient.summary || '',
      dx: patient.dx || '',
      iso: patient.iso || null,
      nodx: Boolean(patient.nodx),
      saps2: typeof patient.saps2 === 'number' ? patient.saps2 : null,
      airway: patient.airway || null,
    };
    updateDb(d => {
      d.patients.push(cleanPatient);
    });
    updateUi({ pid: cleanPatient.id });
  };

  const addAntibiotic = (abx: Omit<AntibioticTherapy, 'id'> | AntibioticTherapy) => {
    updateDb(d => {
      if (!d.antibiotics) d.antibiotics = [];
      const newAbx: AntibioticTherapy = {
        id: (abx as any).id || ('abx_' + Date.now() + Math.random().toString(36).substring(2, 6)),
        pid: abx.pid,
        drug: abx.drug,
        dosage: abx.dosage,
        route: abx.route || 'EV',
        startDate: abx.startDate,
        endDate: abx.endDate || null,
        status: abx.status || 'active',
        indication: abx.indication || '',
        stopReason: abx.stopReason || '',
        note: abx.note || ''
      };
      d.antibiotics.push(newAbx);
    });
  };

  const updateAntibiotic = (id: string, updates: Partial<AntibioticTherapy>) => {
    updateDb(d => {
      if (!d.antibiotics) return;
      const a = d.antibiotics.find(x => x.id === id);
      if (a) {
        Object.assign(a, updates);
      }
    });
  };

  const stopAntibiotic = (id: string, stopReason?: string, endDate?: string) => {
    updateDb(d => {
      if (!d.antibiotics) return;
      const a = d.antibiotics.find(x => x.id === id);
      if (a) {
        a.status = 'completed';
        a.endDate = endDate || todayISO;
        if (stopReason) a.stopReason = stopReason;
      }
    });
  };

  const deleteAntibiotic = (id: string) => {
    updateDb(d => {
      if (!d.antibiotics) return;
      d.antibiotics = d.antibiotics.filter(x => x.id !== id);
    });
  };

  const addDevice = (device: Omit<PatientDevice, 'id'> | PatientDevice) => {
    updateDb(d => {
      if (!d.devices) d.devices = [];
      const newDev: PatientDevice = {
        id: (device as any).id || ('dev_' + Date.now() + Math.random().toString(36).substring(2, 6)),
        pid: device.pid,
        type: device.type,
        insertionDate: device.insertionDate,
        removalDate: device.removalDate || null,
        site: device.site || '',
        note: device.note || ''
      };
      d.devices.push(newDev);
    });
  };

  const updateDevice = (id: string, updates: Partial<PatientDevice>) => {
    updateDb(d => {
      if (!d.devices) return;
      const dev = d.devices.find(x => x.id === id);
      if (dev) {
        Object.assign(dev, updates);
      }
    });
  };

  const deleteDevice = (id: string) => {
    updateDb(d => {
      if (!d.devices) return;
      d.devices = d.devices.filter(x => x.id !== id);
    });
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
    updateUi({ pid: null, tab: 'map' });
  };

  const resetDemoData = () => {
    if (confirm('Vuoi ripristinare i 5 letti demo iniziali? Tutte le modifiche (anche online) verranno sovrascritte.')) {
      setDb(seed);
      saveToFirestore(seed);
      updateUi({ pid: null, tab: 'map' });
    }
  };

  return (
    <DashboardContext.Provider value={{
      db, ui, syncStatus, setTab, setPid, setConfirmFree, setOperator,
      confirmSample, reopenSample, startIsolation, stopIsolation,
      toggleNodx, freeBed, addSample, updateSample, deleteSample,
      addPatient, updatePatient, deletePatient,
      addAntibiotic, updateAntibiotic, stopAntibiotic, deleteAntibiotic,
      addDevice, updateDevice, deleteDevice,
      exportData, importData, resetDemoData
    }}>
      {children}
    </DashboardContext.Provider>
  );
};
