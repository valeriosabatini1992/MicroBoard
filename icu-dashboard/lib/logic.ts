import { Sample, Proposal, CatType } from './types';

const pad = (n: number) => String(n).padStart(2, '0');
export const isoOf = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

export const NOW = new Date();
export const todayISO = isoOf(NOW);
export const ago = (n: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return isoOf(d);
};

export const fmt = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
export const fmtDMY = (s: string) => {
  if (!s) return '';
  const d = new Date(s + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
};
export const daysSince = (s: string) => Math.max(0, Math.round((new Date(todayISO + 'T12:00:00').getTime() - new Date(s + 'T12:00:00').getTime()) / 864e5));

export const isPendingCulture = (s: Sample) => s.result === 'pending' && (s.test === 'Colturale' || !s.test || s.test.toLowerCase().includes('coltur'));

export const LABEL: Record<string, string> = { sig: '🔴 Infezione', col: '🟡 Colonizzazione' };
export const SHORT: Record<string, string> = { sig: '🔴 Infezione', col: '🟡 Colonizzazione' };
export const BEDS = 12;
export const SITES = ['Sangue', 'Liquor', 'Liquido pleurico', 'Aspirato tracheale', 'BAL', 'Urine', 'Tampone rettale', 'Tampone nasale', 'Siero', 'Feci', 'Ferita o altro'];
export const TESTS = ['Colturale', 'PCR/biologia molecolare', 'Sierologia', 'Antigene', 'Tossina'];
export const MDROS = ['', 'MRSA', 'VRE', 'ESBL', 'CRE', 'Acinetobacter CR', 'Pseudomonas CR', 'Candida auris'];
export const ORGS = ['Staphylococcus aureus (MSSA)', 'Staphylococcus aureus MRSA', 'Staphylococcus epidermidis', 'Escherichia coli', 'Klebsiella pneumoniae', 'Pseudomonas aeruginosa', 'Acinetobacter baumannii', 'Enterococcus faecalis', 'Enterococcus faecium', 'Candida albicans', 'Candida auris', 'Streptococcus pneumoniae', 'Bacillus cereus', 'Clostridioides difficile (tossina)', 'West Nile virus (IgM)'];

const STERILE = ['Liquor', 'Liquido pleurico'];
const SURV = ['Tampone rettale', 'Tampone nasale'];

export function suggest(s: Partial<Sample>): Proposal | null {
  if (s.result !== 'pos') return null;
  const org = s.org || '';
  
  if (s.site && SURV.includes(s.site)) {
    return { cat: 'col', reason: 'Tampone di sorveglianza: di norma colonizzazione, non infezione.' };
  }
  
  if (s.test && ['Sierologia', 'PCR/biologia molecolare', 'Antigene', 'Tossina'].includes(s.test)) {
    return { cat: 'sig', reason: 'Test diagnostico specifico positivo (' + s.test + ' su ' + s.site?.toLowerCase() + '): indicativo di infezione.' };
  }
  
  if (s.site === 'Sangue') {
    return { cat: 'sig', reason: (org || 'Germe') + ' isolato da emocoltura: indicativo di infezione/batteriemia.' };
  }
  
  if (s.site && STERILE.includes(s.site)) {
    return { cat: 'sig', reason: 'Isolamento da sito normalmente sterile: indicativo di infezione.' };
  }
  
  if (s.site === 'Aspirato tracheale' || s.site === 'BAL') {
    if (/candida/i.test(org)) return { cat: 'col', reason: 'Candida da campione respiratorio: quasi sempre colonizzazione.' };
    if (s.site === 'BAL' && s.cfu && s.cfu >= 1e4) return { cat: 'sig', reason: 'BAL con carica di almeno 10^4 UFC/ml: soglia compatibile con polmonite.' };
    return { cat: 'col', reason: 'Campione respiratorio: verosimile colonizzazione.' };
  }
  
  if (s.site === 'Urine') {
    return { cat: 'col', reason: (/candida/i.test(org) ? 'Candiduria' : 'Urinocoltura') + ': verosimile colonizzazione.' };
  }
  
  return { cat: 'sig', reason: 'Isolamento microbiologico: indicativo di infezione.' };
}
