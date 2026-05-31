import React, { useEffect, useMemo, useState } from 'react';
import {
  cohortSummaries,
  fieldDictionary,
  historicalUploadSummary,
  initialAuditRecords,
  sampleNewCases,
  newCaseUploadSummary,
} from './data/ncdbSampleData';
import { answerAgentQuestion, assessRisk, runWhatIf } from './lib/riskReasoning';

const pages = ['Agent Reasoning Workspace', 'NCDB Data Foundation', 'New Case Intake', 'Risk Assessment Workspace', 'Scenario Simulator', 'Cohort Comparison', 'Human Review', 'Audit Log'];
const questionChips = ['Explain this result', 'Which factor contributes the most?', 'Why is this case high risk?', 'What evidence supports this recommendation?', 'What data is missing?', 'What would reduce the risk?', 'Should this go to human review?'];
const scenarioChips = ['Newer vehicle', 'Daytime instead of late night', 'Dry road instead of icy road', 'Clear weather instead of snow', 'Minor collision instead of severe collision', 'More complete applicant data', 'Different vehicle type'];
const reviewOptions = ['Continue standard review', 'Continue elevated review', 'Escalate to senior underwriter', 'Request more documentation', 'Override agent recommendation', 'Mark as reviewed'];
const fieldLabels = {
  C_YEAR: 'Collision year', C_MNTH: 'Collision month', C_WDAY: 'Day of week', C_HOUR: 'Collision hour', C_SEV: 'Collision severity', C_VEHS: 'Number of vehicles involved', C_CONF: 'Collision configuration', C_WTHR: 'Weather condition', C_RSUR: 'Road surface condition', C_RALN: 'Road alignment', C_TRAF: 'Traffic control condition', V_TYPE: 'Vehicle type', V_YEAR: 'Vehicle year', P_SEX: 'Person sex', P_AGE: 'Person age', P_ISEV: 'Person injury severity', P_SAFE: 'Safety device used', P_USER: 'Road user class',
};

