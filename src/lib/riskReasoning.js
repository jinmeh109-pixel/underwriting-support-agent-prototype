const CURRENT_YEAR = 2026;
const missingFields = ['C_WTHR', 'C_RSUR', 'C_CONF', 'C_TRAF', 'P_SAFE'];

const includesAny = (value = '', terms) => terms.some((term) => value.toLowerCase().includes(term));

export function getVehicleAge(caseData) {
  return caseData?.V_YEAR ? CURRENT_YEAR - Number(caseData.V_YEAR) : null;
}

export function assessRisk(caseProfile) {
  const data = caseProfile.data;
  const vehicleAge = getVehicleAge(data);
  const drivers = [];
  let score = 0;
  let uncertainty = 0;

  if (vehicleAge === null) {
    uncertainty += 12;
    drivers.push(driver('Vehicle age', 'increases uncertainty', 'Vehicle year is missing, so the comparison set is less certain.', 'V_YEAR', 0));
  } else if (vehicleAge >= 15) {
    score += 22;
    drivers.push(driver('Vehicle age', 'increases risk', `Vehicle is approximately ${vehicleAge} years old, which increases review priority in this sample comparison.`, 'V_YEAR', 22));
  } else if (vehicleAge >= 8) {
    score += 12;
    drivers.push(driver('Vehicle age', 'increases risk', `Vehicle is approximately ${vehicleAge} years old, creating a moderate age-related risk signal.`, 'V_YEAR', 12));
  } else {
    score -= 8;
    drivers.push(driver('Vehicle age', 'lowers risk', `Vehicle is approximately ${vehicleAge} years old, which lowers the age-related risk signal.`, 'V_YEAR', -8));
  }

  if (includesAny(data.C_SEV || '', ['fatal', 'serious', 'severe'])) {
    score += 20;
    drivers.push(driver('Collision severity', 'increases risk', 'The collision severity context is injury-related or severe, requiring stronger reviewer attention.', 'C_SEV', 20));
  } else if (includesAny(data.C_SEV || '', ['property damage only', 'non-fatal'])) {
    score -= includesAny(data.C_SEV || '', ['property damage only']) ? 10 : 2;
    drivers.push(driver('Collision severity', includesAny(data.C_SEV || '', ['property damage only']) ? 'lowers risk' : 'neutral', 'The collision severity context does not indicate a fatal outcome in the sample profile.', 'C_SEV', -6));
  }

  if (includesAny(data.P_ISEV || '', ['major', 'serious', 'fatal'])) {
    score += 24;
    drivers.push(driver('Injury severity', 'increases risk', 'Major or serious injury severity is a major review driver for governance documentation.', 'P_ISEV', 24));
  } else if (includesAny(data.P_ISEV || '', ['minor'])) {
    score += 5;
    drivers.push(driver('Injury severity', 'increases risk', 'Minor injury creates a limited review signal compared with no-injury profiles.', 'P_ISEV', 5));
  } else if (includesAny(data.P_ISEV || '', ['no injury'])) {
    score -= 12;
    drivers.push(driver('Injury severity', 'lowers risk', 'No-injury context lowers the severity-driven review priority.', 'P_ISEV', -12));
  }

  if (Number(data.C_HOUR) >= 22 || Number(data.C_HOUR) <= 5) {
    score += 13;
    drivers.push(driver('Late-hour exposure', 'increases risk', 'Late-night timing is a moderate contextual signal in the sample historical comparison.', 'C_HOUR', 13));
  } else {
    score -= 5;
    drivers.push(driver('Time of day', 'lowers risk', 'Daytime timing reduces the late-hour exposure concern.', 'C_HOUR', -5));
  }

  if (includesAny(data.C_RSUR || '', ['icy', 'wet', 'snow'])) {
    score += 12;
    drivers.push(driver('Road surface', 'increases risk', 'Adverse road surface conditions increase risk and can reduce confidence.', 'C_RSUR', 12));
  } else if (includesAny(data.C_RSUR || '', ['dry'])) {
    score -= 7;
    drivers.push(driver('Road surface', 'lowers risk', 'Dry road condition lowers the contextual road-surface signal.', 'C_RSUR', -7));
  }

  if (includesAny(data.C_WTHR || '', ['snow', 'rain', 'fog', 'storm'])) {
    score += 10;
    drivers.push(driver('Weather condition', 'increases risk', 'Adverse weather increases uncertainty and the need for explanation.', 'C_WTHR', 10));
  } else if (includesAny(data.C_WTHR || '', ['clear', 'sunny'])) {
    score -= 7;
    drivers.push(driver('Weather condition', 'lowers risk', 'Clear weather reduces weather-related uncertainty.', 'C_WTHR', -7));
  }

  if (data.C_CONF) {
    score += includesAny(data.C_CONF, ['turning', 'rear-end']) ? 8 : 3;
    drivers.push(driver('Collision configuration', includesAny(data.C_CONF, ['turning', 'rear-end']) ? 'increases risk' : 'neutral', 'Collision configuration is used as a relevant comparison factor rather than a final decision.', 'C_CONF', includesAny(data.C_CONF, ['turning', 'rear-end']) ? 8 : 3));
  }

  missingFields.forEach((field) => {
    if (!data[field]) uncertainty += 8;
  });
  if (uncertainty > 0) {
    drivers.push(driver('Missing data', 'increases uncertainty', 'Missing or unconfirmed fields reduce confidence and may require documentation before review closes.', 'Completeness', uncertainty));
  }

  const level = riskLevel(score, uncertainty);
  const confidence = confidenceLabel(score, uncertainty);
  const humanReviewRequired = level === 'High' || level === 'Elevated' || level === 'Needs Review';
  const topDrivers = [...drivers].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, 4);

  return {
    score,
    uncertainty,
    level,
    confidence,
    humanReviewRequired,
    drivers,
    topDrivers,
    reasoningSummary: buildReasoningSummary(level, topDrivers, uncertainty),
    recommendedNextStep: humanReviewRequired
      ? 'Route to a human underwriter for documented review and rationale.'
      : 'Continue standard underwriting review with audit-ready explanation available.',
  };
}

