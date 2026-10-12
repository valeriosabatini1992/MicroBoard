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

export const LABEL: Record<string, string> = { sig: '🔴 Infezione', col: '🟡 Colonizzazione', con: '⚪ Contaminazione', val: '🔵 Incerto' };
export const SHORT: Record<string, string> = { sig: '🔴 Infezione', col: '🟡 Colonizzazione', con: '⚪ Contaminazione' };
export const BEDS = 12;
export const SITES = ['Sangue', 'Liquor', 'Liquido pleurico', 'Aspirato tracheale', 'BAL', 'Urine', 'Tampone rettale', 'Tampone nasale', 'Punta di CVC', 'Siero', 'Feci', 'Ferita o altro'];
export const TESTS = ['Colturale', 'PCR/biologia molecolare', 'Sierologia', 'Antigene', 'Tossina'];
export const MDROS = ['', 'MRSA', 'VRE', 'ESBL', 'CRE/CPE', 'Acinetobacter CR', 'Pseudomonas CR', 'Candida auris'];
export const ORGS = ['Staphylococcus aureus (MSSA)', 'Staphylococcus aureus MRSA', 'Staphylococcus epidermidis', 'Escherichia coli', 'Klebsiella pneumoniae', 'Pseudomonas aeruginosa', 'Acinetobacter baumannii', 'Enterococcus faecalis', 'Enterococcus faecium', 'Candida albicans', 'Candida auris', 'Streptococcus pneumoniae', 'Bacillus cereus', 'Clostridioides difficile (tossina)', 'West Nile virus (IgM)'];

const STERILE = ['Liquor', 'Liquido pleurico'];
const SURV = ['Tampone rettale', 'Tampone nasale'];
const CONTAM = /epidermidis|coagulasi|CoNS|corynebacter|bacillus|cutibacter|propionibacter|viridans|mitis|oralis|sanguinis|salivarius|micrococc/i;
const TRUE_P = /aureus|candida|escherichia|e\. coli|klebsiella|pseudomonas|enterobacter|acinetobacter|pneumoniae|serratia|proteus|enterococc|pyogenes|agalactiae|listeria|neisseria/i;

export function suggest(s: Partial<Sample>): Proposal | null {
  if (s.result !== 'pos') return null;
  const org = s.org || '';
  const contam = CONTAM.test(org) && !TRUE_P.test(org);
  
  if (s.site && SURV.includes(s.site)) {
    return s.clinical
      ? { cat: 'val', reason: 'Tampone di sorveglianza con sospetto clinico di infezione nello stesso sito: valutare.' }
      : { cat: 'col', reason: 'Tampone di sorveglianza: di norma colonizzazione, non infezione.' };
  }
  
  if (s.test && ['Sierologia', 'PCR/biologia molecolare', 'Antigene', 'Tossina'].includes(s.test)) {
    if (s.test === 'Tossina' && !s.clinical) return { cat: 'val', reason: 'Tossina positiva senza sintomi clinici: possibile portatore, valutare.' };
    return { cat: 'sig', reason: 'Test diagnostico specifico positivo (' + s.test + ' su ' + s.site?.toLowerCase() + '): da leggere insieme al quadro clinico.' };
  }
  
  if (s.site === 'Sangue') {
    if (contam) {
      if ((s.setsPos || 0) >= 2) return { cat: 'sig', reason: org + ' in ' + s.setsPos + ' set su ' + s.setsTot + ': concordanza tra set, contaminazione poco probabile.' };
      if (s.clinical) return { cat: 'val', reason: org + ' in un solo set, ma con sospetto clinico: valutare, eventualmente ripetere le emocolture.' };
      return { cat: 'con', reason: org + ' in ' + (s.setsPos || 1) + ' set su ' + (s.setsTot || '?') + ': germe tipico di cute o ambiente, isolato in un solo set.' };
    }
    if (TRUE_P.test(org)) return { cat: 'sig', reason: org + ' in emocoltura: patogeno raramente contaminante, da considerare sempre significativo.' };
    return { cat: 'val', reason: 'Germe non previsto dalle regole: valutazione clinica.' };
  }
  
  if (s.site && STERILE.includes(s.site)) {
    if (contam) return { cat: 'val', reason: 'Germe di norma contaminante da sito sterile: valutare (materiale protesico o derivazione, ripetizione).' };
    return { cat: 'sig', reason: 'Isolamento da sito normalmente sterile.' };
  }
  
  if (s.site === 'Aspirato tracheale' || s.site === 'BAL') {
    if (/candida/i.test(org)) return { cat: 'col', reason: 'Candida da campione respiratorio: quasi sempre colonizzazione.' };
    if (s.site === 'BAL' && s.cfu && s.cfu >= 1e4) return { cat: 'sig', reason: 'BAL con carica di almeno 10^4 UFC/ml: soglia compatibile con polmonite.' };
    if (s.clinical) return { cat: 'val', reason: 'Campione respiratorio con sospetto clinico di VAP: valutare criteri clinici e radiologici.' };
    return { cat: 'col', reason: 'Campione respiratorio senza sospetto clinico di infezione: colonizzazione probabile.' };
  }
  
  if (s.site === 'Urine') {
    if (s.clinical) return { cat: 'val', reason: 'Urinocoltura con sospetto clinico di infezione urinaria: valutare.' };
    return { cat: 'col', reason: (/candida/i.test(org) ? 'Candiduria' : 'Urinocoltura') + ' senza sintomi né segni di infezione urinaria: colonizzazione probabile (catetere).' };
  }
  
  if (s.site === 'Punta di CVC') return { cat: 'val', reason: 'Punta di CVC: significativa solo con emocoltura concordante.' };
  
  return { cat: 'val', reason: 'Nessuna regola specifica per questo sito: valutazione clinica.' };
}
