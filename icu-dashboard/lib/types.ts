export type ResultType = 'pos' | 'neg' | 'pending';
export type CatType = 'sig' | 'col' | 'con' | 'val';
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
  ab: string;
  clinical: boolean;
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

export interface DB {
  operator: string;
  patients: Patient[];
  samples: Sample[];
}
