import { Patient, Sample, AntibioticTherapy, PatientDevice } from './types';
import { fmtDMY, daysSince, calculateSaps2Mortality, getMdroForGenes } from './logic';

function sanitizePdfText(str: string | number | null | undefined): string {
  if (str == null) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ')
    .replace(/à/g, "a'")
    .replace(/á/g, "a'")
    .replace(/è/g, "e'")
    .replace(/é/g, "e'")
    .replace(/ì/g, "i'")
    .replace(/ò/g, "o'")
    .replace(/ó/g, "o'")
    .replace(/ù/g, "u'")
    .replace(/°/g, ' deg')
    .replace(/•/g, '-')
    .replace(/–/g, '-')
    .replace(/—/g, ' - ')
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/’/g, "'")
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=');
}

class SimplePdfDocument {
  private width: number = 595.28;
  private height: number = 841.89;
  private stream: string = '';

  rect(x: number, y: number, w: number, h: number, fillRgb: number[] | null = null, strokeRgb: number[] | null = null, lineWidth: number = 0.5) {
    let s = '';
    if (fillRgb) {
      s += `${(fillRgb[0]/255).toFixed(3)} ${(fillRgb[1]/255).toFixed(3)} ${(fillRgb[2]/255).toFixed(3)} rg\n`;
    }
    if (strokeRgb) {
      s += `${lineWidth.toFixed(2)} w\n`;
      s += `${(strokeRgb[0]/255).toFixed(3)} ${(strokeRgb[1]/255).toFixed(3)} ${(strokeRgb[2]/255).toFixed(3)} RG\n`;
    }
    s += `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re\n`;
    if (fillRgb && strokeRgb) s += 'B\n';
    else if (fillRgb) s += 'f\n';
    else if (strokeRgb) s += 'S\n';
    this.stream += s;
  }

