import React, { useState, useEffect } from 'react';

export interface RubricTestResponse {
  rawEarned: number;
  rawMax: number;
  severityWeight: number;
  earnedWeighted: number;
  maxWeighted: number;
  pointsLost: number;
  percentage: number;
  alertBand: 'RED' | 'ORANGE' | 'AMBER' | 'LIGHT_GREEN' | 'DARK_GREEN' | null;
  alertLabel: string;
  colorHex?: string;
  alertColorHex?: string;
  redFlagTriggered: boolean;
  redFlagReason?: string | null;
  suggestedIntervention?: string | null;
  ruleWorkingText?: string | null;
  assessed: boolean;
  unassessedReason?: string | null;
}

interface QuestionSummary {
  id: string;
  domain: string;
  section: string;
  canonicalText: string;
  responseType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  scored: boolean;
  rubricType: string;
}

interface QuestionDetail extends QuestionSummary {
  rubricConfig: Record<string, any>;
  redFlagLogic?: string;
  suggestedIntervention?: string;
}

interface RubricTesterScreenProps {
  initialQuestionId?: string;
  onBackToBank?: () => void;
}

export const RubricTesterScreen: React.FC<RubricTesterScreenProps> = ({
  initialQuestionId,
  onBackToBank
}) => {
  const [mode, setMode] = useState<'BANK' | 'ADHOC'>('BANK');
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(initialQuestionId || '');
  const [selectedQuestionDetail, setSelectedQuestionDetail] = useState<QuestionDetail | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Ad-hoc configuration state
  const [adHocRubricType, setAdHocRubricType] = useState<string>('GRID_AFU');
  const [adHocSeverity, setAdHocSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [adHocRedFlagLogic, setAdHocRedFlagLogic] = useState<string>('Item absent or non-functional');
  const [adHocIntervention, setAdHocIntervention] = useState<string>('Issue urgent maintenance requisition');
  const [adHocConfig, setAdHocConfig] = useState<Record<string, any>>({
    type: 'GRID_AFU',
    score_used: true,
    rows: ['Drinking Water', 'Handwashing Facility', 'Soap & Water Station']
  });

  // Current Answer State
  const [answerState, setAnswerState] = useState<Record<string, any>>({});
  const [isNotAssessed, setIsNotAssessed] = useState<boolean>(false);
  const [notAssessedReason, setNotAssessedReason] = useState<string>('Facility was locked at time of inspection');

  // Test Evaluation Result
  const [result, setResult] = useState<RubricTestResponse | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Fetch question list
  useEffect(() => {
    const fetchList = async () => {
      setLoadingQuestions(true);
      try {
        const res = await fetch('/api/v1/questions');
        if (res.ok) {
          const data: QuestionSummary[] = await res.json();
          // Filter to scored questions first or all
          setQuestions(data);
          if (!selectedQuestionId && data.length > 0) {
            // Pick first scored question or Q1
            const firstScored = data.find(q => q.scored) || data[0];
            setSelectedQuestionId(firstScored.id);
          }
        }
      } catch (err) {
        console.error('Failed to load question list', err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchList();
  }, []);

  // When initialQuestionId changes from outside
  useEffect(() => {
    if (initialQuestionId) {
      setSelectedQuestionId(initialQuestionId);
      setMode('BANK');
    }
  }, [initialQuestionId]);

  // When selectedQuestionId changes, fetch detail & initialize answer state
  useEffect(() => {
    if (mode === 'BANK' && selectedQuestionId) {
      loadQuestionDetail(selectedQuestionId);
    }
  }, [selectedQuestionId, mode]);

  const loadQuestionDetail = async (qId: string) => {
    setLoadingDetail(true);
    setEvalError(null);
    try {
      const res = await fetch(`/api/v1/questions/${qId}`);
      if (res.ok) {
        const detail: QuestionDetail = await res.json();
        setSelectedQuestionDetail(detail);
        initializeAnswerForQuestion(detail);
      }
    } catch (err: any) {
      setEvalError(err.message || 'Failed to load question details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const initializeAnswerForQuestion = (q: QuestionDetail) => {
    setIsNotAssessed(false);
    const rubricType = q.rubricType;
    const cfg = q.rubricConfig || {};

    let initialAns: Record<string, any> = {};

    switch (rubricType) {
      case 'GRID_AFU': {
        const rows: string[] = cfg.rows || ['Item 1', 'Item 2', 'Item 3'];
        const rowList = rows.map(r => ({
          name: r,
          available: true,
          functional: true,
          used: true
        }));
        initialAns = { rows: rowList };
        break;
      }
      case 'CHECKLIST_YNP': {
        const items: string[] = cfg.items || ['Criteria 1', 'Criteria 2', 'Criteria 3', 'Criteria 4'];
        const itmList = items.map(item => ({
          item,
          status: 'YES'
        }));
        initialAns = { items: itmList };
        break;
      }
      case 'YESNO_WITH_COUNT': {
        initialAns = {
          available: true,
          count: 25
        };
        break;
      }
      case 'RATING_1_5': {
        initialAns = {
          rating: 4.0
        };
        break;
      }
      case 'PERCENT_THRESHOLD': {
        const threshold = cfg.threshold ?? 75;
        initialAns = {
          percentage: threshold
        };
        break;
      }
      case 'RATIO': {
        initialAns = {
          working: 8,
          sanctioned: 10,
          numerator: 8,
          denominator: 10
        };
        break;
      }
      default:
        initialAns = { response: 'Sample Response' };
        break;
    }

    setAnswerState(initialAns);
    // Auto-evaluate immediately
    runEvaluation(q.id, initialAns, q);
  };

  const initializeAnswerForAdHoc = (rType: string, cfg: Record<string, any>) => {
    setIsNotAssessed(false);
    let initialAns: Record<string, any> = {};

    switch (rType) {
      case 'GRID_AFU': {
        const rows: string[] = cfg.rows || ['Item 1', 'Item 2'];
        initialAns = {
          rows: rows.map(r => ({ name: r, available: true, functional: true, used: true }))
        };
        break;
      }
      case 'CHECKLIST_YNP': {
        const items: string[] = cfg.items || ['Item A', 'Item B', 'Item C'];
        initialAns = {
          items: items.map(i => ({ item: i, status: 'YES' }))
        };
        break;
      }
      case 'YESNO_WITH_COUNT': {
        initialAns = { available: true, count: 12 };
        break;
      }
      case 'RATING_1_5': {
        initialAns = { rating: 5.0 };
        break;
      }
      case 'PERCENT_THRESHOLD': {
        initialAns = { percentage: cfg.threshold ?? 75 };
        break;
      }
      case 'RATIO': {
        initialAns = { numerator: 9, denominator: 10 };
        break;
      }
      default:
        initialAns = {};
        break;
    }

    setAnswerState(initialAns);
    runAdHocEvaluation(rType, adHocSeverity, cfg, initialAns, adHocRedFlagLogic, adHocIntervention);
  };

  const runEvaluation = async (
    qId: string,
    currentAnswers: Record<string, any>,
    _qDetail?: QuestionDetail
  ) => {
    setEvaluating(true);
    setEvalError(null);

    const payload: any = {
      answer: isNotAssessed
        ? { is_not_assessed: true, not_assessed_reason: notAssessedReason }
        : currentAnswers
    };

    try {
      const res = await fetch(`/api/v1/questions/${qId}/test-rubric`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Evaluation failed on server');
      }
      const data: RubricTestResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setEvalError(err.message || 'Failed to evaluate rubric');
    } finally {
      setEvaluating(false);
    }
  };

  const runAdHocEvaluation = async (
    rType: string,
    sev: string,
    cfg: Record<string, any>,
    currentAnswers: Record<string, any>,
    rfLogic: string,
    interv: string
  ) => {
    setEvaluating(true);
    setEvalError(null);

    const payload = {
      rubricConfig: { ...cfg, type: rType },
      severity: sev,
      answer: isNotAssessed
        ? { is_not_assessed: true, not_assessed_reason: notAssessedReason }
        : currentAnswers,
      redFlagLogic: rfLogic,
      suggestedIntervention: interv
    };

    try {
      const res = await fetch('/api/v1/questions/test-rubric-ad-hoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Ad-hoc evaluation failed');
      }
      const data: RubricTestResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setEvalError(err.message || 'Failed to evaluate ad-hoc rubric');
    } finally {
      setEvaluating(false);
    }
  };

  // Helper trigger
  const handleAnswerChangeAndEvaluate = (newAnswers: Record<string, any>) => {
    setAnswerState(newAnswers);
    if (mode === 'BANK' && selectedQuestionDetail) {
      runEvaluation(selectedQuestionDetail.id, newAnswers, selectedQuestionDetail);
    } else {
      runAdHocEvaluation(
        adHocRubricType,
        adHocSeverity,
        adHocConfig,
        newAnswers,
        adHocRedFlagLogic,
        adHocIntervention
      );
    }
  };

  // Quick Preset Scenarios
  const applyPresetScenario = (scenario: 'FULL' | 'PARTIAL' | 'CRITICAL' | 'SECTION_9_5' | 'UNASSESSED') => {
    if (scenario === 'UNASSESSED') {
      setIsNotAssessed(true);
      if (mode === 'BANK' && selectedQuestionDetail) {
        runEvaluation(selectedQuestionDetail.id, {});
      } else {
        runAdHocEvaluation(adHocRubricType, adHocSeverity, adHocConfig, {}, adHocRedFlagLogic, adHocIntervention);
      }
      return;
    }

    setIsNotAssessed(false);
    const activeRubricType = mode === 'BANK' ? selectedQuestionDetail?.rubricType || 'GRID_AFU' : adHocRubricType;

    let newAns: Record<string, any> = {};

    if (activeRubricType === 'GRID_AFU') {
      const rows = (mode === 'BANK' ? selectedQuestionDetail?.rubricConfig?.rows : adHocConfig.rows) || ['Item 1', 'Item 2'];
      if (scenario === 'FULL') {
        newAns = { rows: rows.map((r: string) => ({ name: r, available: true, functional: true, used: true })) };
      } else if (scenario === 'PARTIAL') {
        newAns = { rows: rows.map((r: string, idx: number) => ({ name: r, available: true, functional: idx === 0, used: idx === 0 })) };
      } else {
        // CRITICAL / SECTION_9_5
        newAns = { rows: rows.map((r: string) => ({ name: r, available: false, functional: false, used: false })) };
      }
    } else if (activeRubricType === 'CHECKLIST_YNP') {
      const items = (mode === 'BANK' ? selectedQuestionDetail?.rubricConfig?.items : adHocConfig.items) || ['Item 1', 'Item 2', 'Item 3'];
      if (scenario === 'FULL') {
        newAns = { items: items.map((i: string) => ({ item: i, status: 'YES' })) };
      } else if (scenario === 'PARTIAL') {
        newAns = { items: items.map((i: string, idx: number) => ({ item: i, status: idx % 2 === 0 ? 'PARTIAL' : 'YES' })) };
      } else {
        newAns = { items: items.map((i: string) => ({ item: i, status: 'NO' })) };
      }
    } else if (activeRubricType === 'YESNO_WITH_COUNT') {
      if (scenario === 'FULL') newAns = { available: true, count: 50 };
      else if (scenario === 'PARTIAL') newAns = { available: true, count: 0 }; // 50% points penalty
      else newAns = { available: false, count: 0 };
    } else if (activeRubricType === 'RATING_1_5') {
      if (scenario === 'FULL') newAns = { rating: 5.0 };
      else if (scenario === 'PARTIAL') newAns = { rating: 3.0 };
      else newAns = { rating: 1.0 }; // <= 2 triggers red flag
    } else if (activeRubricType === 'PERCENT_THRESHOLD') {
      const thresh = (mode === 'BANK' ? selectedQuestionDetail?.rubricConfig?.threshold : adHocConfig.threshold) ?? 75;
      if (scenario === 'FULL') newAns = { percentage: thresh + 5 };
      else if (scenario === 'PARTIAL') newAns = { percentage: thresh - 5 };
      else newAns = { percentage: Math.max(0, thresh - 25) };
    } else if (activeRubricType === 'RATIO') {
      if (scenario === 'FULL') newAns = { numerator: 10, denominator: 10, working: 10, sanctioned: 10 };
      else if (scenario === 'PARTIAL') newAns = { numerator: 6, denominator: 10, working: 6, sanctioned: 10 };
      else newAns = { numerator: 2, denominator: 10, working: 2, sanctioned: 10 };
    }

    handleAnswerChangeAndEvaluate(newAns);
  };

  const getAlertBadgeColor = (band?: string | null) => {
    switch (band) {
      case 'DARK_GREEN': return '#10b981';
      case 'LIGHT_GREEN': return '#84cc16';
      case 'AMBER': return '#f59e0b';
      case 'ORANGE': return '#f97316';
      case 'RED': return '#dc2626';
      default: return '#9ca3af';
    }
  };

  const currentRubricType = mode === 'BANK' ? selectedQuestionDetail?.rubricType || 'NONE' : adHocRubricType;
  const currentSeverity = mode === 'BANK' ? selectedQuestionDetail?.severity || 'HIGH' : adHocSeverity;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onBackToBank && (
              <button
                type="button"
                onClick={onBackToBank}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                ← Question Bank
              </button>
            )}
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              ⚡ Deterministic Rubric Sandbox
            </h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
            Interactive mathematical validator for all 7 rubric scoring models, alert spectrums, and Section 9.5 clamping rules.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="segmented-control" style={{ width: '320px' }}>
          <button
            type="button"
            className={`segment-btn ${mode === 'BANK' ? 'active' : ''}`}
            onClick={() => {
              setMode('BANK');
              if (selectedQuestionDetail) {
                initializeAnswerForQuestion(selectedQuestionDetail);
              }
            }}
          >
            📋 Question Bank Mode
          </button>
          <button
            type="button"
            className={`segment-btn ${mode === 'ADHOC' ? 'active' : ''}`}
            onClick={() => {
              setMode('ADHOC');
              initializeAnswerForAdHoc(adHocRubricType, adHocConfig);
            }}
          >
            🧪 Ad-hoc Sandbox
          </button>
        </div>
      </div>

      {/* Main Sandbox Grid: Left Configuration / Inputs, Right Live Evaluation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1fr)', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Input and Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Mode 1: Question Bank Selector */}
          {mode === 'BANK' ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="field-label">Select Audit Question (72 Seeded Questions)</label>
                <select
                  className="input-field"
                  value={selectedQuestionId}
                  onChange={(e) => setSelectedQuestionId(e.target.value)}
                  disabled={loadingQuestions || loadingDetail}
                >
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      [{q.id}] ({q.domain}) - {q.canonicalText.length > 60 ? q.canonicalText.substring(0, 60) + '...' : q.canonicalText} ({q.rubricType})
                    </option>
                  ))}
                </select>
              </div>

              {selectedQuestionDetail && (
                <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace', fontSize: '13px' }}>
                      {selectedQuestionDetail.id}
                    </span>
                    <span style={{ fontSize: '12px', background: 'var(--surface)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--line)' }}>
                      {selectedQuestionDetail.domain} &gt; {selectedQuestionDetail.section}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: selectedQuestionDetail.severity === 'CRITICAL' ? '#fee2e2' : selectedQuestionDetail.severity === 'HIGH' ? '#ffedd5' : '#fef9c3',
                      color: selectedQuestionDetail.severity === 'CRITICAL' ? '#991b1b' : selectedQuestionDetail.severity === 'HIGH' ? '#9a3412' : '#854d0e'
                    }}>
                      {selectedQuestionDetail.severity} (Weight: {selectedQuestionDetail.severity === 'CRITICAL' ? '3×' : selectedQuestionDetail.severity === 'HIGH' ? '2×' : '1×'})
                    </span>
                    <span style={{ fontSize: '12px', background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {selectedQuestionDetail.rubricType}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink)', fontWeight: 500 }}>
                    "{selectedQuestionDetail.canonicalText}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Ad-Hoc Configurator */
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Ad-Hoc Rubric Specification</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Rubric Model</label>
                  <select
                    className="input-field"
                    value={adHocRubricType}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setAdHocRubricType(nextType);
                      initializeAnswerForAdHoc(nextType, adHocConfig);
                    }}
                  >
                    <option value="GRID_AFU">GRID_AFU (Available / Functional / Used)</option>
                    <option value="CHECKLIST_YNP">CHECKLIST_YNP (Yes / Partial / No / NA)</option>
                    <option value="YESNO_WITH_COUNT">YESNO_WITH_COUNT (Binary + Uptake Count)</option>
                    <option value="RATING_1_5">RATING_1_5 (1..5 Observation Scale)</option>
                    <option value="PERCENT_THRESHOLD">PERCENT_THRESHOLD (Benchmarked %)</option>
                    <option value="RATIO">RATIO (Numerator / Denominator)</option>
                    <option value="NONE">NONE (Informational Unscored)</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Severity Level</label>
                  <select
                    className="input-field"
                    value={adHocSeverity}
                    onChange={(e) => {
                      const nextSev = e.target.value as 'CRITICAL' | 'HIGH' | 'MEDIUM';
                      setAdHocSeverity(nextSev);
                      runAdHocEvaluation(adHocRubricType, nextSev, adHocConfig, answerState, adHocRedFlagLogic, adHocIntervention);
                    }}
                  >
                    <option value="CRITICAL">CRITICAL (3× Multiplier, Section 9.5 Clamp &lt;50%)</option>
                    <option value="HIGH">HIGH (2× Multiplier)</option>
                    <option value="MEDIUM">MEDIUM (1× Multiplier)</option>
                  </select>
                </div>
              </div>

              {/* Rubric Specific Options for Ad-Hoc */}
              {adHocRubricType === 'PERCENT_THRESHOLD' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="field-label">Benchmark Threshold %</label>
                    <input
                      type="number"
                      className="input-field"
                      value={adHocConfig.threshold ?? 75}
                      onChange={(e) => {
                        const next = { ...adHocConfig, threshold: parseFloat(e.target.value) || 0 };
                        setAdHocConfig(next);
                        runAdHocEvaluation(adHocRubricType, adHocSeverity, next, answerState, adHocRedFlagLogic, adHocIntervention);
                      }}
                    />
                  </div>
                  <div>
                    <label className="field-label">Partial Margin %</label>
                    <input
                      type="number"
                      className="input-field"
                      value={adHocConfig.partial_margin ?? 10}
                      onChange={(e) => {
                        const next = { ...adHocConfig, partial_margin: parseFloat(e.target.value) || 0 };
                        setAdHocConfig(next);
                        runAdHocEvaluation(adHocRubricType, adHocSeverity, next, answerState, adHocRedFlagLogic, adHocIntervention);
                      }}
                    />
                  </div>
                  <div>
                    <label className="field-label">Inverted Polarity?</label>
                    <select
                      className="input-field"
                      value={adHocConfig.inverted ? 'true' : 'false'}
                      onChange={(e) => {
                        const next = { ...adHocConfig, inverted: e.target.value === 'true' };
                        setAdHocConfig(next);
                        runAdHocEvaluation(adHocRubricType, adHocSeverity, next, answerState, adHocRedFlagLogic, adHocIntervention);
                      }}
                    >
                      <option value="false">Standard (Higher is better)</option>
                      <option value="true">Inverted (Lower is better, e.g. Mismatch)</option>
                    </select>
                  </div>
                </div>
              )}

              {adHocRubricType === 'GRID_AFU' && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(adHocConfig.score_used)}
                      onChange={(e) => {
                        const next = { ...adHocConfig, score_used: e.target.checked };
                        setAdHocConfig(next);
                        runAdHocEvaluation(adHocRubricType, adHocSeverity, next, answerState, adHocRedFlagLogic, adHocIntervention);
                      }}
                    />
                    <b>Include 'Used' Metric in 3-point calculation (Avail + Func + Used = 3 pts)</b>
                  </label>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Red Flag Trigger Text</label>
                  <input
                    type="text"
                    className="input-field"
                    value={adHocRedFlagLogic}
                    onChange={(e) => setAdHocRedFlagLogic(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Suggested Intervention</label>
                  <input
                    type="text"
                    className="input-field"
                    value={adHocIntervention}
                    onChange={(e) => setAdHocIntervention(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preset Buttons for Quick Testing */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
              ⚡ 1-Click Simulation Scenarios
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => applyPresetScenario('FULL')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                🟢 100% Full Compliance
              </button>
              <button
                type="button"
                onClick={() => applyPresetScenario('PARTIAL')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                🟡 Partial Compliance (50%)
              </button>
              <button
                type="button"
                onClick={() => applyPresetScenario('CRITICAL')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                🔴 Total Failure (0% Red Flag)
              </button>
              <button
                type="button"
                onClick={() => applyPresetScenario('UNASSESSED')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                ⚪ Unassessed / Excluded
              </button>
            </div>
          </div>

          {/* Interactive Answer Form */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                Field Input Simulator ({currentRubricType})
              </h2>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isNotAssessed}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsNotAssessed(checked);
                    if (mode === 'BANK' && selectedQuestionDetail) {
                      runEvaluation(selectedQuestionDetail.id, checked ? {} : answerState);
                    } else {
                      runAdHocEvaluation(
                        adHocRubricType,
                        adHocSeverity,
                        adHocConfig,
                        checked ? {} : answerState,
                        adHocRedFlagLogic,
                        adHocIntervention
                      );
                    }
                  }}
                />
                Mark as <b>Not Assessed / N/A</b>
              </label>
            </div>

            {isNotAssessed ? (
              <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '8px' }}>
                <label className="field-label">Reason for Non-Assessment</label>
                <input
                  type="text"
                  className="input-field"
                  value={notAssessedReason}
                  onChange={(e) => {
                    setNotAssessedReason(e.target.value);
                  }}
                  placeholder="e.g., Facility was locked or not applicable for institution grade"
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                  Questions marked Not Assessed do not contribute to denominators and do not deduct points.
                </p>
              </div>
            ) : (
              <div>
                {/* 1. GRID_AFU */}
                {currentRubricType === 'GRID_AFU' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '6px 12px', background: 'var(--surface-2)', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                      <span>FACILITY / COMPONENT</span>
                      <span style={{ textAlign: 'center' }}>AVAILABLE</span>
                      <span style={{ textAlign: 'center' }}>FUNCTIONAL</span>
                      <span style={{ textAlign: 'center' }}>USED</span>
                    </div>

                    {(answerState.rows || []).map((row: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1fr',
                          alignItems: 'center',
                          padding: '10px 12px',
                          border: '1px solid var(--line)',
                          borderRadius: '8px',
                          background: 'var(--surface)'
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{row.name}</span>
                        
                        <div style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            checked={Boolean(row.available)}
                            onChange={(e) => {
                              const updatedRows = [...answerState.rows];
                              updatedRows[idx] = {
                                ...updatedRows[idx],
                                available: e.target.checked,
                                // If not available, functional and used cannot be true
                                functional: e.target.checked ? updatedRows[idx].functional : false,
                                used: e.target.checked ? updatedRows[idx].used : false
                              };
                              handleAnswerChangeAndEvaluate({ ...answerState, rows: updatedRows });
                            }}
                          />
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            checked={Boolean(row.functional)}
                            disabled={!row.available}
                            onChange={(e) => {
                              const updatedRows = [...answerState.rows];
                              updatedRows[idx] = {
                                ...updatedRows[idx],
                                functional: e.target.checked
                              };
                              handleAnswerChangeAndEvaluate({ ...answerState, rows: updatedRows });
                            }}
                          />
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            checked={Boolean(row.used)}
                            disabled={!row.available}
                            onChange={(e) => {
                              const updatedRows = [...answerState.rows];
                              updatedRows[idx] = {
                                ...updatedRows[idx],
                                used: e.target.checked
                              };
                              handleAnswerChangeAndEvaluate({ ...answerState, rows: updatedRows });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. CHECKLIST_YNP */}
                {currentRubricType === 'CHECKLIST_YNP' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(answerState.items || []).map((itm: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          border: '1px solid var(--line)',
                          borderRadius: '8px',
                          background: 'var(--surface)',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '14px', flex: 1 }}>{itm.item}</span>
                        
                        <div className="segmented-control" style={{ width: '280px' }}>
                          {(['YES', 'PARTIAL', 'NO', 'NA'] as const).map((status) => (
                            <button
                              key={status}
                              type="button"
                              className={`segment-btn ${itm.status === status ? 'active' : ''}`}
                              style={{
                                padding: '6px 8px',
                                fontSize: '12px',
                                color: itm.status === status
                                  ? (status === 'YES' ? '#15803d' : status === 'PARTIAL' ? '#b45309' : status === 'NO' ? '#b91c1c' : 'var(--muted)')
                                  : undefined
                              }}
                              onClick={() => {
                                const updatedItems = [...answerState.items];
                                updatedItems[idx] = { ...updatedItems[idx], status };
                                handleAnswerChangeAndEvaluate({ ...answerState, items: updatedItems });
                              }}
                            >
                              {status === 'YES' ? 'Yes (1.0)' : status === 'PARTIAL' ? 'Part (0.5)' : status === 'NO' ? 'No (0)' : 'N/A'}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. YESNO_WITH_COUNT */}
                {currentRubricType === 'YESNO_WITH_COUNT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label className="field-label">Service Available / Program Active?</label>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="yesno_avail"
                            checked={Boolean(answerState.available)}
                            onChange={() => handleAnswerChangeAndEvaluate({ ...answerState, available: true })}
                          />
                          <b>Yes (Available)</b>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="yesno_avail"
                            checked={!Boolean(answerState.available)}
                            onChange={() => handleAnswerChangeAndEvaluate({ ...answerState, available: false })}
                          />
                          <b>No (Not Available)</b>
                        </label>
                      </div>
                    </div>

                    {answerState.available && (
                      <div>
                        <label className="field-label">Beneficiary Uptake / Support Count</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="number"
                            min="0"
                            className="input-field"
                            style={{ width: '160px' }}
                            value={answerState.count ?? 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              handleAnswerChangeAndEvaluate({ ...answerState, count: val });
                            }}
                          />
                          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                            {answerState.count > 0
                              ? '✅ Full points awarded (uptake recorded)'
                              : '⚠️ Zero uptake recorded (50% uptake penalty applied per Section 9.1)'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. RATING_1_5 */}
                {currentRubricType === 'RATING_1_5' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label className="field-label">Field Observation Rating (1 to 5 Stars)</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleAnswerChangeAndEvaluate({ ...answerState, rating: val })}
                          style={{
                            flex: 1,
                            padding: '16px 8px',
                            borderRadius: '8px',
                            border: answerState.rating === val ? '2px solid var(--accent)' : '1px solid var(--line)',
                            background: answerState.rating === val ? 'var(--accent-soft)' : 'var(--surface)',
                            color: answerState.rating === val ? 'var(--accent)' : 'var(--ink)',
                            fontWeight: 700,
                            fontSize: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <span>{'⭐'.repeat(val)}</span>
                          <span style={{ fontSize: '13px' }}>Level {val}</span>
                        </button>
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                      Rating formula: <code>(rating - 1) / 4 × 10</code>. Ratings ≤ 2 trigger an immediate Red Flag.
                    </p>
                  </div>
                )}

                {/* 5. PERCENT_THRESHOLD */}
                {currentRubricType === 'PERCENT_THRESHOLD' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="field-label">Observed Percentage Value (%)</label>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
                        {answerState.percentage ?? 0}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={answerState.percentage ?? 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        handleAnswerChangeAndEvaluate({ ...answerState, percentage: val });
                      }}
                      style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="input-field"
                        style={{ width: '120px' }}
                        value={answerState.percentage ?? 0}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                          handleAnswerChangeAndEvaluate({ ...answerState, percentage: val });
                        }}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        Benchmark target: <b>{mode === 'BANK' ? selectedQuestionDetail?.rubricConfig?.threshold ?? 75 : adHocConfig.threshold ?? 75}%</b>
                      </span>
                    </div>
                  </div>
                )}

                {/* 6. RATIO */}
                {currentRubricType === 'RATIO' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="field-label">Numerator (e.g. Working / Present)</label>
                      <input
                        type="number"
                        min="0"
                        className="input-field"
                        value={answerState.numerator ?? answerState.working ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleAnswerChangeAndEvaluate({
                            ...answerState,
                            numerator: val,
                            working: val
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="field-label">Denominator (e.g. Sanctioned / Total)</label>
                      <input
                        type="number"
                        min="0"
                        className="input-field"
                        value={answerState.denominator ?? answerState.sanctioned ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleAnswerChangeAndEvaluate({
                            ...answerState,
                            denominator: val,
                            sanctioned: val
                          });
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 7. NONE */}
                {currentRubricType === 'NONE' && (
                  <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '8px', color: 'var(--muted)' }}>
                    ℹ️ This question is configured as <b>Informational (Unscored)</b>. Responses are collected for audit context but contribute 0 points to score aggregations.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Evaluation Display */}
        <div style={{ position: 'sticky', top: '76px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                Live Score Output
              </h2>
              {evaluating && (
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
                  Calculating...
                </span>
              )}
            </div>

            {evalError && (
              <div className="alert-banner alert-danger">
                <span>⚠️ {evalError}</span>
              </div>
            )}

            {result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* 1. Large Spectrum Badge & Percentage */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: result.assessed
                      ? (result.alertBand === 'RED'
                        ? '#fef2f2'
                        : result.alertBand === 'ORANGE'
                        ? '#fff7ed'
                        : result.alertBand === 'AMBER'
                        ? '#fffbeb'
                        : result.alertBand === 'LIGHT_GREEN'
                        ? '#f7fee7'
                        : '#ecfdf5')
                      : 'var(--surface-2)',
                    border: `2px solid ${getAlertBadgeColor(result.alertBand)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: getAlertBadgeColor(result.alertBand)
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '15px',
                          color: getAlertBadgeColor(result.alertBand)
                        }}
                      >
                        {result.assessed ? result.alertBand?.replace('_', ' ') : 'UNASSESSED'}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                      {result.assessed ? result.alertLabel : result.unassessedReason || 'Not Assessed'}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: getAlertBadgeColor(result.alertBand), lineHeight: 1 }}>
                      {result.assessed ? `${result.percentage.toFixed(1)}%` : '—'}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Earned Ratio
                    </span>
                  </div>
                </div>

                {/* Section 9.5 Clamping Badge if applicable */}
                {result.assessed && currentSeverity === 'CRITICAL' && result.percentage < 50.0 && result.alertBand === 'RED' && (
                  <div
                    style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: '1px solid #f87171',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🛡️</span>
                    <span>
                      <b>Section 9.5 Rule Applied:</b> Critical question with &lt;50% score is clamped directly to RED spectrum.
                    </span>
                  </div>
                )}

                {/* 2. Numerical Score Breakdown Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Raw Earned / Max
                    </span>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                      {result.rawEarned.toFixed(2)} / {result.rawMax.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Severity Multiplier
                    </span>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                      {currentSeverity} (×{result.severityWeight})
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Weighted Points
                    </span>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
                      {result.earnedWeighted.toFixed(2)} / {result.maxWeighted.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Points Lost (Deduction)
                    </span>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: result.pointsLost > 0 ? '#b91c1c' : '#15803d' }}>
                      {result.pointsLost > 0 ? `-${result.pointsLost.toFixed(2)} pts` : '0.00 pts'}
                    </div>
                  </div>
                </div>

                {/* 3. Red Flag Banner */}
                {result.redFlagTriggered ? (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '2px solid #ef4444',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: 700, fontSize: '14px' }}>
                      <span>🚩</span>
                      <span>RED FLAG TRIGGERED</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#7f1d1d' }}>
                      <b>Trigger Reason:</b> {result.redFlagReason || 'Non-compliance detected'}
                    </div>
                    {result.suggestedIntervention && (
                      <div style={{ fontSize: '13px', color: '#991b1b', background: '#fee2e2', padding: '8px 10px', borderRadius: '6px' }}>
                        <b>Suggested Action:</b> {result.suggestedIntervention}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#15803d',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    <span>✅</span>
                    <span>No red flag triggered. Performance satisfies standard thresholds.</span>
                  </div>
                )}

                {/* 4. Formula Working Trail */}
                {result.ruleWorkingText && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Formula Working Trail (Section 9)
                    </span>
                    <div
                      style={{
                        background: 'var(--surface-2)',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: 'var(--ink)',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {result.ruleWorkingText}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)' }}>
                Select a question or adjust answers to view live mathematical score breakdown.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
