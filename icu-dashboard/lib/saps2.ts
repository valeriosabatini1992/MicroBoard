/**
 * SAPS II (Simplified Acute Physiology Score II)
 * Riferimento scientifico: Le Gall JR, Lemeshow S, Saulnier F. 
 * A new Simplified Acute Physiology Score (SAPS II) based on a European/North American multicenter study.
 * JAMA 1993; 270(24):2957-2963.
 */

export interface Saps2ItemOption {
  label: string;
  points: number;
  hint?: string;
}

export interface Saps2FieldDef {
  id: keyof Saps2State;
  title: string;
  category: 'demographics' | 'vitals' | 'respiratory' | 'lab';
  options: Saps2ItemOption[];
}

export interface Saps2State {
  age: number; // 0, 7, 12, 15, 16, 18
  heartRate: number; // 0, 2, 4, 7, 11
  systolicBp: number; // 0, 2, 5, 13
  temperature: number; // 0, 3
  pao2Fio2: number; // 0, 6, 9, 11
  urinaryOutput: number; // 0, 4, 11
  urea: number; // 0, 6, 10
  wbc: number; // 0, 3, 12
  potassium: number; // 0, 3
  sodium: number; // 0, 1, 5
  bicarbonate: number; // 0, 3, 5
  bilirubin: number; // 0, 4, 9
  gcs: number; // 0, 5, 7, 13, 26
  admissionType: number; // 0, 6, 8
  chronicDisease: number; // 0, 9, 10, 17
}

export const INITIAL_SAPS2_STATE: Saps2State = {
  age: 0,
  heartRate: 0,
  systolicBp: 0,
  temperature: 0,
  pao2Fio2: 0,
  urinaryOutput: 0,
  urea: 0,
  wbc: 0,
  potassium: 0,
  sodium: 0,
  bicarbonate: 0,
  bilirubin: 0,
  gcs: 0,
  admissionType: 6, // default medico (più frequente in T.I. medica o 0 programmato)
  chronicDisease: 0,
};

export function getAgePoints(age: number): number {
  if (age < 40) return 0;
  if (age <= 59) return 7;
  if (age <= 69) return 12;
  if (age <= 74) return 15;
  if (age <= 79) return 16;
  return 18;
}

export function calculateSaps2Score(state: Saps2State): number {
  return (
    (state.age || 0) +
    (state.heartRate || 0) +
    (state.systolicBp || 0) +
    (state.temperature || 0) +
    (state.pao2Fio2 || 0) +
    (state.urinaryOutput || 0) +
    (state.urea || 0) +
    (state.wbc || 0) +
    (state.potassium || 0) +
    (state.sodium || 0) +
    (state.bicarbonate || 0) +
    (state.bilirubin || 0) +
    (state.gcs || 0) +
    (state.admissionType || 0) +
    (state.chronicDisease || 0)
  );
}

export function calculateSaps2Mortality(score: number): number {
  if (score <= 0) return 0;
  // Logit = -7.7631 + 0.0737 * SAPS2 + 0.9971 * ln(SAPS2 + 1)
  const logit = -7.7631 + 0.0737 * score + 0.9971 * Math.log(score + 1);
  const mortality = (Math.exp(logit) / (1 + Math.exp(logit))) * 100;
  return Math.round(mortality * 10) / 10;
}