  line(x1: number, y1: number, x2: number, y2: number, strokeRgb: number[] = [200, 200, 200], lineWidth: number = 0.5) {
    let s = `${lineWidth.toFixed(2)} w\n`;
    s += `${(strokeRgb[0]/255).toFixed(3)} ${(strokeRgb[1]/255).toFixed(3)} ${(strokeRgb[2]/255).toFixed(3)} RG\n`;
    s += `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;
    this.stream += s;
  }

  text(str: string, x: number, y: number, font: 'F1' | 'F2' = 'F1', size: number = 10, rgb: number[] = [0, 0, 0]) {
    const safe = sanitizePdfText(str);
    let s = 'BT\n';
    s += `/${font} ${size} Tf\n`;
    s += `${(rgb[0]/255).toFixed(3)} ${(rgb[1]/255).toFixed(3)} ${(rgb[2]/255).toFixed(3)} rg\n`;
    s += `${x.toFixed(2)} ${y.toFixed(2)} Td\n`;
    s += `(${safe}) Tj\n`;
    s += 'ET\n';
    this.stream += s;
  }

  build(): Uint8Array {
    const streamLen = new TextEncoder().encode(this.stream).length;
    const obj1 = '<< /Type /Catalog /Pages 2 0 R >>';
    const obj2 = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
    const obj3 = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.width} ${this.height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`;
    const obj4 = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    const obj5 = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    const obj6 = `<< /Length ${streamLen} >>\nstream\n${this.stream}endstream`;

    const allObjs = [obj1, obj2, obj3, obj4, obj5, obj6];
    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets: number[] = [];

    allObjs.forEach((o, idx) => {
      offsets.push(new TextEncoder().encode(pdf).length);
      pdf += `${idx + 1} 0 obj\n${o}\nendobj\n`;
    });

    const xrefOffset = new TextEncoder().encode(pdf).length;
    pdf += 'xref\n';
    pdf += `0 ${allObjs.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    offsets.forEach(off => {
      pdf += String(off).padStart(10, '0') + ' 00000 n \n';
    });

    pdf += 'trailer\n';
    pdf += `<< /Size ${allObjs.length + 1} /Root 1 0 R >>\n`;
    pdf += 'startxref\n';
    pdf += `${xrefOffset}\n`;
    pdf += '%%EOF\n';

    return new TextEncoder().encode(pdf);
  }
}

export function generatePatientPdfReport(
  patient: Patient,
  samples: Sample[],
  antibiotics: AntibioticTherapy[] = [],
  devices: PatientDevice[] = [],
  operatorName: string = ''
) {
  const doc = new SimplePdfDocument();
  const pageHeight = 841.89;
  const marginX = 36;
  const contentWidth = 595.28 - marginX * 2; // 523.28 pt

  // Colors
  const cDarkNavy = [15, 23, 42]; // #0F172A
  const cTeal = [15, 118, 110]; // #0F766E
  const cGrayText = [71, 85, 105];
  const cBorder = [203, 213, 225];
  const cRed = [185, 28, 28];
  const cGreen = [4, 120, 87];

  // Starting Y (from top)
  let currY = 36; // mm from top, converted to PDF pt coordinates: Y_pdf = pageHeight - currY

  // Helper coordinate converter
  const ptY = (topMm: number) => pageHeight - topMm;

  // 1. TOP BANNER
  doc.rect(marginX, ptY(currY + 38), contentWidth, 38, cDarkNavy);
  doc.text('MICROBOARD - RELAZIONE CLINICA INFETTIVOLOGICA', marginX + 12, ptY(currY + 16), 'F2', 13, [255, 255, 255]);
  const nowStr = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.text(`Terapia Intensiva Generale | Estratto il ${nowStr}${operatorName ? ` da ${operatorName}` : ''}`, marginX + 12, ptY(currY + 28), 'F1', 9, [203, 213, 225]);

  currY += 46;

  // 2. PATIENT ANAGRAPHIC BOX
  const admittedDateStr = fmtDMY(patient.admitted);
  const degDays = daysSince(patient.admitted) + 1;
  const sapsStr = typeof patient.saps2 === 'number'
    ? `SAPS II: ${patient.saps2} pt (~${calculateSaps2Mortality(patient.saps2)}% mort.)`
    : 'SAPS II: Non indicato';
  const isoStr = patient.iso ? `Isolamento: ${patient.iso.type}` : 'Isolamento: Nessuno';
  const devStr = devices.length > 0
    ? `Device: ${devices.map(d => `${d.type} (${fmtDMY(d.insertionDate)})`).join(', ')}`
    : 'Device in situ: Nessuno';

  doc.rect(marginX, ptY(currY + 68), contentWidth, 68, [248, 250, 252], cBorder, 0.7);

  doc.text(`LETTO ${patient.bed} - ID: ${patient.code}`, marginX + 10, ptY(currY + 15), 'F2', 12, cDarkNavy);
  const airwayStr = patient.airway ? `   |   Via aerea: ${patient.airway}` : '';
  doc.text(`Anagrafica: ${patient.age} anni, Sesso ${patient.sex}   |   Ricovero: ${admittedDateStr} (${degDays} deg giorno di degenza)${airwayStr}`, marginX + 10, ptY(currY + 28), 'F1', 9, cGrayText);

  const dxFull = patient.dx ? `${patient.summary} - ${patient.dx}` : (patient.summary || 'Non specificata');
  doc.text(`Diagnosi:`, marginX + 10, ptY(currY + 41), 'F1', 9, cDarkNavy);
  doc.text(dxFull.slice(0, 85), marginX + 60, ptY(currY + 41), 'F2', 9, cDarkNavy);

  const allergyStr = patient.allergies ? `   |   ALLERGIE: ${patient.allergies}` : '';
  doc.text(`${sapsStr}   |   ${isoStr}   |   ${devStr.slice(0, 32)}${allergyStr}`, marginX + 10, ptY(currY + 56), 'F1', 8.5, patient.allergies ? cRed : [100, 116, 139]);

  currY += 76;

  // Filter Samples
  const isSurveillance = (s: Sample) => 
    s.site === 'Tampone rettale' || s.site === 'Tampone nasale' || (s.label && s.label.toLowerCase().includes('sorveglianza'));
  const isPositive = (s: Sample) => s.result === 'pos';

  const diagnosticPositives = samples.filter(s => isPositive(s) && !isSurveillance(s));
  const surveillancePositives = samples.filter(s => isPositive(s) && isSurveillance(s));

  // 3. SECTION 1: POSITIVITÀ MICROBIOLOGICHE
  doc.rect(marginX, ptY(currY + 16), contentWidth, 16, cTeal);
  doc.text('1. POSITIVITA MICROBIOLOGICHE E INFEZIONI SIGNIFICATIVE', marginX + 8, ptY(currY + 11), 'F2', 9.5, [255, 255, 255]);
  currY += 20;

  if (diagnosticPositives.length === 0) {
    doc.text('Nessuna positivita microbiologica diagnostica rilevata per questo paziente.', marginX + 8, ptY(currY + 10), 'F1', 8.5, [100, 116, 139]);
    currY += 16;
  } else {
    // Header
    doc.rect(marginX, ptY(currY + 14), contentWidth, 14, [241, 245, 249]);
    doc.text('DATA', marginX + 6, ptY(currY + 10), 'F2', 8, cDarkNavy);
    doc.text('SITO / CAMPIONE', marginX + 55, ptY(currY + 10), 'F2', 8, cDarkNavy);
    doc.text('ESAME', marginX + 145, ptY(currY + 10), 'F2', 8, cDarkNavy);
    doc.text('GERME / REPERTO MICROBIOLOGICO', marginX + 225, ptY(currY + 10), 'F2', 8, cDarkNavy);
    doc.text('STATO', marginX + 440, ptY(currY + 10), 'F2', 8, cDarkNavy);
    currY += 18;

    diagnosticPositives.forEach(s => {
      const dStr = fmtDMY(s.date);
      const siteStr = s.site === 'Sangue' && s.bloodDrawSite ? `${s.site} (${s.bloodDrawSite})` : s.site;
      const testStr = s.test || 'Colturale';
      let orgStr = s.org || s.label || 'Positivo';
      if (s.resistanceGenes && s.resistanceGenes.length > 0 && !orgStr.includes('PCR')) {
        orgStr += ` [PCR: ${s.resistanceGenes.join(', ')}]`;
      }
      const effectiveMdro = s.mdro || (s.resistanceGenes ? getMdroForGenes(s.resistanceGenes) : '');
      const mdroStr = effectiveMdro ? ` [${effectiveMdro}]` : '';
      const setsStr = (s.setsPos != null && s.setsTot != null) ? ` (${s.setsPos}/${s.setsTot} set)` : '';
      const fullOrg = `${orgStr}${mdroStr}${setsStr}`;
      const catLabel = s.cat === 'sig' ? 'Infezione' : s.cat === 'col' ? 'Colonizzazione' : 'Da valutare';

      doc.text(dStr, marginX + 6, ptY(currY + 9), 'F1', 8.5, cDarkNavy);
      doc.text(siteStr.slice(0, 18), marginX + 55, ptY(currY + 9), 'F1', 8.5, cDarkNavy);
      doc.text(testStr.slice(0, 16), marginX + 145, ptY(currY + 9), 'F1', 8.5, cDarkNavy);
      doc.text(fullOrg.slice(0, 42), marginX + 225, ptY(currY + 9), 'F2', 8.5, cDarkNavy);

      const statusColor = s.cat === 'sig' ? cRed : cTeal;
      doc.text(catLabel, marginX + 440, ptY(currY + 9), 'F2', 8.5, statusColor);

      if (s.ab) {
        currY += 11;
        doc.text(`   Antibiogramma/Note: ${s.ab.slice(0, 68)}`, marginX + 225, ptY(currY + 8), 'F1', 7.5, [100, 116, 139]);
      }

      doc.line(marginX, ptY(currY + 13), marginX + contentWidth, ptY(currY + 13), cBorder, 0.4);
      currY += 17;
    });
  }

  currY += 6;

  // 4. SECTION 2: TAMPONI DI SORVEGLIANZA POSITIVI
  doc.rect(marginX, ptY(currY + 16), contentWidth, 16, cTeal);
  doc.text('2. TAMPONI DI SORVEGLIANZA POSITIVI (SCREENING MDRO / COLONIZZAZIONE)', marginX + 8, ptY(currY + 11), 'F2', 9.5, [255, 255, 255]);
  currY += 20;

  if (surveillancePositives.length === 0) {
    doc.text('Nessun tampone di sorveglianza positivo per microrganismi sentinella (MDRO) registrato.', marginX + 8, ptY(currY + 10), 'F1', 8.5, [100, 116, 139]);
    currY += 16;
  } else {
    doc.rect(marginX, ptY(currY + 14), contentWidth, 14, [241, 245, 249]);
    doc.text('DATA', marginX + 6, ptY(currY + 10), 'F2', 8, cDarkNavy);
    doc.text('TAMPONE', marginX + 55, ptY(currY + 10), 'F2', 8, cDarkNavy);
    doc.text('PATOGENO / REPERTO', marginX + 155, ptY(currY + 10), 'F2', 8, cDarkNavy);
    doc.text('PROFILO RESISTENZA', marginX + 340, ptY(currY + 10), 'F2', 8, cDarkNavy);
    doc.text('SIGNIFICATO', marginX + 440, ptY(currY + 10), 'F2', 8, cDarkNavy);
    currY += 18;

    surveillancePositives.forEach(s => {
      const dStr = fmtDMY(s.date);
      const siteStr = s.site;
      let orgStr = s.org || s.label || 'MDRO Positivo';
      if (s.resistanceGenes && s.resistanceGenes.length > 0 && !orgStr.includes('PCR')) {
        orgStr += ` (PCR: ${s.resistanceGenes.join(', ')})`;
      }
      const mdroStr = s.mdro || (s.resistanceGenes ? getMdroForGenes(s.resistanceGenes) : '') || 'MDRO';

      doc.text(dStr, marginX + 6, ptY(currY + 9), 'F1', 8.5, cDarkNavy);
      doc.text(siteStr.slice(0, 18), marginX + 55, ptY(currY + 9), 'F1', 8.5, cDarkNavy);
      doc.text(orgStr.slice(0, 36), marginX + 155, ptY(currY + 9), 'F2', 8.5, cDarkNavy);
      doc.text(mdroStr, marginX + 340, ptY(currY + 9), 'F2', 8.5, cRed);
      doc.text('Colonizzazione', marginX + 440, ptY(currY + 9), 'F1', 8.5, cDarkNavy);

      doc.line(marginX, ptY(currY + 13), marginX + contentWidth, ptY(currY + 13), cBorder, 0.4);
      currY += 17;
    });
  }

  currY += 6;

  // 5. SECTION 3: TERAPIA ANTIBIOTICA
  doc.rect(marginX, ptY(currY + 16), contentWidth, 16, cTeal);
  doc.text('3. TERAPIA ANTIBIOTICA (IN CORSO E STORICO) - INDICAZIONI CLINICHE', marginX + 8, ptY(currY + 11), 'F2', 9.5, [255, 255, 255]);
  currY += 20;

  if (antibiotics.length === 0) {
    doc.text('Nessuna terapia antibiotica registrata in archivio per questo ricovero.', marginX + 8, ptY(currY + 10), 'F1', 8.5, [100, 116, 139]);
    currY += 16;
  } else {
    doc.rect(marginX, ptY(currY + 14), contentWidth, 14, [241, 245, 249]);
    doc.text('FARMACO / POSOLOGIA', marginX + 6, ptY(currY + 10), 'F2', 8, cDarkNavy);
    doc.text('PERIODO & GG', marginX + 160, ptY(currY + 10), 'F2', 8, cDarkNavy);
    doc.text('STATO', marginX + 275, ptY(currY + 10), 'F2', 8, cDarkNavy);
    doc.text('INDICAZIONE', marginX + 335, ptY(currY + 10), 'F2', 8, cDarkNavy);
    currY += 18;

    const sortedAbx = [...antibiotics].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return b.startDate.localeCompare(a.startDate);
    });

    sortedAbx.forEach(a => {
      const drugStr = `${a.drug} (${a.dosage}${a.route ? ` ${a.route}` : ''})`;
      const startD = fmtDMY(a.startDate);
      const endD = a.endDate ? fmtDMY(a.endDate) : 'In corso';
      const daysCount = a.endDate 
        ? Math.max(1, Math.round((new Date(a.endDate + 'T12:00:00').getTime() - new Date(a.startDate + 'T12:00:00').getTime()) / 864e5) + 1)
        : daysSince(a.startDate) + 1;

      const periodStr = `${startD} -> ${endD} (${daysCount} gg)`;
      const statusLabel = a.status === 'active' ? 'IN CORSO' : 'TERMINATO';
      const statusColor = a.status === 'active' ? cGreen : [100, 116, 139];
      const indStr = a.indication ? a.indication : 'Non indicata';

      doc.text(drugStr.slice(0, 30), marginX + 6, ptY(currY + 9), 'F2', 8.5, cDarkNavy);
      doc.text(periodStr, marginX + 160, ptY(currY + 9), 'F1', 8, cDarkNavy);
      doc.text(statusLabel, marginX + 275, ptY(currY + 9), 'F2', 8, statusColor);
      doc.text(indStr.slice(0, 36), marginX + 335, ptY(currY + 9), 'F2', 8.5, cDarkNavy);

      if (a.status !== 'active' && a.stopReason) {
        currY += 11;
        doc.text(`   Motivo stop: ${a.stopReason.slice(0, 60)}`, marginX + 335, ptY(currY + 8), 'F1', 7.5, [100, 116, 139]);
      }

      doc.line(marginX, ptY(currY + 13), marginX + contentWidth, ptY(currY + 13), cBorder, 0.4);
      currY += 17;
    });
  }

  // FOOTER
  doc.line(marginX, ptY(805), marginX + contentWidth, ptY(805), cBorder, 0.5);
  doc.text('MicroBoard Terapia Intensiva - Documento generato ad uso clinico interno.', marginX, ptY(817), 'F1', 7.5, [148, 163, 184]);

  const pdfBytes = doc.build();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeCode = patient.code.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `Report_Letto_${patient.bed}_${safeCode}_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
