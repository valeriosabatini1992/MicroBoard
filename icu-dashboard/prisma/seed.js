const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Meningite pneumococcica
  const p1 = await prisma.patient.create({
    data: {
      patientCode: 'PAZ-001',
      bed: 'L1',
      mainInfectiousFocus: 'SNC (Meningite)',
      diagnosis: 'Meningite pneumococcica',
      isolationType: 'DROPLET',
      episodeStartDate: new Date(new Date().setDate(new Date().getDate() - 3)),
      notes: 'Paziente critico, in miglioramento dopo inizio tp.',
      episodes: {
        create: [
          {
            type: 'Meningite batterica',
            startDate: new Date(new Date().setDate(new Date().getDate() - 3)),
            status: 'ACTIVE',
            severity: 'Severa'
          }
        ]
      },
      microbiologies: {
        create: [
          {
            sampleType: 'Liquor',
            sampleDate: new Date(new Date().setDate(new Date().getDate() - 3)),
            reportDate: new Date(new Date().setDate(new Date().getDate() - 2)),
            microorganism: 'Streptococcus pneumoniae',
            site: 'SNC',
            resistanceProfile: 'NON_MDR',
            clinicalSignificance: 'ACTIVE_INFECTION',
            antibiogram: {
              create: [
                { antibioticName: 'Ceftriaxone', interpretation: 'S', micValue: '0.06' },
                { antibioticName: 'Penicillina', interpretation: 'S', micValue: '0.03' }
              ]
            }
          }
        ]
      }
    }
  });

  const m1 = await prisma.microbiology.findFirst({ where: { patientId: p1.id } });

  await prisma.antibiotic.create({
    data: {
      patientId: p1.id,
      name: 'Ceftriaxone',
      antibioticClass: 'Cefalosporine III gen',
      clinicalIndication: 'Meningite',
      prescriptionReason: 'Target microbico noto',
      startDate: new Date(new Date().setDate(new Date().getDate() - 3)),
      plannedEndDate: new Date(new Date().setDate(new Date().getDate() + 11)),
      durationDays: 14,
      status: 'ACTIVE',
      therapyType: 'TARGETED',
      linkedMicrobiologies: {
        create: [{ microbiologyId: m1.id, rationale: 'Suscettibile (MIC 0.06)' }]
      },
      therapyReviews: {
        create: [{
          reviewDate: new Date(new Date().setDate(new Date().getDate() + 4)),
          status: 'PENDING',
          recommendation: 'Valutare de-escalation a Penicillina G'
        }]
      }
    }
  });

  // 2. TBC disseminata cerebrale
  const p2 = await prisma.patient.create({
    data: {
      patientCode: 'PAZ-002',
      bed: 'L2',
      mainInfectiousFocus: 'Disseminata (SNC + Polmonare)',
      diagnosis: 'Tubercolosi disseminata',
      isolationType: 'AIRBORNE',
      episodeStartDate: new Date(new Date().setDate(new Date().getDate() - 10)),
      notes: 'Terapia quaduplice iniziata',
      microbiologies: {
        create: [
          {
            sampleType: 'BAL',
            sampleDate: new Date(new Date().setDate(new Date().getDate() - 10)),
            reportDate: new Date(new Date().setDate(new Date().getDate() - 9)),
            microorganism: 'Mycobacterium tuberculosis',
            site: 'Polmone',
            resistanceProfile: 'NON_MDR',
            clinicalSignificance: 'ACTIVE_INFECTION',
            comment: 'PCR positiva, attesa colturale'
          }
        ]
      }
    }
  });

  const m2 = await prisma.microbiology.findFirst({ where: { patientId: p2.id } });

  // Terapia quaduplice
  const tbcDrugs = ['Isoniazide', 'Rifampicina', 'Pirazinamide', 'Etambutolo'];
  for (const drug of tbcDrugs) {
    await prisma.antibiotic.create({
      data: {
        patientId: p2.id,
        name: drug,
        clinicalIndication: 'Tubercolosi',
        startDate: new Date(new Date().setDate(new Date().getDate() - 9)),
        status: 'ACTIVE',
        therapyType: 'TARGETED',
        linkedMicrobiologies: {
          create: [{ microbiologyId: m2.id }]
        }
      }
    });
  }

  // 3. Polmonite ndd con colonizzazione KPC rettale e CRBSI da E. faecalis
  const p3 = await prisma.patient.create({
    data: {
      patientCode: 'PAZ-003',
      bed: 'L3',
      mainInfectiousFocus: 'Polmonare + Batteriemia CVC',
      diagnosis: 'VAP + CRBSI',
      isolationType: 'CONTACT',
      episodeStartDate: new Date(new Date().setDate(new Date().getDate() - 5)),
      patientDevices: {
        create: [
          { type: 'CVC', insertionDate: new Date(new Date().setDate(new Date().getDate() - 15)) },
          { type: 'ETT', insertionDate: new Date(new Date().setDate(new Date().getDate() - 12)) }
        ]
      },
      microbiologies: {
        create: [
          {
            sampleType: 'Tampone Rettale',
            sampleDate: new Date(new Date().setDate(new Date().getDate() - 4)),
            reportDate: new Date(new Date().setDate(new Date().getDate() - 3)),
            microorganism: 'Klebsiella pneumoniae (KPC)',
            site: 'Intestino',
            resistanceProfile: 'MDR',
            clinicalSignificance: 'COLONIZATION',
            comment: 'Isolamento da contatto necessario'
          },
          {
            sampleType: 'Emocoltura CVC',
            sampleDate: new Date(new Date().setDate(new Date().getDate() - 2)),
            reportDate: new Date(new Date().setDate(new Date().getDate() - 1)),
            microorganism: 'Enterococcus faecalis',
            resistanceProfile: 'NON_MDR',
            clinicalSignificance: 'ACTIVE_INFECTION',
            antibiogram: {
              create: [
                { antibioticName: 'Ampicillina', interpretation: 'S', micValue: '<= 2' },
                { antibioticName: 'Vancomicina', interpretation: 'S', micValue: '1' }
              ]
            }
          },
          {
            sampleType: 'BAL',
            sampleDate: new Date(new Date().setDate(new Date().getDate() - 5)),
            reportDate: new Date(new Date().setDate(new Date().getDate() - 3)),
            microorganism: 'Polimicrobica',
            site: 'Polmone',
            clinicalSignificance: 'ACTIVE_INFECTION',
            comment: 'VAP clinica, colturale aspecifico'
          }
        ]
      }
    }
  });

  const m3_crbsi = await prisma.microbiology.findFirst({ where: { patientId: p3.id, sampleType: 'Emocoltura CVC' } });
  
  await prisma.antibiotic.create({
    data: {
      patientId: p3.id,
      name: 'Ampicillina',
      clinicalIndication: 'CRBSI',
      startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
      durationDays: 7,
      status: 'ACTIVE',
      therapyType: 'TARGETED',
      linkedMicrobiologies: { create: [{ microbiologyId: m3_crbsi.id }] }
    }
  });

  await prisma.antibiotic.create({
    data: {
      patientId: p3.id,
      name: 'Meropenem',
      clinicalIndication: 'VAP empirica',
      startDate: new Date(new Date().setDate(new Date().getDate() - 5)),
      status: 'ACTIVE',
      therapyType: 'EMPIRIC',
      notes: 'Copertura per rischio KPC data la colonizzazione'
    }
  });

  // 4. Encefalite ndd complicata da Pseudomonas nel BAS
  const p4 = await prisma.patient.create({
    data: {
      patientCode: 'PAZ-004',
      bed: 'L4',
      mainInfectiousFocus: 'SNC + Polmonare',
      diagnosis: 'Encefalite + VAP Pseudomonas',
      isolationType: 'NONE',
      episodeStartDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      patientDevices: {
        create: [{ type: 'TRACHEOSTOMY', insertionDate: new Date(new Date().setDate(new Date().getDate() - 10)) }]
      },
      microbiologies: {
        create: [
          {
            sampleType: 'Liquor',
            sampleDate: new Date(new Date().setDate(new Date().getDate() - 7)),
            microorganism: 'Negativo',
            clinicalSignificance: 'UNCERTAIN',
          },
          {
            sampleType: 'BAS',
            sampleDate: new Date(new Date().setDate(new Date().getDate() - 2)),
            reportDate: new Date(),
            microorganism: 'Pseudomonas aeruginosa',
            resistanceProfile: 'MDR',
            clinicalSignificance: 'ACTIVE_INFECTION',
            antibiogram: {
              create: [
                { antibioticName: 'Cefepime', interpretation: 'R' },
                { antibioticName: 'Meropenem', interpretation: 'S' },
                { antibioticName: 'Amikacina', interpretation: 'S' }
              ]
            }
          }
        ]
      }
    }
  });

  const m4_pseudo = await prisma.microbiology.findFirst({ where: { patientId: p4.id, microorganism: 'Pseudomonas aeruginosa' } });

  await prisma.antibiotic.create({
    data: {
      patientId: p4.id,
      name: 'Aciclovir',
      clinicalIndication: 'Sospetta encefalite virale',
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      status: 'ACTIVE',
      therapyType: 'EMPIRIC',
    }
  });
  
  await prisma.antibiotic.create({
    data: {
      patientId: p4.id,
      name: 'Meropenem',
      clinicalIndication: 'VAP Pseudomonas MDR',
      startDate: new Date(),
      status: 'ACTIVE',
      therapyType: 'ESCALATION',
      linkedMicrobiologies: { create: [{ microbiologyId: m4_pseudo.id }] }
    }
  });

  // 5. Endocardite da MRSA con tampone nasale MRSA ed emocolture da vena periferica con S. epidermidis
  const p5 = await prisma.patient.create({
    data: {
      patientCode: 'PAZ-005',
      bed: 'L5',
      mainInfectiousFocus: 'Endovascolare',
      diagnosis: 'Endocardite MRSA',
      isolationType: 'CONTACT',
      episodeStartDate: new Date(new Date().setDate(new Date().getDate() - 8)),
      microbiologies: {
        create: [
          {
            sampleType: 'Tampone Nasale',
            sampleDate: new Date(new Date().setDate(new Date().getDate() - 8)),
            reportDate: new Date(new Date().setDate(new Date().getDate() - 7)),
            microorganism: 'Staphylococcus aureus (MRSA)',
            site: 'Nasale',
            resistanceProfile: 'MDR',
            clinicalSignificance: 'COLONIZATION',
          },
          {
            sampleType: 'Emocoltura CVC',
            sampleDate: new Date(new Date().setDate(new Date().getDate() - 8)),
            reportDate: new Date(new Date().setDate(new Date().getDate() - 6)),
            microorganism: 'Staphylococcus aureus (MRSA)',
            resistanceProfile: 'MDR',
            clinicalSignificance: 'ACTIVE_INFECTION',
            antibiogram: {
              create: [
                { antibioticName: 'Daptomicina', interpretation: 'S', micValue: '0.5' },
                { antibioticName: 'Linezolid', interpretation: 'S' }
              ]
            }
          },
          {
            sampleType: 'Emocoltura Vena Periferica',
            sampleDate: new Date(new Date().setDate(new Date().getDate() - 1)),
            reportDate: new Date(),
            microorganism: 'Staphylococcus epidermidis',
            resistanceProfile: 'NON_MDR',
            clinicalSignificance: 'CONTAMINATION',
            comment: 'Interpretata come contaminante in pz già in tx con Daptomicina'
          }
        ]
      }
    }
  });

  const m5_mrsa = await prisma.microbiology.findFirst({ where: { patientId: p5.id, clinicalSignificance: 'ACTIVE_INFECTION' } });

  await prisma.antibiotic.create({
    data: {
      patientId: p5.id,
      name: 'Daptomicina',
      clinicalIndication: 'Endocardite',
      startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
      durationDays: 42,
      status: 'ACTIVE',
      therapyType: 'TARGETED',
      linkedMicrobiologies: { create: [{ microbiologyId: m5_mrsa.id }] },
      therapyReviews: {
        create: [{
          reviewDate: new Date(new Date().setDate(new Date().getDate() - 1)),
          status: 'OVERDUE',
          recommendation: 'Valutare emocolture di controllo'
        }]
      }
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
