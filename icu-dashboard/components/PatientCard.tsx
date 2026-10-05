"use client";

import { useState } from 'react';
import { format, differenceInHours } from 'date-fns';
import { ShieldAlert, Bug, Activity, User, Plus, Clock, ChevronDown, ChevronUp, Beaker } from 'lucide-react';

export function PatientCard({ patient }: { patient: any }) {
  const [expanded, setExpanded] = useState(false);

  const hasMDR = patient.microbiologies.some((m: any) => m.resistanceProfile === 'MDR' || m.resistanceProfile === 'XDR');
  const activeAbx = patient.antibiotics.filter((a: any) => a.status === 'ACTIVE');
  
  // Collect all events for timeline
  const events = [];
  if (patient.episodeStartDate) {
    events.push({ date: new Date(patient.episodeStartDate), type: 'event-alert', label: `Inizio Episodio: ${patient.diagnosis || 'N/D'}` });
  }
  patient.microbiologies.forEach((m: any) => {
    events.push({ date: new Date(m.sampleDate), type: 'event-micro', label: `Prelievo ${m.sampleType}` });
    if (m.reportDate) {
      events.push({ date: new Date(m.reportDate), type: 'event-micro', label: `Referto: ${m.microorganism} (${m.clinicalSignificance})` });
    }
  });
  patient.antibiotics.forEach((a: any) => {
    events.push({ date: new Date(a.startDate), type: 'event-abx', label: `Inizio ${a.name} (${a.therapyType})` });
    a.therapyReviews.forEach((r: any) => {
      events.push({ date: new Date(r.reviewDate), type: 'event-review', label: `Review: ${r.status}` });
    });
  });
  // Sort timeline chronologically
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="patient-card">
      <div className="patient-header">
        <div className="patient-id">
          <User size={16} color="var(--text-secondary)" />
          {patient.patientCode}
        </div>
        <div className="patient-bed">{patient.bed}</div>
      </div>
      
      <div className="patient-body">
        <div className="badge-row">
          {patient.isolationType !== 'NONE' && (
            <span className="badge isolation"><ShieldAlert size={12}/> ISO: {patient.isolationType}</span>
          )}
          {hasMDR && (
            <span className="badge mdr"><Bug size={12}/> MDR/XDR</span>
          )}
          {patient.microbiologies
            .filter((m:any) => m.clinicalSignificance === 'COLONIZATION')
            .map((m:any) => (
              <span key={m.id} className="badge mdr" style={{ opacity: 0.8 }}><Bug size={12}/> Col. {m.microorganism.split(' ')[0]}</span>
            ))
          }
        </div>

        <div className="info-row">
          <span className="info-label">Focus Infettivo:</span>
          <span className="info-value">{patient.mainInfectiousFocus || 'N/D'}</span>
        </div>

        {activeAbx.length > 0 && (
          <div className="abx-list">
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>TERAPIA IN CORSO</div>
            {activeAbx.map((abx: any) => {
              const now = new Date();
              const end = abx.plannedEndDate ? new Date(abx.plannedEndDate) : null;
              let hoursLeft = end ? differenceInHours(end, now) : null;
              
              let statusClass = '';
              let statusText = '';
              if (hoursLeft !== null) {
                if (hoursLeft < 0) {
                  statusClass = 'overdue';
                  statusText = 'Scaduta';
                } else if (hoursLeft <= 48) {
                  statusClass = 'urgent-review';
                  statusText = `Review tra ${hoursLeft}h`;
                } else {
                  statusText = `Fine tra ${Math.ceil(hoursLeft/24)}gg`;
                }
              }

              return (
                <div key={abx.id} className={`abx-item ${statusClass}`}>
                  <div>
                    <strong>{abx.name}</strong> <span style={{color: 'var(--text-secondary)'}}>({abx.therapyType})</span>
                    {abx.linkedMicrobiologies && abx.linkedMicrobiologies.length > 0 && (
                      <div style={{ fontSize: '10px', color: 'var(--semantic-blue)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Beaker size={10} /> Mirata su referto
                      </div>
                    )}
                  </div>
                  {statusText && <span style={{fontSize: '11px', whiteSpace: 'nowrap'}}>{statusText}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {expanded && (
        <div className="expanded-panel">
          <div>
            <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14}/> Riconciliazione & Dettagli</h4>
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong>Diagnosi:</strong> {patient.diagnosis || 'Non specificata'}
              </div>
              <div>
                <strong>Note Cliniche:</strong> {patient.notes || 'Nessuna nota'}
              </div>
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <h5 style={{ marginBottom: '8px' }}>Microbiologia</h5>
                {patient.microbiologies.length === 0 ? <span style={{ color: 'var(--text-secondary)'}}>Nessun referto</span> : 
                  patient.microbiologies.map((m: any) => (
                    <div key={m.id} style={{ padding: '6px', background: 'rgba(0,0,0,0.02)', borderRadius: '4px', marginBottom: '6px' }}>
                      <strong>{m.sampleType}</strong> - {format(new Date(m.sampleDate), 'dd/MM/yyyy')}<br/>
                      <span style={{ color: m.resistanceProfile !== 'NON_MDR' ? 'var(--semantic-red)' : 'var(--text-primary)' }}>
                        {m.microorganism}
                      </span> ({m.clinicalSignificance})
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14}/> Timeline Clinica</h4>
            <div className="timeline">
              {events.length === 0 ? <div style={{ fontSize: '12px', color: 'var(--text-secondary)'}}>Nessun evento</div> : 
                events.map((evt, idx) => (
                  <div key={idx} className={`timeline-event ${evt.type}`}>
                    <div className="timeline-date">{format(evt.date, 'dd MMM yyyy, HH:mm')}</div>
                    <div>{evt.label}</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? <><ChevronUp size={14} style={{verticalAlign: 'middle'}}/> Chiudi Dettagli</> : <><ChevronDown size={14} style={{verticalAlign: 'middle'}}/> Espandi Dettagli</>}
      </button>
    </div>
  );
}