function driver(name, effect, explanation, sourceField, weight) {
  return { name, effect, explanation, sourceField, weight };
}

function riskLevel(score, uncertainty) {
  if (uncertainty >= 24 && score < 42) return 'Needs Review';
  if (score >= 58) return 'High';
  if (score >= 34) return 'Elevated';
  if (score >= 12) return 'Moderate';
  return 'Low';
}

function confidenceLabel(score, uncertainty) {
  if (uncertainty >= 24) return 'Medium confidence / higher uncertainty';
  if (uncertainty >= 12) return 'Medium confidence';
  if (score >= 58) return 'Medium-high confidence';
  return 'High confidence';
}

function buildReasoningSummary(level, topDrivers, uncertainty) {
  const names = topDrivers.map((item) => item.name.toLowerCase()).join(', ');
  const uncertaintyText = uncertainty > 0 ? ' Missing or unconfirmed data increases uncertainty.' : '';
  return `The NCDB-grounded workflow classifies this case as ${level} based mainly on ${names}.${uncertaintyText}`;
}

export function answerAgentQuestion(question, assessment) {
  const q = question.toLowerCase();
  const top = assessment.topDrivers[0];
  if (q.includes('most')) return `${top.name} contributes the strongest directional signal because: ${top.explanation}`;
  if (q.includes('high risk')) return assessment.level === 'High' ? `This case is high risk because multiple risk drivers align: ${assessment.topDrivers.map((d) => d.name).join(', ')}.` : `This case is currently ${assessment.level}, not automatically high risk. The workspace highlights the drivers requiring review.`;
  if (q.includes('evidence')) return `Evidence comes from transparent NCDB-style fields and NCDB-grounded review logic, especially ${assessment.topDrivers.map((d) => `${d.name} (${d.sourceField})`).join(', ')}.`;
  if (q.includes('missing')) return assessment.drivers.find((d) => d.name === 'Missing data')?.explanation || 'No major missing-data driver is flagged for this selected case.';
  if (q.includes('reduce')) return 'Risk could be reduced in the simulation by testing newer vehicle assumptions, daytime timing, dry roads, clear weather, lower severity, or more complete applicant data.';
  if (q.includes('human')) return assessment.humanReviewRequired ? 'Yes. The platform recommends human review because the agent is only an explainability and governance layer; the human reviewer remains the final decision maker.' : 'Human review is still available, but the current case assessment does not require elevated review.';
  return `${assessment.reasoningSummary} Recommended next step: ${assessment.recommendedNextStep}`;
}

