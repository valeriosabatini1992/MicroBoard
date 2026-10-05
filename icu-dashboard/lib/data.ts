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
    {id:'p1', bed:1, code:'TI-0417', age:58, sex:'M', admitted:ago(3), summary:'Meningite batterica', dx:'Meningite pneumococcica', iso:null, nodx:false},
    {id:'p2', bed:2, code:'TI-0388', age:47, sex:'F', admitted:ago(9), summary:'Encefalite', dx:'Encefalite da West Nile virus', iso:null, nodx:false},
    {id:'p3', bed:3, code:'TI-0402', age:71, sex:'M', admitted:ago(11), summary:'Encefalite', dx:'Eziologia non ancora identificata', iso:null, nodx:true},
    {id:'p4', bed:4, code:'TI-0421', age:66, sex:'F', admitted:ago(14), summary:'Polmonite associata a ventilatore', dx:'VAP da Pseudomonas aeruginosa resistente ai carbapenemi', iso:{type:'Contatto', since:ago(6), reason:'Pseudomonas CR'}, nodx:false},
    {id:'p5', bed:5, code:'TI-0409', age:63, sex:'M', admitted:ago(20), summary:'Sepsi addominale post-operatoria', dx:'Portatore rettale di KPC', iso:{type:'Contatto', since:ago(15), reason:'CRE/CPE da tampone rettale'}, nodx:false},
    {id:'p6', bed:6, code:'TI-0425', age:79, sex:'F', admitted:ago(8), summary:'Insufficienza respiratoria acuta', dx:'', iso:{type:'Contatto', since:ago(7), reason:'MRSA da tampone nasale'}, nodx:false},
    {id:'p7', bed:7, code:'TI-0431', age:52, sex:'M', admitted:ago(5), summary:'Shock settico di origine addominale', dx:'', iso:null, nodx:false},
    {id:'p8', bed:8, code:'TI-0399', age:34, sex:'F', admitted:ago(12), summary:'Sepsi da catetere venoso centrale', dx:'Batteriemia da S. aureus', iso:null, nodx:false},
    {id:'p9', bed:9, code:'TI-0433', age:45, sex:'M', admitted:ago(2), summary:'Politrauma, ventilazione meccanica', dx:'', iso:null, nodx:false},
    {id:'p10', bed:10, code:'TI-0410', age:81, sex:'M', admitted:ago(10), summary:'Diarrea in corso di terapia antibiotica', dx:'Infezione da Clostridioides difficile', iso:{type:'Contatto', since:ago(3), reason:'Clostridioides difficile'}, nodx:false}
  ],
  samples: [
    mk({pid:'p1', date:ago(3), site:'Liquor', test:'Colturale', org:'Streptococcus pneumoniae', ab:'Penicillina S, ceftriaxone S', ...conf('sig',ago(3))}),
    mk({pid:'p1', date:ago(3), site:'Sangue', test:'Colturale', org:'Streptococcus pneumoniae', setsPos:2, setsTot:2, ab:'Penicillina S, ceftriaxone S', ...conf('sig',ago(3))}),
    mk({pid:'p1', date:ago(3), site:'Urine', test:'Antigene', org:'Antigene urinario pneumococco', ...conf('sig',ago(3))}),
    mk({pid:'p2', date:ago(8), site:'Liquor', test:'PCR/biologia molecolare', result:'neg', label:'HSV, VZV, enterovirus'}),
    mk({pid:'p2', date:ago(5), site:'Siero', test:'Sierologia', org:'West Nile virus (IgM)', ...conf('sig',ago(5))}),
    mk({pid:'p2', date:ago(4), site:'Liquor', test:'Sierologia', org:'West Nile virus (IgM liquorali)', ...conf('sig',ago(4))}),
    mk({pid:'p2', date:ago(2), site:'Sangue', test:'Colturale', org:'Bacillus cereus', setsPos:1, setsTot:2, ab:'Vancomicina S, clindamicina S'}),
    mk({pid:'p3', date:ago(10), site:'Liquor', test:'Colturale', result:'neg', label:'Coltura batterica'}),
    mk({pid:'p3', date:ago(10), site:'Liquor', test:'PCR/biologia molecolare', result:'neg', label:'Pannello meningoencefalite'}),
    mk({pid:'p3', date:ago(8), site:'Siero', test:'Sierologia', result:'neg', label:'West Nile, HSV, CMV, EBV, Borrelia'}),
    mk({pid:'p3', date:ago(3), site:'Liquor', test:'PCR/biologia molecolare', result:'neg', label:'HSV e VZV, ripetizione'}),
    mk({pid:'p3', date:ago(4), site:'Liquor', test:'Sierologia', result:'pending', label:'Anticorpi anti-neuronali'}),
    mk({pid:'p3', date:ago(2), site:'Aspirato tracheale', test:'Colturale', org:'Candida albicans', ...conf('col',ago(1))}),
    mk({pid:'p4', date:ago(6), site:'BAL', test:'Colturale', org:'Pseudomonas aeruginosa', cfu:1e5, mdro:'Pseudomonas CR', ab:'Meropenem R, ceftazidime R, colistina S', clinical:true, ...conf('sig',ago(6))}),
    mk({pid:'p5', date:ago(15), site:'Tampone rettale', test:'Colturale', org:'Klebsiella pneumoniae KPC', mdro:'CRE/CPE', ab:'Meropenem R, colistina S', ...conf('col',ago(15))}),
    mk({pid:'p5', date:ago(4), site:'Sangue', test:'Colturale', org:'Staphylococcus epidermidis', setsPos:1, setsTot:4, ...conf('con',ago(4))}),
    mk({pid:'p6', date:ago(7), site:'Tampone nasale', test:'Colturale', org:'Staphylococcus aureus MRSA', mdro:'MRSA', ...conf('col',ago(7))}),
    mk({pid:'p6', date:ago(2), site:'Urine', test:'Colturale', org:'Candida albicans', cfu:1e5}),
    mk({pid:'p7', date:ago(1), site:'Sangue', test:'Colturale', org:'Escherichia coli', setsPos:2, setsTot:2, mdro:'ESBL', ab:'Ceftriaxone R, piperacillina/tazobactam R, meropenem S'}),
    mk({pid:'p8', date:ago(4), site:'Sangue', test:'Colturale', org:'Staphylococcus aureus (MSSA)', setsPos:2, setsTot:2, ab:'Oxacillina S, vancomicina S', ...conf('sig',ago(4))}),
    mk({pid:'p8', date:ago(4), site:'Punta di CVC', test:'Colturale', org:'Staphylococcus aureus (MSSA)', cfu:15, note:'Concordante con emocoltura', ...conf('sig',ago(3))}),
    mk({pid:'p9', date:ago(1), site:'Aspirato tracheale', test:'Colturale', org:'Staphylococcus aureus (MSSA)', cfu:1e6, ab:'Oxacillina S'}),
    mk({pid:'p10', date:ago(6), site:'Urine', test:'Colturale', org:'Enterococcus faecalis', cfu:1e4, ...conf('col',ago(6))}),
    mk({pid:'p10', date:ago(3), site:'Feci', test:'Tossina', org:'Clostridioides difficile (tossina A/B)', clinical:true, ...conf('sig',ago(3))})
  ]
};