function App() {
  const [page, setPage] = useState('Agent Reasoning Workspace');
  const [selectedCaseId, setSelectedCaseId] = useState(sampleNewCases[0].id);
  const [historicalUploaded, setHistoricalUploaded] = useState(false);
  const [caseUploaded, setCaseUploaded] = useState(false);
  const [scenarioQuestion, setScenarioQuestion] = useState('');
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [auditRecords, setAuditRecords] = useState(initialAuditRecords);
  const [agentAnswer, setAgentAnswer] = useState('Select a question to see a plain-language response grounded in the selected case.');
  const [selectedCohortId, setSelectedCohortId] = useState(cohortSummaries[0].id);
  const [humanDecision, setHumanDecision] = useState('Continue elevated review');
  const [humanRationale, setHumanRationale] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [auditFilter, setAuditFilter] = useState('All');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpResponses, setFollowUpResponses] = useState([]);

  const selectedCase = sampleNewCases.find((item) => item.id === selectedCaseId) || sampleNewCases[0];
  const assessment = useMemo(() => assessRisk(selectedCase), [selectedCase]);
  const selectedCohort = cohortSummaries.find((item) => item.id === selectedCohortId) || cohortSummaries[0];

  useEffect(() => {
    setWhatIfResult(null);
    setAgentAnswer('Select a question to see a plain-language response grounded in the selected case.');
    setHumanRationale('');
    setReviewMessage('');
    setFollowUpQuestion('');
    setFollowUpResponses([]);
  }, [selectedCaseId]);

  function runScenario(question = scenarioQuestion) {
    const result = runWhatIf(selectedCase, question);
    setWhatIfResult(result);
    if (question) setScenarioQuestion(question);
  }

  function saveScenarioToAudit() {
    if (!whatIfResult?.mapped) return;
    setAuditRecords((records) => [makeAuditRecord({ selectedCase, assessment, scenario: `${whatIfResult.interpreted}: ${whatIfResult.changed}`, humanDecision: 'Scenario saved for review', humanRationale: whatIfResult.explanation, tags: ['Scenario tested'] }), ...records]);
  }

  function recordHumanDecision() {
    if (!humanRationale.trim()) return;
    setAuditRecords((records) => [makeAuditRecord({ selectedCase, assessment, scenario: whatIfResult?.mapped ? whatIfResult.interpreted : 'None', humanDecision, humanRationale, tags: tagDecision(humanDecision, assessment) }), ...records]);
    setReviewMessage('Decision recorded to audit log.');
  }

  function submitFollowUp(question = followUpQuestion) {
    if (!question.trim()) return;
    setFollowUpResponses((responses) => [...responses, { question, answer: answerAgentQuestion(question, assessment) }]);
    setFollowUpQuestion('');
  }

  const pageProps = { page, setPage, selectedCase, selectedCaseId, setSelectedCaseId, historicalUploaded, setHistoricalUploaded, caseUploaded, setCaseUploaded, assessment, agentAnswer, setAgentAnswer, scenarioQuestion, setScenarioQuestion, whatIfResult, runScenario, saveScenarioToAudit, selectedCohort, selectedCohortId, setSelectedCohortId, humanDecision, setHumanDecision, humanRationale, setHumanRationale, reviewMessage, recordHumanDecision, auditRecords, auditFilter, setAuditFilter, followUpQuestion, setFollowUpQuestion, followUpResponses, submitFollowUp };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-72 flex-col bg-slate-950 text-white">
        <div className="border-b border-white/10 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">Decision Support</div>
          <h1 className="mt-3 text-2xl font-bold leading-tight">Risk Assessment & Underwriting Support Platform</h1>
          <p className="mt-2 text-sm text-slate-300">Explainability, simulation, and governance layer.</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {pages.map((item, index) => (
            <button key={item} onClick={() => setPage(item)} className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${page === item ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
              <span className="mr-3 text-slate-400">{index + 1}.</span>{item}
            </button>
          ))}
        </nav>
        <div className="m-4 rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
          <p className="font-semibold text-white">Selected case</p>
          <p className="mt-1">{selectedCase.id}</p>
          <p className="mt-1 text-xs text-slate-400">{selectedCase.name}</p>
          <p className="mt-2 inline-flex rounded-full bg-blue-500/20 px-2 py-1 text-xs font-semibold text-blue-100">{assessment.level}</p>
        </div>
      </aside>
      <main className="ml-72 min-h-screen flex-1">
        <TopBar selectedCase={selectedCase} assessment={assessment} />
        <div className="p-8">
          {page === 'Agent Reasoning Workspace' && <AgentReasoningWorkspace {...pageProps} />}
          {page === 'NCDB Data Foundation' && <NCDBDataFoundation {...pageProps} />}
          {page === 'New Case Intake' && <NewCaseIntake {...pageProps} />}
          {page === 'Risk Assessment Workspace' && <RiskAssessmentWorkspace {...pageProps} />}
          {page === 'Scenario Simulator' && <ScenarioSimulator {...pageProps} />}
          {page === 'Cohort Comparison' && <CohortComparison {...pageProps} />}
          {page === 'Human Review' && <HumanReview {...pageProps} />}
          {page === 'Audit Log' && <AuditLog {...pageProps} />}
        </div>
      </main>
    </div>
  );
}

function TopBar({ selectedCase, assessment }) {
  return <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur"><div><p className="text-sm text-slate-500">Current workspace</p><h2 className="text-xl font-bold text-slate-900">{selectedCase.name}</h2></div><div className="flex items-center gap-3"><Badge>{selectedCase.id}</Badge><Badge tone={assessment.level}>{assessment.level}</Badge><span className="text-sm text-slate-500">{assessment.confidence}</span></div></header>;
}

