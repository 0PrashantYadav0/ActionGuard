# ActionGuard documentation

Software-engineering documentation for **ActionGuard: an execution firewall for AI agents** (final-year B.Tech/B.E. project, AI Security / Cyber Security).

| # | Document | Contents |
|---|---|---|
| 00 | [Synopsis](00-synopsis.md) | Abstract, problem statement, objectives, scope, literature survey, requirements, expected outcomes |
| 01 | [Software Requirements Specification](01-SRS.md) | IEEE 830 / ISO 29148 SRS: FR-1 to FR-21, NFR-1 to NFR-11, interfaces, use cases, traceability matrix |
| 02 | [Architecture and design](02-architecture.md) | HLD + LLD: component, deployment, DFD, sequence, state, class and ER diagrams; algorithms; ADRs; scalability path |
| 03 | [API, SDK and policy specification](03-api-and-policy-spec.md) | Every REST endpoint, SSE format, SDK reference, policy language, risk-scoring examples, all 20 default rules |
| 04 | [Threat model](04-threat-model.md) | Assets, trust boundaries, attacker profiles, STRIDE table, OWASP LLM Top 10 (2025) mapping, known limitations, defects found and their resolution |
| 05 | [Test plan and report](05-test-plan.md) | Strategy, TC-01 to TC-31 with actual results, real `unittest` output, performance figures, defect log with fixes |
| 06 | [Project plan](06-project-plan.md) | SDLC model, WBS, Gantt chart, risk register, COCOMO estimate, tools, roles |
| 07 | [Market analysis](07-market-analysis.md) | Market context and positioning |
| 08 | [User manual](08-user-manual.md) | Installation, dashboard tour, demo scenarios, panel demo runbook, policy authoring, SDK integration, troubleshooting, viva FAQ |
| – | [Research notes](research-notes.md) | Sourced research fact sheet |

Screenshots: [`images/dashboard.png`](images/dashboard.png), [`images/dashboard-detail.png`](images/dashboard-detail.png).

**Suggested reading order for the panel:** Synopsis → SRS → Architecture → Threat model → Test report. For the live demo, use the User manual §5 runbook.

Diagrams are written in Mermaid and render directly on GitHub.
