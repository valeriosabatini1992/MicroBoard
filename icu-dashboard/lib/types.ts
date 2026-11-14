export type ResultType = 'pos' | 'neg' | 'pending';
export type CatType = 'sig' | 'col';
export type StatusType = 'pending' | 'confirmed' | 'none';

export interface Proposal {
  cat: CatType;
  reason: string;
}

export interface Sample {
  id: string;
  pid: string;
  date: string;
  result: ResultType;
  site: string;
  test: string;
  org: string;
  label: string;
  setsPos: number | null;
  setsTot: number | null;
  cfu: number | null;
  mdro: string;
  ab?: string;
  clinical?: boolean;
  bloodDrawSite?: string;
  isCompleteBloodCulture?: boolean;
  proposal: Proposal | null;
  status: StatusType;
  cat: CatType | null;
  by: string;
  at: string;
  note: string;
}

export interface Patient {
  id: string;
  bed: number | string; // string used for non-numeric beds, e.g. "9bis"
  code: string;
  age: number;
  sex: string;
  admitted: string;
  summary: string;
  dx: string;
  iso: {
    type: string;
    since: string;
    reason: string;
  } | null;
  nodx: boolean;
  isDemo?: boolean;
}

export interface AntibioticTherapy {
  id: string;
  pid: string;
  drug: string;
  dosage: string;
  route?: string; // 'EV' | 'OS' | 'Inalatoria' | 'Intratecale' | string
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  status: 'active' | 'completed' | 'stopped';
  indication?: string; // es. "VAP", "Sepsi CVC", "Empirica"
  stopReason?: string; // es. "Completato ciclo", "De-escalation", "Tossicità"
  note?: string;
}

export interface DB {
  operator: string;
  patients: Patient[];
  samples: Sample[];
  antibiotics?: AntibioticTherapy[];
}