export const SAPS2_FIELDS: Saps2FieldDef[] = [
  // 1. Demografia & Ammissione
  {
    id: 'age',
    title: 'Età del paziente',
    category: 'demographics',
    options: [
      { label: '< 40 anni', points: 0 },
      { label: '40 - 59 anni', points: 7 },
      { label: '60 - 69 anni', points: 12 },
      { label: '70 - 74 anni', points: 15 },
      { label: '75 - 79 anni', points: 16 },
      { label: '≥ 80 anni', points: 18 },
    ],
  },
  {
    id: 'admissionType',
    title: 'Tipo di Ricovero',
    category: 'demographics',
    options: [
      { label: 'Chirurgico programmato', points: 0 },
      { label: 'Medico', points: 6 },
      { label: 'Chirurgico non programmato / urgente', points: 8 },
    ],
  },
  {
    id: 'chronicDisease',
    title: 'Patologia Cronica Sottostante',
    category: 'demographics',
    options: [
      { label: 'Nessuna delle seguenti', points: 0 },
      { label: 'Neoplasia metastatica', points: 9 },
      { label: 'Ematologica maligna (linfoma, leucemia, mieloma)', points: 10 },
      { label: 'AIDS', points: 17 },
    ],
  },

  // 2. Parametri Vitali & Neurologici
  {
    id: 'heartRate',
    title: 'Frequenza Cardiaca (peggior valore 24h)',
    category: 'vitals',
    options: [
      { label: '70 - 119 bpm (normale)', points: 0 },
      { label: '40 - 69 bpm', points: 2 },
      { label: '120 - 159 bpm', points: 4 },
      { label: '≥ 160 bpm', points: 7 },
      { label: '< 40 bpm', points: 11 },
    ],
  },
  {
    id: 'systolicBp',
    title: 'Pressione Sistolica (peggior valore 24h)',
    category: 'vitals',
    options: [
      { label: '100 - 199 mmHg (normale)', points: 0 },
      { label: '≥ 200 mmHg', points: 2 },
      { label: '70 - 99 mmHg', points: 5 },
      { label: '< 70 mmHg', points: 13 },
    ],
  },
  {
    id: 'temperature',
    title: 'Temperatura Corporea',
    category: 'vitals',
    options: [
      { label: '< 39.0 °C (normale)', points: 0 },
      { label: '≥ 39.0 °C', points: 3 },
    ],
  },
  {
    id: 'gcs',
    title: 'Glasgow Coma Scale (GCS)',
    category: 'vitals',
    options: [
      { label: 'GCS 14 - 15 (normale)', points: 0 },
      { label: 'GCS 11 - 13', points: 5 },
      { label: 'GCS 9 - 10', points: 7 },
      { label: 'GCS 6 - 8', points: 13 },
      { label: 'GCS < 6', points: 26 },
    ],
  },

  // 3. Respiratorio & Diuresi
  {
    id: 'pao2Fio2',
    title: 'PaO₂ / FiO₂ (se ventilazione meccanica o CPAP)',
    category: 'respiratory',
    options: [
      { label: 'Non ventilato / No CPAP', points: 0 },
      { label: '≥ 200 mmHg', points: 6 },
      { label: '100 - 199 mmHg', points: 9 },
      { label: '< 100 mmHg', points: 11 },
    ],
  },
  {
    id: 'urinaryOutput',
    title: 'Diuresi 24 ore',
    category: 'respiratory',
    options: [
      { label: '≥ 1.00 L / 24h (≥ 1000 mL)', points: 0 },
      { label: '0.50 - 0.99 L / 24h (500 - 999 mL)', points: 4 },
      { label: '< 0.50 L / 24h (< 500 mL)', points: 11 },
    ],
  },

  // 4. Laboratorio
  {
    id: 'urea',
    title: 'Azotemia / Urea Sierica (BUN)',
    category: 'lab',
    options: [
      { label: 'Urea < 0.60 g/L (BUN < 28 mg/dL)', points: 0 },
      { label: 'Urea 0.60 - 1.79 g/L (BUN 28 - 83.9 mg/dL)', points: 6 },
      { label: 'Urea ≥ 1.80 g/L (BUN ≥ 84 mg/dL)', points: 10 },
    ],
  },
  {
    id: 'wbc',
    title: 'Globuli Bianchi (Leucociti / WBC)',
    category: 'lab',
    options: [
      { label: '1.0 - 19.9 x10⁹/L (1.000 - 19.999 /mm³)', points: 0 },
      { label: '≥ 20.0 x10⁹/L (≥ 20.000 /mm³)', points: 3 },
      { label: '< 1.0 x10⁹/L (< 1.000 /mm³)', points: 12 },
    ],
  },
  {
    id: 'potassium',
    title: 'Potassiemia (K⁺)',
    category: 'lab',
    options: [
      { label: '3.0 - 4.9 mEq/L (normale)', points: 0 },
      { label: '< 3.0 mEq/L', points: 3 },
      { label: '≥ 5.0 mEq/L', points: 3 },
    ],
  },
  {
    id: 'sodium',
    title: 'Sodiemia (Na⁺)',
    category: 'lab',
    options: [
      { label: '125 - 144 mEq/L (normale)', points: 0 },
      { label: '≥ 145 mEq/L', points: 1 },
      { label: '< 125 mEq/L', points: 5 },
    ],
  },
  {
    id: 'bicarbonate',
    title: 'Bicarbonati Sierici (HCO₃⁻)',
    category: 'lab',
    options: [
      { label: '≥ 20 mEq/L (normale)', points: 0 },
      { label: '15 - 19 mEq/L', points: 3 },
      { label: '< 15 mEq/L', points: 5 },
    ],
  },
  {
    id: 'bilirubin',
    title: 'Bilirubina Totale',
    category: 'lab',
    options: [
      { label: '< 4.0 mg/dL (< 68.4 µmol/L)', points: 0 },
      { label: '4.0 - 5.9 mg/dL (68.4 - 102.5 µmol/L)', points: 4 },
      { label: '≥ 6.0 mg/dL (≥ 102.6 µmol/L)', points: 9 },
    ],
  },
];
