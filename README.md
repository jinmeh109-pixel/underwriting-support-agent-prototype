# Risk Assessment & Underwriting Support Platform

This repository contains a frontend-only school project demonstration for an auto insurance / collision-risk underwriting support platform. It demonstrates how an AI-assisted underwriting support agent could help human underwriters analyze risk, explain important risk drivers, simulate what-if scenarios, and record human decisions for auditability.

## Project purpose

The app is designed as an explainability, simulation, and governance layer on top of an existing underwriting decisioning workflow. It is not intended to replace human underwriters. It does not make binding underwriting decisions, generate prices, or estimate loss amounts.

## Platform scope

This is **not a production system**. The current implementation intentionally avoids backend services, real APIs, real model training, real file parsing, and real AI/LLM integration. All interactions use frontend sample case workflows grounded in historical collision-pattern logic.

The platform demonstrates:

- File-based data intake for historical collision-risk data.
- File-based intake for sample new applicant, policy, or case profiles.
- Transparent risk assessment with readable risk drivers.
- Natural-language what-if simulation grounded in historical collision-pattern variables.
- Human-in-the-loop review and rationale capture.
- Audit logging for traceability and governance.

## Data assumptions

The current platform uses NCDB-style historical collision data. The sample fields look structurally similar to NCDB-style variables, but they are not official NCDB extracts and should not be treated as real data.

The current platform also uses sample new-case data. These new client or new case profiles are fake from beginning to end and are included only to demonstrate how insurer-provided applicant, policy, or portfolio data could enter a future platform.

In a future implementation:

- The NCDB-style historical collision dataset can be replaced with cleaned official NCDB extracts.
- The sample new-case profiles can be replaced with insurer-provided applicant, policy, or portfolio data.
- The rule-based reasoning layer can be connected to validated internal analytics, governance rules, or reviewed model outputs.

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

- `src/data/ncdbSampleData.js` keeps NCDB-style historical summaries, sample new cases, cohort summaries, field dictionary entries, and seed audit records separated from UI code.
- `src/lib/riskReasoning.js` contains risk assessment, agent-question responses, and what-if simulation logic.
- `src/App.jsx` contains the presentation-focused React frontend, navigation, page state, sample upload interactions, human review state, and audit log updates.
