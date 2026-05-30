# Underwriting Support Agent Prototype

This repository contains a frontend-only school project prototype for an auto insurance / collision-risk underwriting support platform. The prototype demonstrates how an AI-assisted underwriting support agent could help human underwriters analyze risk, explain important risk drivers, simulate what-if scenarios, and record human decisions for auditability.

## Project purpose

The app is designed as an explainability, simulation, and governance layer on top of an existing underwriting decisioning workflow. It is not intended to replace human underwriters. It does not make binding underwriting decisions, generate prices, or estimate loss amounts.

## Prototype scope

This is **not a production system**. The current implementation intentionally avoids backend services, real APIs, real model training, real file parsing, and real AI/LLM integration. All interactions are deterministic frontend mock workflows.

The prototype demonstrates:

- File-based data intake for historical collision-risk data.
- File-based intake for mock new applicant, policy, or case profiles.
- Transparent risk assessment with readable risk drivers.
- Natural-language what-if simulation using deterministic keyword rules.
- Human-in-the-loop review and rationale capture.
- Audit logging for traceability and governance.

## Data assumptions

The current prototype uses mock NCDB-style historical data. The mock fields look structurally similar to NCDB-style variables, but they are not official NCDB extracts and should not be treated as real data.

The current prototype also uses mock new-case data. These new client or new case profiles are fake from beginning to end and are included only to demonstrate how insurer-provided applicant, policy, or portfolio data could enter a future platform.

In a future implementation:

- The mock NCDB-style dataset can be replaced with cleaned official NCDB extracts.
- The mock new-case profiles can be replaced with insurer-provided applicant, policy, or portfolio data.
- The deterministic reasoning layer can be connected to validated internal analytics, governance rules, or reviewed model outputs.

## Human review

Human review remains the final decision step. The agent presents explanations, comparisons, what-if results, and audit-ready rationale support. A human reviewer is responsible for final review decisions and documentation.

## Technology

- React 18
- Vite 5, compatible with Node 18
- Tailwind CSS 3
- Frontend only
- No backend
- No API keys
- No external AI integration

## Local setup

Install dependencies:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

## Important implementation files

- `src/data/ncdbMockData.js` keeps mock NCDB-style historical summaries, mock new cases, cohort summaries, field dictionary entries, and seed audit records separated from UI code.
- `src/lib/riskReasoning.js` contains deterministic risk assessment, agent-question responses, and what-if simulation logic.
- `src/App.jsx` contains the presentation-focused React prototype, navigation, page state, mock upload interactions, human review state, and audit log updates.