export function runWhatIf(caseProfile, question) {
  const text = question.trim().toLowerCase();
  if (!text) return null;
  const modified = structuredClone(caseProfile);
  let interpreted = '';
  let changed = '';
  let mapped = true;

  if (includesAny(text, ['newer vehicle', 'newer car', '2024', 'new vehicle'])) {
    modified.data.V_YEAR = 2024;
    interpreted = 'Newer vehicle assumption';
    changed = 'Vehicle year changed to 2024 for simulation.';
  } else if (includesAny(text, ['older vehicle'])) {
    modified.data.V_YEAR = 2006;
    interpreted = 'Older vehicle assumption';
    changed = 'Vehicle year changed to 2006 for simulation.';
  } else if (includesAny(text, ['daytime', 'morning', 'afternoon'])) {
    modified.data.C_HOUR = 14;
    interpreted = 'Daytime collision-hour assumption';
    changed = 'Collision hour changed to 14:00 for simulation.';
  } else if (includesAny(text, ['late night', 'night'])) {
    modified.data.C_HOUR = 23;
    interpreted = 'Late-night exposure assumption';
    changed = 'Collision hour changed to 23:00 for simulation.';
  } else if (includesAny(text, ['snow', 'rain', 'bad weather'])) {
    modified.data.C_WTHR = text.includes('rain') ? 'Rain' : 'Snow';
    interpreted = 'Adverse weather assumption';
    changed = 'Weather condition changed to adverse weather for simulation.';
  } else if (includesAny(text, ['clear weather', 'sunny', 'no snow', 'no rain'])) {
    modified.data.C_WTHR = 'Clear';
    interpreted = 'Clear-weather assumption';
    changed = 'Weather condition changed to clear for simulation.';
  } else if (includesAny(text, ['icy road', 'wet road'])) {
    modified.data.C_RSUR = text.includes('wet') ? 'Wet' : 'Icy';
    interpreted = 'Adverse road-surface assumption';
    changed = 'Road surface changed to adverse condition for simulation.';
  } else if (includesAny(text, ['dry road'])) {
    modified.data.C_RSUR = 'Dry';
    interpreted = 'Dry-road assumption';
    changed = 'Road surface changed to dry for simulation.';
  } else if (includesAny(text, ['no injury', 'property damage only', 'minor collision'])) {
    modified.data.P_ISEV = text.includes('minor') ? 'Minor injury reported' : 'No injury reported';
    modified.data.C_SEV = text.includes('property') ? 'Property damage only context' : 'Non-fatal collision context';
    interpreted = 'Lower-severity assumption';
    changed = 'Severity fields changed to a lower-severity context for simulation.';
  } else if (includesAny(text, ['severe', 'fatal', 'major injury'])) {
    modified.data.P_ISEV = text.includes('fatal') ? 'Fatal injury context' : 'Major injury reported';
    modified.data.C_SEV = text.includes('fatal') ? 'Fatal collision context' : 'Serious injury collision context';
    interpreted = 'Higher-severity assumption';
    changed = 'Severity fields changed to a higher-severity context for simulation.';
  } else if (includesAny(text, ['suv', 'truck', 'motorcycle', 'vehicle type'])) {
    modified.data.V_TYPE = text.includes('truck') ? 'Truck' : text.includes('motorcycle') ? 'Motorcycle' : 'SUV';
    interpreted = 'Vehicle-type assumption';
    changed = `Vehicle type changed to ${modified.data.V_TYPE} for directional explanation.`;
  } else if (includesAny(text, ['complete applicant data', 'more complete', 'complete data'])) {
    modified.data.C_TRAF ||= 'Traffic control confirmed';
    modified.data.P_SAFE ||= 'Safety device used';
    modified.data.C_WTHR ||= 'Clear';
    modified.data.C_CONF ||= 'Configuration confirmed';
    interpreted = 'More complete data assumption';
    changed = 'Missing or unconfirmed fields filled with conservative sample values.';
  } else {
    mapped = false;
  }

  if (!mapped) {
    return {
      mapped: false,
      fallback: 'The platform could not confidently map this What-if question to an NCDB-style risk variable. Please rephrase or choose a suggested scenario.',
    };
  }

  const original = assessRisk(caseProfile);
  const simulated = assessRisk(modified);
  const direction = simulated.score > original.score + 3 ? 'increases' : simulated.score < original.score - 3 ? 'decreases' : 'stays similar';
  const confidenceChange = simulated.uncertainty < original.uncertainty ? 'Confidence improves' : simulated.uncertainty > original.uncertainty ? 'Confidence decreases' : 'Confidence stays similar';

  return {
    mapped: true,
    question,
    interpreted,
    changed,
    originalRiskLevel: original.level,
    simulatedRiskLevel: simulated.level,
    riskDirection: direction,
    confidenceChange,
    explanation: `Under the ${interpreted.toLowerCase()}, risk ${direction} because the NCDB-grounded review logic re-evaluates vehicle, severity, time, road, weather, configuration, and missing-data signals.`,
    humanReviewImplication: simulated.humanReviewRequired
      ? 'The simulated profile would still require documented human review.'
      : 'The simulated profile could continue standard review, with the human reviewer retaining final decision authority.',
  };
}
