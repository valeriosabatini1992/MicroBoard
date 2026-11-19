import { DB, Sample, CatType, StatusType } from './types';
import { suggest, ago } from './logic';

let uid = 100;

function mk(o: Partial<Sample>): Sample {
  const s: Sample = {
    id: o.id || 's' + (uid++),
    pid: o.pid || '',
    date: o.date || '',
    result: o.result || 'pos',
    site: o.site || '',
    test: o.test || '',
    org: o.org || '',
    label: o.label || '',
    setsPos: o.setsPos ?? null,
    setsTot: o.setsTot ?? null,
    cfu: o.cfu ?? null,
    mdro: o.mdro || '',
    ab: o.ab || '',
    clinical: o.clinical || false,
    bloodDrawSite: o.bloodDrawSite || (o.site === 'Sangue' ? 'CVP/CVC' : undefined),
    isCompleteBloodCulture: o.isCompleteBloodCulture ?? (o.site === 'Sangue'),
    proposal: null,
    status: o.status || (o.result === 'pos' ? 'pending' : 'none'),
    cat: o.cat || null,
    by: o.by || '',
    at: o.at || '',
    note: o.note || ''
  };
  
  s.proposal = suggest(s);
  if (o.status) s.status = o.status;
  else s.status = s.result === 'pos' ? 'pending' : 'none';
  
  return s;
}

const OP = 'Dott. Rossi';
const conf = (cat: CatType, at: string) => ({ status: 'confirmed' as StatusType, cat, by: OP, at });

