'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/store';
import { 
  SAPS2_FIELDS, 
  Saps2State, 
  INITIAL_SAPS2_STATE, 
  calculateSaps2Score, 
  calculateSaps2Mortality, 
  getAgePoints 
} from '@/lib/saps2';
import { Calculator, X, Check, RotateCcw } from 'lucide-react';

export const Saps2CalculatorModal = () => {
  const { db, updatePatient } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);
  const [targetPatientId, setTargetPatientId] = useState<string | null>(null);
  const [onApplyCallback, setOnApplyCallback] = useState<((score: number) => void) | null>(null);
  const [calcState, setCalcState] = useState<Saps2State>(INITIAL_SAPS2_STATE);
  const [activeTab, setActiveTab] = useState<'demographics' | 'vitals' | 'respiratory' | 'lab'>('demographics');

  useEffect(() => {
    const handleOpen = (e: any) => {
      const { patientId, age, currentScore, onApply } = e.detail || {};
      
      let baseAgePoints = 0;
      if (typeof age === 'number') {
        baseAgePoints = getAgePoints(age);
      } else if (patientId) {
        const p = db.patients.find(x => x.id === patientId);
        if (p?.age) baseAgePoints = getAgePoints(p.age);
      }

      setCalcState({
        ...INITIAL_SAPS2_STATE,
        age: baseAgePoints,
      });

      setTargetPatientId(patientId || null);
      setOnApplyCallback(() => (onApply ? onApply : null));
      setIsOpen(true);
    };

    document.addEventListener('open-saps-calculator', handleOpen);
    return () => document.removeEventListener('open-saps-calculator', handleOpen);
  }, [db.patients]);

  if (!isOpen) return null;

  const currentPatient = targetPatientId ? db.patients.find(p => p.id === targetPatientId) : null;
  const currentScore = calculateSaps2Score(calcState);
  const currentMortality = calculateSaps2Mortality(currentScore);

  const handleApply = () => {
    if (onApplyCallback) {
      onApplyCallback(currentScore);
    } else if (targetPatientId) {
      updatePatient(targetPatientId, { saps2: currentScore });
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultAgePoints = currentPatient?.age ? getAgePoints(currentPatient.age) : 0;
    setCalcState({
      ...INITIAL_SAPS2_STATE,
      age: defaultAgePoints,
    });
  };

  const close = () => {
    setIsOpen(false);
    setOnApplyCallback(null);
    setTargetPatientId(null);
  };

  const tabs = [
    { id: 'demographics', label: '1. Demografia & Tipo Ricovero' },
    { id: 'vitals', label: '2. Parametri Vitali & GCS' },
    { id: 'respiratory', label: '3. Respiratorio & Diuresi' },
    { id: 'lab', label: '4. Laboratorio' },
  ] as const;

  const activeFields = SAPS2_FIELDS.filter(f => f.category === activeTab);

  return (
    <>
      <div className="modal-backdrop" onClick={close} aria-hidden="true" style={{ zIndex: 1200 }} />
      <div 
        className="saps-modal-dialog" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="saps-modal-title"
      >
        {/* Modal Header */}
        <div className="saps-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} color="#1E40AF" />
            <div>
              <h2 id="saps-modal-title" className="saps-title">
                Calcolatore SAPS II
              </h2>
              <span className="muted" style={{ fontSize: '11px' }}>
                Simplified Acute Physiology Score II (Le Gall et al., 1993)
                {currentPatient ? ` • Letto ${currentPatient.bed} (${currentPatient.code}, ${currentPatient.age}a)` : ''}
              </span>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={close} aria-label="Chiudi calcolatore">
            <X size={16} />
          </button>
        </div>

        {/* Live Score Sticky Summary Banner */}
        <div className="saps-summary-banner">
          <div className="saps-score-box">
            <span className="saps-score-label">Punteggio Totale</span>
            <div className="saps-score-val">{currentScore} <span style={{ fontSize: '12px', fontWeight: 500 }}>/ 163 pt</span></div>
          </div>
          <div className="saps-mortality-box">
            <span className="saps-score-label">Mortalità Ospedaliera Stimata</span>
            <div className="saps-mortality-val">{currentMortality}%</div>
          </div>
          <div className="saps-banner-actions">
            <button 
              type="button" 
              className="btn small" 
              onClick={handleReset}
              title="Ripristina valori normali di base"
              style={{ fontSize: '11.5px', padding: '4px 8px' }}
            >
              <RotateCcw size={12} style={{ marginRight: '4px' }} />
              Reimposta
            </button>
            <button 
              type="button" 
              className="btn small primary" 
              onClick={handleApply}
              style={{ fontSize: '12px', padding: '5px 12px', background: '#1D4ED8', borderColor: '#1D4ED8', fontWeight: 700 }}
            >
              <Check size={13} style={{ marginRight: '4px' }} />
              Applica Score ({currentScore} pt)
            </button>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="saps-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              className={`saps-tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Fields Panel */}
        <div className="saps-body">
          <div className="saps-fields-grid">
            {activeFields.map(field => {
              const currentValue = calcState[field.id];
              return (
                <div key={field.id} className="saps-field-card">
                  <div className="saps-field-header">
                    <strong>{field.title}</strong>
                    <span className="saps-field-badge">
                      +{currentValue} pt
                    </span>
                  </div>
                  <div className="saps-field-options">
                    {field.options.map(opt => {
                      const isSelected = currentValue === opt.points;
                      return (
                        <button
                          key={`${field.id}-${opt.points}-${opt.label}`}
                          type="button"
                          className={`saps-opt-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => setCalcState(prev => ({ ...prev, [field.id]: opt.points }))}
                        >
                          <span className="saps-opt-label">{opt.label}</span>
                          <span className={`saps-opt-points ${opt.points > 0 ? 'nonzero' : 'zero'}`}>
                            {opt.points > 0 ? `+${opt.points}` : '0'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="saps-footer">
          <div className="muted" style={{ fontSize: '11.5px' }}>
            Score attuale: <strong>{currentScore} pt</strong> • Mortalità calcolata: <strong>{currentMortality}%</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn small" onClick={close}>
              Annulla
            </button>
            <button 
              type="button" 
              className="btn small primary" 
              onClick={handleApply}
              style={{ background: '#1D4ED8', borderColor: '#1D4ED8', fontWeight: 700 }}
            >
              Conferma e Salva
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