function AgentReasoningWorkspace({ setPage, selectedCase, assessment, auditRecords, followUpQuestion, setFollowUpQuestion, followUpResponses, submitFollowUp }) {
  const reasoningSteps = [
    {
      title: 'Case intake summary',
      body: `${selectedCase.id} is loaded from ${selectedCase.sourceFile}. ${selectedCase.description}`,
    },
    {
      title: 'NCDB-grounded risk signals',
      body: assessment.topDrivers.map((driver) => `${driver.name}: ${driver.effect}`).join(' • '),
    },
    {
      title: 'Comparable cohort patterns',
      body: 'Historical collision patterns highlight vehicle age, injury severity, road surface, weather, time of day, and collision configuration as the most relevant comparison factors.',
    },
    {
      title: 'Scenario sensitivity',
      body: 'The case is sensitive to vehicle year, collision hour, road surface, weather condition, and injury-severity assumptions. Scenario tools are ready with this case loaded.',
    },
    {
      title: 'Recommended next step',
      body: assessment.recommendedNextStep,
    },
  ];
  const starterQuestions = ['Explain this result', 'Which factor contributes the most?', 'What data is missing?', 'What would reduce the risk?', 'Should this go to human review?'];

  return <Page title="Live Risk Assessment Agent" subtitle="Open case reasoning, follow-up questions, and underwriting review actions in one workspace.">
    <div className="grid grid-cols-12 gap-6">
      <Card className="col-span-8">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Agent reasoning workspace</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Assessing {selectedCase.id}</h2>
            <p className="mt-2 text-slate-600">The agent is walking through intake, NCDB-grounded signals, comparable patterns, scenario sensitivity, and the recommended underwriting review path.</p>
          </div>
          <Badge tone={assessment.level}>{assessment.level}</Badge>
        </div>

        <div className="space-y-4">
          {reasoningSteps.map((step, index) => <div key={step.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{index + 1}</div>
            <div>
              <p className="font-bold text-slate-950">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{step.body}</p>
            </div>
          </div>)}
        </div>

        <div className="mt-6 rounded-3xl bg-blue-50 p-5">
          <p className="font-bold text-slate-950">Structured risk assessment output</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <InfoBox label="Risk level" value={assessment.level} />
            <InfoBox label="Confidence" value={assessment.confidence} />
            <InfoBox label="Human review required" value={assessment.humanReviewRequired ? 'Yes' : 'No'} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-700">{assessment.reasoningSummary}</p>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Ask the agent a follow-up</p>
          <div className="flex flex-wrap gap-2">{starterQuestions.map((question) => <Chip key={question} onClick={() => submitFollowUp(question)}>{question}</Chip>)}</div>
          <div className="mt-4 flex gap-3">
            <input value={followUpQuestion} onChange={(event) => setFollowUpQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitFollowUp(); }} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Ask about risk drivers, missing data, cohorts, or review next steps" />
            <Button onClick={() => submitFollowUp()}>Ask agent</Button>
          </div>
          <div className="mt-5 space-y-3">
            {followUpResponses.map((item, index) => <div key={`${item.question}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-blue-700">Underwriter: {item.question}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Agent: {item.answer}</p>
            </div>)}
          </div>
        </div>
      </Card>

      <div className="col-span-4 space-y-6">
        <Card>
          <SectionTitle title="Selected case" subtitle={selectedCase.id} />
          <p className="text-sm leading-6 text-slate-600">{selectedCase.description}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p><strong>Assigned reviewer:</strong> {selectedCase.reviewer}</p>
            <p><strong>Data completeness:</strong> {selectedCase.completeness}</p>
            <p><strong>Audit records:</strong> {auditRecords.length}</p>
          </div>
        </Card>
        <Card>
          <SectionTitle title="Contextual tools" subtitle="Open with the selected case already loaded." />
          <div className="grid gap-3">
            <Button onClick={() => setPage('Cohort Comparison')}>View full cohort comparison →</Button>
            <Button onClick={() => setPage('Scenario Simulator')} variant="secondary">Run scenario simulation →</Button>
            <Button onClick={() => setPage('Human Review')} variant="secondary">Send to Human Review →</Button>
            <Button onClick={() => setPage('Audit Log')} variant="secondary">View audit trail →</Button>
          </div>
        </Card>
        <Card>
          <SectionTitle title="Top signals surfaced" subtitle="NCDB-grounded context for review." />
          <div className="space-y-3">{assessment.topDrivers.map((driver) => <div key={driver.name} className="rounded-xl bg-slate-50 p-3"><p className="font-semibold text-slate-900">{driver.name}</p><p className="text-xs text-slate-500">{driver.effect}</p></div>)}</div>
        </Card>
      </div>
    </div>
  </Page>;
}

function NCDBDataFoundation({ historicalUploaded, setHistoricalUploaded }) {
  return <Page title="NCDB Data Foundation" subtitle="File-based intake for cleaned NCDB-style historical collision data or uploaded historical risk records."><UploadBlock title="Upload Historical Risk Data File" subtitle="Upload cleaned NCDB-style historical collision data or uploaded historical risk records." onClick={() => setHistoricalUploaded(true)} />{historicalUploaded && <ProcessingSummary items={[['File uploaded successfully', 'Yes'], ['File name', historicalUploadSummary.fileName], ['Records loaded', historicalUploadSummary.recordsLoaded.toLocaleString()], ['Year range', historicalUploadSummary.yearRange], ['Detected columns', historicalUploadSummary.detectedColumns], ['Missing values flagged', historicalUploadSummary.missingValues], ['Data quality score', historicalUploadSummary.dataQualityScore], ['Last updated timestamp', new Date().toLocaleString()], ['Status', historicalUploadSummary.status]]} />}<Card className="mt-6"><SectionTitle title="Field dictionary" subtitle="Readable labels are primary; source fields are helper text for traceability." /><div className="grid grid-cols-3 gap-3">{fieldDictionary.map((field) => <div key={field.source} className="rounded-xl border border-slate-200 p-3"><p className="font-semibold text-slate-800">{field.label}</p><p className="mt-1 text-xs text-slate-400">Source field: {field.source}</p></div>)}</div></Card><Note>Platform currently uses NCDB-style historical collision data. In a future implementation, this sample dataset can be replaced with cleaned official NCDB extracts.</Note></Page>;
}

function NewCaseIntake({ caseUploaded, setCaseUploaded, selectedCaseId, setSelectedCaseId, setPage }) {
  return <Page title="New Case Intake" subtitle="File-based intake for sample new applicant, policy, or case data."><UploadBlock title="Upload New Case File" subtitle="Upload sample new applicant, policy, or case data for underwriting review." onClick={() => setCaseUploaded(true)} />{caseUploaded && <ProcessingSummary items={[['File name', newCaseUploadSummary.fileName], ['Assigned reviewer', sampleNewCases.find((item) => item.id === selectedCaseId)?.reviewer || 'Unassigned'], ['New cases detected', newCaseUploadSummary.casesDetected], ['Fields mapped successfully', newCaseUploadSummary.fieldsMapped], ['Fields needing review', newCaseUploadSummary.fieldsNeedingReview], ['Data completeness status', newCaseUploadSummary.completeness]]}><Button onClick={() => setPage('Risk Assessment Workspace')}>Run risk assessment</Button></ProcessingSummary>}<Card className="mt-6"><SectionTitle title="New case selector" subtitle="These sample case profiles show how insurer-provided data can enter the underwriting review workflow." /><div className="grid grid-cols-3 gap-4">{sampleNewCases.map((item) => <button key={item.id} onClick={() => setSelectedCaseId(item.id)} className={`rounded-2xl border p-4 text-left transition ${selectedCaseId === item.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-200'}`}><p className="text-sm font-bold text-blue-700">{item.id}</p><h3 className="mt-2 text-lg font-bold text-slate-900">{item.name}</h3><p className="mt-2 text-sm text-slate-600">{item.description}</p><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{item.completeness}</p></button>)}</div></Card><Note>These are sample new-case profiles. In production, these can be replaced by insurer-provided applicant, policy, or portfolio data.</Note></Page>;
}

function RiskAssessmentWorkspace({ selectedCase, assessment, setPage, agentAnswer, setAgentAnswer }) {
  const summaryFields = ['P_AGE', 'V_YEAR', 'V_TYPE', 'C_WTHR', 'C_RSUR', 'C_SEV', 'P_ISEV', 'C_HOUR', 'C_CONF'];
  return <Page title="Risk Assessment Workspace" subtitle="Read-only intelligence workspace for the selected sample case."><div className="grid grid-cols-12 gap-6"><Card className="col-span-3"><SectionTitle title="Case Summary" subtitle="Original case data is read-only; corrections should occur before review." /><dl className="space-y-3"><InfoRow label="Case ID" value={selectedCase.id} /><InfoRow label="Selected file source" value={selectedCase.sourceFile} />{summaryFields.map((key) => <InfoRow key={key} label={fieldLabels[key]} value={selectedCase.data[key] ?? 'Needs confirmation'} helper={key} />)}<InfoRow label="Data completeness status" value={selectedCase.completeness} /></dl></Card><Card className="col-span-6"><SectionTitle title="Risk Assessment Result" subtitle="NCDB-grounded reasoning; no real model training or external API." /><div className="flex items-center gap-3"><Badge tone={assessment.level}>{assessment.level}</Badge><Badge>{assessment.confidence}</Badge></div><div className="mt-4 rounded-2xl bg-slate-100 p-4"><p className="text-sm text-slate-500">Baseline risk input from existing decisioning workflow</p><p className="font-semibold text-slate-800">{selectedCase.baselineRiskSignal}</p></div><p className="mt-4 text-slate-700">{assessment.reasoningSummary}</p><p className="mt-2 text-sm font-semibold text-blue-700">Recommended next step: {assessment.recommendedNextStep}</p><p className="mt-2 text-sm text-slate-600">Human review required: <strong>{assessment.humanReviewRequired ? 'Yes' : 'No'}</strong></p><div className="mt-6 grid grid-cols-2 gap-3">{assessment.drivers.map((driver) => <div key={`${driver.name}-${driver.sourceField}`} className="rounded-2xl border border-slate-200 p-4"><p className="font-bold text-slate-900">{driver.name}</p><p className="mt-1 text-sm font-semibold text-blue-700">{driver.effect}</p><p className="mt-2 text-sm text-slate-600">{driver.explanation}</p><p className="mt-3 text-xs text-slate-400">Source field: {driver.sourceField}</p></div>)}</div></Card><Card className="col-span-3"><SectionTitle title="Interactive Agent Questions" subtitle="Click a question for a plain-language explanation grounded in the selected case." /><div className="flex flex-wrap gap-2">{questionChips.map((question) => <Chip key={question} onClick={() => setAgentAnswer(answerAgentQuestion(question, assessment))}>{question}</Chip>)}</div><div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">{agentAnswer}</div><div className="mt-5 grid gap-2"><Button onClick={() => setPage('Scenario Simulator')}>Open What-if Simulator</Button><Button onClick={() => setPage('Cohort Comparison')} variant="secondary">Compare with similar cases</Button><Button onClick={() => setPage('Human Review')} variant="secondary">Send to Human Review</Button><Button onClick={() => setPage('Human Review')} variant="secondary">Record rationale</Button></div></Card></div></Page>;
}

function ScenarioSimulator({ selectedCase, assessment, scenarioQuestion, setScenarioQuestion, whatIfResult, runScenario, saveScenarioToAudit }) {
  return <Page title="Scenario Simulator" subtitle="Ask flexible natural-language what-if questions grounded in historical collision patterns."><Card className="mb-6"><SectionTitle title="Selected case for simulation" subtitle={selectedCase.id} /><p className="text-sm text-slate-600">{selectedCase.description}</p><div className="mt-3 flex gap-2"><Badge tone={assessment.level}>{assessment.level}</Badge><Badge>{assessment.confidence}</Badge></div></Card><Card><textarea value={scenarioQuestion} onChange={(e) => setScenarioQuestion(e.target.value)} placeholder="Ask a what-if question, e.g., What if the vehicle were newer? What if road surface were icy? What if the collision happened during daytime?" className="h-28 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /><div className="mt-4 flex flex-wrap gap-2">{scenarioChips.map((chip) => <Chip key={chip} onClick={() => runScenario(chip)}>{chip}</Chip>)}</div><div className="mt-5"><Button onClick={() => runScenario()}>Run What-if Simulation</Button></div></Card>{whatIfResult && <Card className="mt-6"><SectionTitle title="Simulation result" subtitle={selectedCase.id} />{whatIfResult.mapped ? <div className="grid grid-cols-2 gap-4"><InfoBox label="Interpreted scenario" value={whatIfResult.interpreted} /><InfoBox label="Changed assumption" value={whatIfResult.changed} /><InfoBox label="Original risk level" value={whatIfResult.originalRiskLevel} /><InfoBox label="Simulated risk level" value={whatIfResult.simulatedRiskLevel} /><InfoBox label="Risk direction" value={whatIfResult.riskDirection} /><InfoBox label="Confidence change" value={whatIfResult.confidenceChange} /><div className="col-span-2 rounded-2xl bg-slate-100 p-4"><p className="font-semibold text-slate-900">Explanation</p><p className="mt-2 text-slate-700">{whatIfResult.explanation}</p><p className="mt-3 text-sm font-semibold text-blue-700">{whatIfResult.humanReviewImplication}</p></div><Button onClick={saveScenarioToAudit}>Save scenario to audit log</Button></div> : <p className="rounded-2xl bg-amber-50 p-4 text-amber-800">{whatIfResult.fallback}</p>}</Card>}<Note>Scenarios grounded in NCDB collision pattern distributions. Current original result: {assessment.level}.</Note></Page>;
}

function CohortComparison({ selectedCase, assessment, selectedCohort, selectedCohortId, setSelectedCohortId }) {
  return <Page title="Cohort Comparison" subtitle="Compare the selected sample case with transparent historical NCDB-style cohort summaries."><Card className="mb-6"><SectionTitle title="Selected case for cohort comparison" subtitle={selectedCase.id} /><p className="text-sm text-slate-600">{selectedCase.description}</p><div className="mt-3 flex gap-2"><Badge tone={assessment.level}>{assessment.level}</Badge><Badge>{assessment.confidence}</Badge></div></Card><div className="grid grid-cols-3 gap-4">{cohortSummaries.map((cohort) => <button key={cohort.id} onClick={() => setSelectedCohortId(cohort.id)} className={`rounded-2xl border p-4 text-left shadow-card ${selectedCohortId === cohort.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}><h3 className="font-bold text-slate-900">{cohort.title}</h3><p className="mt-3 text-sm text-slate-500">Cohort size</p><p className="text-2xl font-bold text-slate-950">{cohort.size.toLocaleString()}</p><p className="mt-2 text-sm"><strong>Relative risk index:</strong> {cohort.riskIndex}</p><p className="mt-2 text-sm text-slate-600">{cohort.severityPattern}</p></button>)}</div><Card className="mt-6"><SectionTitle title="Comparison explanation" subtitle={selectedCohort.title} /><p className="text-lg text-slate-700">Similar cases with older vehicles and injury-related severity show a higher review priority compared with cases involving newer vehicles and property-damage-only outcomes.</p><div className="mt-5 grid grid-cols-2 gap-4"><InfoBox label="Why this cohort matters" value={selectedCohort.why} /><InfoBox label="Severity pattern" value={selectedCohort.severityPattern} /><InfoBox label="Variables matched" value={selectedCohort.matched.join(', ')} /><InfoBox label="Variables different" value={selectedCohort.different.join(', ')} /></div></Card></Page>;
}

function HumanReview({ selectedCase, assessment, humanDecision, setHumanDecision, humanRationale, setHumanRationale, reviewMessage, recordHumanDecision }) {
  const challenge = ['Override agent recommendation', 'Continue standard review', 'Mark as reviewed'].includes(humanDecision) && assessment.humanReviewRequired;
  return <Page title="Human Review" subtitle="Human-in-the-loop governance. The human reviewer remains the final decision maker."><div className="grid grid-cols-3 gap-6"><Card><SectionTitle title="Selected case summary" subtitle={selectedCase.id} /><p className="text-sm text-slate-600">{selectedCase.description}</p><InfoBox label="Agent recommendation" value={assessment.recommendedNextStep} /><InfoBox label="Confidence / uncertainty" value={assessment.confidence} /></Card><Card className="col-span-2"><SectionTitle title="Reviewer decision" subtitle="Document the human rationale before recording." /><label className="text-sm font-semibold text-slate-700">Human decision</label><select value={humanDecision} onChange={(e) => setHumanDecision(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3"><option>{reviewOptions[0]}</option>{reviewOptions.slice(1).map((option) => <option key={option}>{option}</option>)}</select>{challenge && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">You are challenging the agent’s recommendation. Please document which risk drivers are mitigated and why this decision is justified.</p><div className="mt-3 flex flex-wrap gap-2">{['Vehicle age', 'Injury severity', 'Collision timing', 'Collision configuration', 'Road / weather context', 'Missing data or uncertainty'].map((item) => <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{item}</span>)}</div></div>}<div className="mt-4"><label className="text-sm font-semibold text-slate-700">Human rationale</label><textarea value={humanRationale} onChange={(e) => setHumanRationale(e.target.value)} className="mt-2 h-32 w-full rounded-xl border border-slate-200 p-3" placeholder="Explain the documented reason for the human decision." />{!humanRationale.trim() && <p className="mt-2 text-sm text-amber-700">Rationale is required before recording.</p>}</div><Button onClick={recordHumanDecision} disabled={!humanRationale.trim()}>Record human decision</Button>{reviewMessage && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{reviewMessage}</p>}</Card></div><Card className="mt-6"><SectionTitle title="Key risk drivers requiring human attention" /><div className="grid grid-cols-3 gap-3">{assessment.topDrivers.map((driver) => <InfoBox key={driver.name} label={driver.name} value={driver.explanation} />)}</div></Card></Page>;
}

function AuditLog({ selectedCase, assessment, auditRecords, auditFilter, setAuditFilter }) {
  const filters = ['All', 'High risk', 'Human override', 'Scenario tested', 'Missing data', 'Senior review'];
  const filtered = auditFilter === 'All' ? auditRecords : auditRecords.filter((record) => record.tags?.includes(auditFilter) || (auditFilter === 'Human override' && record.humanDecision?.includes('Override')));
  return <Page title="Audit Log" subtitle="Traceability, explainability, and governance records for the frontend platform."><Card className="mb-6"><SectionTitle title="Selected case audit context" subtitle={selectedCase.id} /><div className="grid grid-cols-3 gap-3"><InfoBox label="Current selected case" value={selectedCase.name} /><InfoBox label="Current risk level" value={assessment.level} /><InfoBox label="Reviewer" value={selectedCase.reviewer} /></div></Card><div className="mb-4 flex flex-wrap gap-2">{filters.map((filter) => <Chip key={filter} active={auditFilter === filter} onClick={() => setAuditFilter(filter)}>{filter}</Chip>)}</div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500"><tr>{['Timestamp', 'Case ID', 'Uploaded data source', 'Agent risk level', 'Confidence', 'Scenario tested', 'Human decision', 'Human rationale', 'Reasoning summary', 'Reviewer'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((record, index) => <tr key={`${record.timestamp}-${index}`}><td className="px-4 py-4 text-slate-500">{record.timestamp}</td><td className="px-4 py-4 font-semibold">{record.caseId}</td><td className="px-4 py-4">{record.source}</td><td className="px-4 py-4"><Badge tone={record.riskLevel}>{record.riskLevel}</Badge></td><td className="px-4 py-4">{record.confidence}</td><td className="px-4 py-4">{record.scenario}</td><td className="px-4 py-4">{record.humanDecision}</td><td className="px-4 py-4">{record.humanRationale}</td><td className="px-4 py-4">{record.reasoningSummary}</td><td className="px-4 py-4">{record.reviewer}</td></tr>)}</tbody></table></div></Page>;
}

function makeAuditRecord({ selectedCase, assessment, scenario, humanDecision, humanRationale, tags }) {
  return { timestamp: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`, caseId: selectedCase.id, source: selectedCase.sourceFile, riskLevel: assessment.level, confidence: assessment.confidence, scenario, humanDecision, humanRationale, reasoningSummary: assessment.reasoningSummary, reviewer: selectedCase.reviewer, tags };
}
function tagDecision(decision, assessment) { return [assessment.level === 'High' ? 'High risk' : null, decision.includes('Override') ? 'Human override' : null, decision.includes('senior') ? 'Senior review' : null, assessment.drivers.some((d) => d.name === 'Missing data') ? 'Missing data' : null].filter(Boolean); }
function Page({ title, subtitle, children }) { return <section><div className="mb-6"><h1 className="text-3xl font-bold text-slate-950">{title}</h1>{subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}</div>{children}</section>; }
function Card({ children, className = '' }) { return <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-card ${className}`}>{children}</div>; }
function SectionTitle({ title, subtitle }) { return <div className="mb-4"><h2 className="text-lg font-bold text-slate-950">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>; }
function Button({ children, onClick, variant = 'primary', disabled = false }) { return <button disabled={disabled} onClick={onClick} className={`rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>{children}</button>; }
function Badge({ children, tone }) { const color = tone === 'High' ? 'bg-red-100 text-red-700' : tone === 'Elevated' ? 'bg-orange-100 text-orange-700' : tone === 'Moderate' ? 'bg-blue-100 text-blue-700' : tone === 'Needs Review' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${color}`}>{children}</span>; }
function Chip({ children, onClick, active }) { return <button onClick={onClick} className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'}`}>{children}</button>; }
function UploadBlock({ title, subtitle, onClick }) { return <Card><div className="flex items-center justify-between rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50 p-8"><div><h2 className="text-2xl font-bold text-slate-950">{title}</h2><p className="mt-2 text-slate-600">{subtitle}</p><p className="mt-3 text-sm font-semibold text-blue-700">Accepted formats: CSV, Excel, JSON</p></div><Button onClick={onClick}>Upload file</Button></div></Card>; }
function ProcessingSummary({ items, children }) { return <Card className="mt-6"><SectionTitle title="Processing summary" /><div className="grid grid-cols-3 gap-3">{items.map(([label, value]) => <InfoBox key={label} label={label} value={value} />)}</div>{children && <div className="mt-5">{children}</div>}</Card>; }
function InfoBox({ label, value }) { return <div className="mt-3 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>; }
function InfoRow({ label, value, helper }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>{helper && <p className="text-xs text-slate-400">Source field: {helper}</p>}</div>; }
function Note({ children }) { return <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-900">{children}</div>; }

export default App;