export const seed: DB = {
  operator: '',
  patients: [
    {id:'p1', bed:1, code:'TI-0417', age:58, sex:'M', admitted:ago(3), summary:'Meningite batterica', dx:'Meningite pneumococcica', iso:null, nodx:false, saps2: 38, allergies: 'Penicilline'},
    {id:'p2', bed:2, code:'TI-0388', age:47, sex:'F', admitted:ago(9), summary:'Encefalite', dx:'Encefalite da West Nile virus', iso:null, nodx:false, saps2: 29},
    {id:'p3', bed:3, code:'TI-0402', age:71, sex:'M', admitted:ago(11), summary:'Encefalite', dx:'Eziologia non ancora identificata', iso:null, nodx:true, saps2: 41},
    {id:'p4', bed:4, code:'TI-0421', age:66, sex:'F', admitted:ago(14), summary:'Polmonite associata a ventilatore', dx:'VAP da Pseudomonas aeruginosa resistente ai carbapenemi', iso:{type:'Contatto', since:ago(6), reason:'Pseudomonas CR'}, nodx:false, saps2: 56, airway: 'IOT'},
    {id:'p5', bed:5, code:'TI-0409', age:63, sex:'M', admitted:ago(20), summary:'Sepsi addominale post-operatoria', dx:'Colonizzazione rettale da KPC', iso:{type:'Contatto', since:ago(15), reason:'CRE da tampone rettale'}, nodx:false, saps2: 44},
    {id:'p6', bed:6, code:'TI-0425', age:79, sex:'F', admitted:ago(8), summary:'Insufficienza respiratoria acuta', dx:'Encefalite Erpetica HSV-1', iso:{type:'Contatto', since:ago(7), reason:'MRSA da tampone nasale'}, nodx:false, saps2: 48},
    {id:'p7', bed:7, code:'TI-0431', age:52, sex:'M', admitted:ago(5), summary:'Shock settico di origine addominale', dx:'', iso:null, nodx:false, saps2: 62},
    {id:'p8', bed:8, code:'TI-0399', age:34, sex:'F', admitted:ago(12), summary:'Sepsi da catetere venoso centrale', dx:'Batteriemia da S. aureus', iso:null, nodx:false, saps2: 32},
    {id:'p9', bed:9, code:'TI-0433', age:45, sex:'M', admitted:ago(2), summary:'Politrauma, ventilazione meccanica', dx:'', iso:null, nodx:false, saps2: 37, airway: 'TRK'},
    {id:'p10', bed:10, code:'TI-0410', age:81, sex:'M', admitted:ago(10), summary:'Diarrea in corso di terapia antibiotica', dx:'Infezione da Clostridioides difficile', iso:{type:'Contatto', since:ago(3), reason:'Clostridioides difficile'}, nodx:false, saps2: 45}
  ],
  samples: [
    mk({pid:'p1', date:ago(3), site:'Liquor', test:'Colturale', org:'Streptococcus pneumoniae', ...conf('sig',ago(3))}),
    mk({pid:'p1', date:ago(3), site:'Sangue', test:'Colturale', org:'Streptococcus pneumoniae', setsPos:2, setsTot:2, bloodDrawSite:'CVP/CVC', isCompleteBloodCulture:true, ...conf('sig',ago(3))}),
    mk({pid:'p1', date:ago(1), site:'Sangue', test:'Colturale', result:'pending', bloodDrawSite:'CVP/CVC', isCompleteBloodCulture:true, label:'Emocoltura completa di controllo (T+24h)'}),
    mk({pid:'p1', date:ago(3), site:'Urine', test:'Antigene', org:'Antigene urinario pneumococco', ...conf('sig',ago(3))}),
    mk({pid:'p2', date:ago(8), site:'Liquor', test:'PCR/biologia molecolare', result:'neg', label:'HSV, VZV, enterovirus'}),
    mk({pid:'p2', date:ago(5), site:'Siero', test:'Sierologia', org:'West Nile virus (IgM)', ...conf('sig',ago(5))}),
    mk({pid:'p2', date:ago(4), site:'Liquor', test:'Sierologia', org:'West Nile virus (IgM liquorali)', ...conf('sig',ago(4))}),
    mk({pid:'p2', date:ago(2), site:'Sangue', test:'Colturale', org:'Bacillus cereus', setsPos:1, setsTot:2, bloodDrawSite:'CVP/CVC', isCompleteBloodCulture:true}),
    mk({pid:'p3', date:ago(10), site:'Liquor', test:'Colturale', result:'neg', label:'Coltura batterica'}),
    mk({pid:'p3', date:ago(10), site:'Liquor', test:'PCR/biologia molecolare', result:'neg', label:'Pannello meningoencefalite'}),
    mk({pid:'p3', date:ago(8), site:'Siero', test:'Sierologia', result:'neg', label:'West Nile, HSV, CMV, EBV, Borrelia'}),
    mk({pid:'p3', date:ago(3), site:'Liquor', test:'PCR/biologia molecolare', result:'neg', label:'HSV e VZV, ripetizione'}),
    mk({pid:'p3', date:ago(4), site:'Liquor', test:'Sierologia', result:'pending', label:'Anticorpi anti-neuronali'}),
    mk({pid:'p3', date:ago(2), site:'Aspirato tracheale', test:'Colturale', org:'Candida albicans', ...conf('col',ago(1))}),
    mk({pid:'p4', date:ago(6), site:'BAL', test:'Colturale', org:'Pseudomonas aeruginosa', cfu:1e5, mdro:'Pseudomonas CR', ...conf('sig',ago(6))}),
    mk({pid:'p4', date:ago(0), site:'Tampone rettale', test:'Colturale', result:'pending', label:'Sorveglianza CRE'}),
    mk({pid:'p5', date:ago(15), site:'Tampone rettale', test:'Colturale', org:'Klebsiella pneumoniae KPC', mdro:'CRE', resistanceGenes:['KPC'], ...conf('col',ago(15))}),
    mk({pid:'p6', date:ago(7), site:'Tampone nasale', test:'Colturale', org:'Staphylococcus aureus MRSA', mdro:'MRSA', ...conf('col',ago(7))}),
    mk({pid:'p6', date:ago(2), site:'Urine', test:'Colturale', org:'Candida albicans', cfu:1e5}),
    mk({pid:'p7', date:ago(1), site:'Sangue', test:'Colturale', org:'Escherichia coli', setsPos:2, setsTot:2, mdro:'ESBL', bloodDrawSite:'CVP/CVC', isCompleteBloodCulture:true}),
    mk({pid:'p7', date:ago(1), site:'Liquido peritoneale', test:'Colturale', result:'pending', label:'Coltura liquido da drenaggio'}),
    mk({pid:'p8', date:ago(4), site:'Sangue', test:'Colturale', org:'Staphylococcus aureus (MSSA)', setsPos:2, setsTot:2, bloodDrawSite:'CVP/CVC', isCompleteBloodCulture:true, ...conf('sig',ago(4))}),
    mk({pid:'p9', date:ago(1), site:'Aspirato tracheale', test:'Colturale', org:'Staphylococcus aureus (MSSA)', cfu:1e6}),
    mk({pid:'p9', date:ago(0), site:'BAL', test:'Colturale', result:'pending', label:'Coltura quantitativa BAL'}),
    mk({pid:'p10', date:ago(6), site:'Urine', test:'Colturale', org:'Enterococcus faecalis', cfu:1e4, ...conf('col',ago(6))}),
    mk({pid:'p10', date:ago(3), site:'Feci', test:'Tossina', org:'Clostridioides difficile (tossina A/B)', ...conf('sig',ago(3))})
  ],
  antibiotics: [
    // p1 - Letto 1 (Meningite da S. pneumoniae)
    { id: 'abx1', pid: 'p1', drug: 'Ceftriaxone', dosage: '2g q12h', route: 'EV', startDate: ago(3), status: 'active', indication: 'Meningite pneumococcica' },
    { id: 'abx2', pid: 'p1', drug: 'Vancomicina', dosage: '1g q12h', route: 'EV', startDate: ago(3), status: 'active', indication: 'Copertura empirica anti-pneumococco' },
    { id: 'abx3', pid: 'p1', drug: 'Ampicillina', dosage: '2g q4h', route: 'EV', startDate: ago(3), endDate: ago(1), status: 'completed', indication: 'Empirica (Listeria)', stopReason: 'De-escalation su antibiogramma (Listeria esclusa)' },
    
    // p4 - Letto 4 (VAP da Pseudomonas CR)
    { id: 'abx4', pid: 'p4', drug: 'Ceftazidime/Avibactam', dosage: '2.5g q8h (inf. 3h)', route: 'EV', startDate: ago(6), status: 'active', indication: 'VAP da Pseudomonas CR' },
    { id: 'abx5', pid: 'p4', drug: 'Colistina (Colistimetato)', dosage: '2 MUI q8h', route: 'Inalatoria', startDate: ago(5), status: 'active', indication: 'Aerosol terapia adiuvante VAP' },
    { id: 'abx6', pid: 'p4', drug: 'Meropenem', dosage: '2g q8h', route: 'EV', startDate: ago(14), endDate: ago(6), status: 'completed', indication: 'Terapia empirica polmonite', stopReason: 'Resistenza documentata (isolato P. aeruginosa CR)' },
    
    // p5 - Letto 5 (Sepsi addominale, KPC)
    { id: 'abx7', pid: 'p5', drug: 'Meropenem/Vaborbactam', dosage: '2g/2g q8h', route: 'EV', startDate: ago(10), status: 'active', indication: 'Sepsi addominale da KPC' },
    { id: 'abx8', pid: 'p5', drug: 'Piperacillina/Tazobactam', dosage: '4.5g q6h', route: 'EV', startDate: ago(20), endDate: ago(10), status: 'completed', indication: 'Peritonite post-chirurgica', stopReason: 'Fallimento clinico ed isolamento KPC' },
    
    // p8 - Letto 8 (Batteriemia MSSA da CVC)
    { id: 'abx9', pid: 'p8', drug: 'Cefazolina', dosage: '2g q8h', route: 'EV', startDate: ago(4), status: 'active', indication: 'Batteriemia da S. aureus sensibile (MSSA)' },
    { id: 'abx10', pid: 'p8', drug: 'Vancomicina', dosage: '1g q12h', route: 'EV', startDate: ago(12), endDate: ago(4), status: 'completed', indication: 'Sepsi da CVC empirica', stopReason: 'De-escalation su MSSA identificato' },

    // p10 - Letto 10 (Infezione C. difficile)
    { id: 'abx11', pid: 'p10', drug: 'Vancomicina', dosage: '125mg q6h', route: 'OS', startDate: ago(3), status: 'active', indication: 'Colite da Clostridioides difficile' },
    { id: 'abx12', pid: 'p10', drug: 'Ciprofloxacina', dosage: '400mg q12h', route: 'EV', startDate: ago(10), endDate: ago(3), status: 'completed', indication: 'Infezione vie urinarie', stopReason: 'Sospeso per tossicità / insorgenza diarrea da C. difficile' }
  ],
  devices: [
    { id: 'dev1', pid: 'p1', type: 'CVC', insertionDate: ago(3) },
    { id: 'dev2', pid: 'p1', type: 'CV', insertionDate: ago(3) },
    { id: 'dev3', pid: 'p4', type: 'CVC', insertionDate: ago(14) },
    { id: 'dev4', pid: 'p4', type: 'Art', insertionDate: ago(14) },
    { id: 'dev5', pid: 'p4', type: 'CV', insertionDate: ago(14) },
    { id: 'dev6', pid: 'p5', type: 'PICC', insertionDate: ago(10) },
    { id: 'dev7', pid: 'p5', type: 'CV', insertionDate: ago(20) },
    { id: 'dev8', pid: 'p6', type: 'CVC', insertionDate: ago(8) },
    { id: 'dev9', pid: 'p6', type: 'CV', insertionDate: ago(8) },
    { id: 'dev10', pid: 'p7', type: 'CVC', insertionDate: ago(5) },
    { id: 'dev11', pid: 'p7', type: 'Art', insertionDate: ago(5) },
    { id: 'dev12', pid: 'p7', type: 'CV', insertionDate: ago(5) },
    { id: 'dev13', pid: 'p8', type: 'CVC', insertionDate: ago(12) },
    { id: 'dev14', pid: 'p8', type: 'CV', insertionDate: ago(12) }
  ]
};
