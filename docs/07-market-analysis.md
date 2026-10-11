# Market Analysis

Market context, sizing, competitors and go-to-market for **ActionGuard: an execution firewall for AI agents**.

Every external figure here comes from [research-notes.md](research-notes.md), which lists the full URL and publication date for each one. Short source tags appear in brackets, for example *[Gartner, Jun 2025]*. Numbers marked **Estimate** are our own arithmetic on those sourced figures. They are labelled as estimates and are not forecasts from any analyst.

> Analyst forecasts use different market definitions. Compare them as ranges and never add them together.

---

## 1. Summary

- AI agents now run shell commands, query databases, send email and move money. The agent market is forecast to grow about 6× between 2025 and 2030, at a CAGR in the mid-40s *[MarketsandMarkets, Apr 2025; BCC Research, Jan 2026]*.
- Controls are lagging behind. 80% of organisations report agents taking unintended actions *[SailPoint, May 2025]*. Only 13% believe they have the right agent governance *[Gartner, Apr 2026]*. More than 40% of agentic AI projects are expected to be cancelled by the end of 2027, partly because of inadequate risk controls *[Gartner, Jun 2025]*.
- The incidents that made the news (Replit, Amazon Q, GitHub MCP, PocketOS) were each caused by a tool call that no policy or human checked before it ran. Most funded AI-security products filter content (prompts and outputs). They do not enforce at the action layer.
- **Positioning:** ActionGuard is an open-core, action-layer policy decision point. It combines deterministic tool-call policy with risk scoring, human approval, and a tamper-evident audit log. Among the products we surveyed, none combines all three *[research notes §5]*.
- **Estimate:** a 2030 TAM of about $4.8B to $7.9B for agent-supervision ("guardian agent") technology, and a realistic 5-year SOM of about $10M to $30M ARR for a focused open-core entrant.

---

## 2. Market sizing

### 2.1 Sourced market figures

| Market | Base | Forecast | CAGR | Source |
|---|---|---|---|---|
| AI agents | $7.84B (2025) | $52.62B (2030) | 46.3% | MarketsandMarkets, Apr 2025 |
| AI agents | – | $50.31B (2030) | 45.8% | Grand View Research PR, May 2025 |
| AI agents | $7.63B (2025) | $182.9B (2033) | 49.6% (2026–33) | Grand View Research, Jun 2026 |
| AI agents | $8.0B (2025) | $48.3B (2030) | 43.3% | BCC Research, Jan 2026 |
| AI TRiSM | $3.09B (2026) | $11.61B (2031) | 30.3% | MarketsandMarkets, Aug 2026 ("security & runtime control" is the largest segment) |
| AI TRiSM (conservative) | $1.69B (2022) | $7.40B (2032) | 16.2% | Allied Market Research |
| Guardian agents | – | ≥ 10–15% of agentic AI markets by 2030 | – | Gartner, Jun 2025 |
| Agentic AI share of enterprise app software revenue | 2% (2025) | ~30%, > $450B (2035, best case) | – | Gartner, Aug 2025 |

### 2.2 TAM, SAM, SOM

ActionGuard's buyer is an organisation that runs AI agents with tool access and needs those actions controlled, approved and audited. We build up from the sourced figures.

**TAM: agent-supervision ("guardian agent") technology, 2030. Estimate.**

Gartner expects guardian agents to make up at least 10–15% of agentic AI markets by 2030 *[Gartner, Jun 2025]*. Applying that share to the 2030 AI-agents forecasts:

| 2030 agents forecast | × 10% | × 15% |
|---|---|---|
| $48.3B *[BCC Research]* | $4.8B | $7.2B |
| $52.62B *[MarketsandMarkets]* | $5.3B | $7.9B |

→ **TAM ≈ $4.8B to $7.9B in 2030 (estimate).** As a cross-check, the overlapping AI TRiSM market is $3.09B in 2026, growing to $11.61B by 2031 *[MarketsandMarkets, Aug 2026]*. That puts the estimate in the same order of magnitude.

**SAM: runtime action enforcement for organisations already scaling agents. Estimate.**

Not every guardian-agent dollar goes to action-layer enforcement, and not every organisation runs agents in production. We narrow the TAM with one sourced adoption figure: 40% of large organisations (revenue over $1B) are scaling AI agents *[McKinsey State of AI, Aug 2026]*. Applying it to the TAM gives:

→ **SAM ≈ $1.9B to $3.2B in 2030 (estimate; assumes spend tracks adoption among large organisations).**

**SOM: what a new open-core entrant can realistically capture within 5 years. Estimate.**

The market is consolidating fast (see §5.2), and large platforms bundle AI security. We assume a focused entrant can win 0.5–1% of the SAM through open-source adoption that converts to paid seats.

→ **SOM ≈ $10M to $30M ARR (estimate).** This assumption is the one most worth testing. Noma Security's reported ARR growth of more than 1,300% year over year *[SecurityWeek, Jul 2025]* shows that fast growth is possible in this category, but it says nothing about how much of the market any one company will capture.

---

## 3. Adoption trends

| Signal | Figure | Source |
|---|---|---|
| Enterprise apps with task-specific agents | < 5% (2025) → 40% (end of 2026) | Gartner, Aug 2025 |
| Enterprise software apps including agentic AI | 33% by 2028 | Gartner, Jun 2025 |
| Day-to-day work decisions made autonomously | 0% (2024) → ≥ 15% (2028) | Gartner, Jun 2025 |
| Agents per average Fortune 500 company | < 15 (2025) → > 150,000 (2028) | Gartner, Apr 2026 |
| Organisations scaling an agentic AI system | 23% (+39% experimenting) | McKinsey, Nov 2025 |
| Large organisations scaling AI agents | 27% → 40% year over year | McKinsey, Aug 2026 |
| Organisations planning to deploy agents | 83%, but only 31% fully equipped to secure them | Cisco, Oct 2025 |
| Organisations that will expand agent use | 98%, while 96% see agents as a growing risk | SailPoint, May 2025 |
| Security leaders concerned about workforce use of agents | 92% | Darktrace via CSA, May 2026 |

**What this means for ActionGuard:** adoption is running ahead of control. The number of agents per enterprise is heading toward six figures, so enforcement has to be automated (policy and risk score). People should spend their time on the small set of high-impact actions (the review queue), not on every call.

---

## 4. Incident and risk drivers

### 4.1 Risk statistics

- 80% of organisations say their agents have taken **unintended actions**. These include accessing unauthorised systems (39%), sharing sensitive data (33%) and downloading sensitive content (32%). 23% say agents were tricked into revealing credentials. Only 44% have policies to secure agents. *[SailPoint, May 2025]*
- By 2028, **25% of enterprise breaches** will be traced back to AI agent abuse *[Gartner, Oct 2024, via reproduction]*.
- By 2028, 25% of enterprise GenAI apps will have at least 5 minor security incidents a year (9% in 2025). Gartner attributes part of this to MCP being designed "for interoperability… not security enforcement by default" *[Gartner, Apr 2026]*.
- By 2027, **40% of enterprises will demote or decommission autonomous agents** because of governance gaps they find only after production incidents. Gartner recommends "enforced guardrails, rapid rollback mechanisms, circuit breakers." *[Gartner, May 2026]*
- New red-team attacks raised agent-hijacking success from 11% (strongest baseline) to **81%** *[NIST CAISI, Jan 2025]*.
- 14.2% of in-the-wild indirect prompt-injection payloads aimed at **data destruction** *[Unit 42, Mar 2026]*.

### 4.2 Incidents that show the need

| Date | Incident | Fatal action | Source |
|---|---|---|---|
| May 2025 | GitHub MCP "toxic agent flow" | Private-repo data written into a public PR | Invariant Labs, May 2025 |
| Jun 2025 | EchoLeak, M365 Copilot (CVE-2025-32711, CVSS 9.3) | Zero-click exfiltration of internal data | BleepingComputer, Jun 2025 |
| Jul 2025 | Replit agent deletes production DB during a code freeze | Database deletion | TechTarget, Jul 2025 |
| Jul 2025 | Amazon Q extension v1.84.0 (CVE-2025-8217) | Injected "wipe machine + delete cloud resources" prompt | AWS bulletin, Jul 2025 |
| Mar 2026 | McKinsey "Lilli" breached by an offensive agent | Read-write production DB access in about 2 hours | The Register, Mar 2026 |
| Apr 2026 | Vercel breach via a third-party AI tool | Lateral movement into internal systems | Vercel bulletin, Apr 2026 |
| Apr 2026 | PocketOS: Cursor agent wipes production DB in about 9 s | Volume deletion with an over-permissioned token | ABC7, Apr 2026 |

The Replit database was a demo/test app and the PocketOS data was restored, so present both as near misses that show the risk. In Replit, Amazon Q, GitHub MCP and PocketOS, the damage came from a **tool call that no policy or human checked**. That is the layer ActionGuard intercepts.

---

## 5. Competitive landscape

### 5.1 Competitor matrix

Layer key: **Content** = filters prompts and outputs. **Action** = enforces on tool calls and their side effects. **Posture** = discovery, inventory, red-teaming. "—" means the capability is not core according to the sources in research notes §5.

| Product | Layer | Tool-call policy | Human approval | Tamper-evident audit | Status / deal |
|---|---|---|---|---|---|
| Lakera Guard | Content | — | — | — | Acquired by Check Point (closed Oct 2025; price not disclosed) |
| NVIDIA NeMo Guardrails | Mostly content | Partial (execution rails) | — | — | Open source |
| Guardrails AI | Content | — | — | — | Open source |
| Meta LlamaFirewall | Content + agent reasoning | — | — (no human approvals) | — | Open source |
| Protect AI (incl. LLM Guard) | Posture + content | — | — | — | Acquired by Palo Alto Networks, $634.5M (Jul 2025) |
| Prompt Security | Content / usage | — | — | — | Acquired by SentinelOne, $159.3M (Sep 2025) |
| CalypsoAI | Content | — | — | — | F5 acquisition announced, $180M (Sep 2025) |
| Pangea | Content | — | — | — | Acquired by CrowdStrike, ~$260M reported (Sep 2025) |
| Aim Security | Content / usage | — | — | — | Acquired by Cato Networks (Sep 2025) |
| Zenity | Posture + partial action | Partial (inline runtime) | — | — | $125M Series C (Aug 2026) |
| Pillar Security | Posture + content | — | — | — | $9M seed (Apr 2025) |
| Cloudflare Firewall for AI | Content (network edge) | — | — | — | Cloudflare product |
| Astrix Security | Identity | — | — | — | Acquired by Cisco (Jun 2026) |
| Invariant Labs Guardrails / Gateway | **Action** (closest technical peer) | Yes | — | — | Acquired by Snyk (Jun 2025) |
| HumanLayer | Action (approvals only) | — | Yes | — | Open-source SDK |
| **ActionGuard** | **Action** | **Yes** | **Yes** | **Yes (SHA-256 chain)** | Final-year project, open core |

### 5.2 What the deal flow tells us

- **Consolidation:** in September 2025 alone, SentinelOne, Cato, F5, CrowdStrike and Check Point each bought an AI-security start-up *[research notes §6]*.
- **Disclosed values:** Palo Alto–Protect AI $634.5M, F5–CalypsoAI $180M, SentinelOne–Prompt Security $159.3M.
- **Funding:** Zenity $125M Series C (Aug 2026), Noma $100M Series B (Jul 2025), WitnessAI $58M (Jan 2026), Geordie AI $30M Series A (May 2026), Pillar $9M seed (Apr 2025).
- **Takeaway:** large security vendors are buying AI-security capability rather than building it. Most of what they bought works at the content layer. The action layer is less crowded, and both OWASP (the Agent Control Standard, the LLM03 Excessive Agency mitigations) and Gartner ("enforced guardrails… circuit breakers") point at it.

### 5.3 Differentiation

1. **Deterministic and explainable.** Each verdict lists the rules that fired and their risk. There is no opaque classifier to argue with.
2. **The human is part of the protocol.** The review queue has a timeout and fails closed, and agents can never approve themselves because they don't hold the admin token.
3. **Evidence, not just logs.** A hash-chained ledger detects any edit to history.
4. **No dependencies.** Python standard library only. That keeps the supply chain small, makes the code easy to audit, and lets it run anywhere.

---

## 6. SWOT

| **Strengths** | **Weaknesses** |
|---|---|
| Action-layer enforcement that matches where the incidents actually happen | Regex policies can be evaded by obfuscation |
| Policy, human approval and tamper-evident audit in one small tool | The SDK is cooperative: tools must sit behind the gateway to be fully protected |
| Deterministic, explainable verdicts in about 22 µs (median, measured) | Single-node prototype: the rate limiter and lockdown state are per process and not persisted |
| Zero runtime dependencies; 16/16 tests passing | No SSO/RBAC or multi-tenancy yet; no brand or customers |

| **Opportunities** | **Threats** |
|---|---|
| OWASP Agent Control Standard v0.1 (Sep 2026) describes runtime policy enforcement points | Platform vendors (Microsoft, Palo Alto, CrowdStrike) bundling agent security |
| EU AI Act Art. 14 human-oversight obligations (Annex III from 2 Dec 2027) | Agent frameworks adding native approval hooks |
| MCP growth, which Gartner says lacks "security enforcement by default" | Fast consolidation: well-funded rivals (Zenity, Noma) moving toward runtime action control |
| Agent counts heading toward 150,000 per Fortune 500 company by 2028, which demands automated control | The "agent washing" Gartner describes (only about 130 genuine vendors) makes buyers sceptical |

---

## 7. Business model

**Open core.** The enforcement engine is free so that developers adopt it and security teams can audit it. The paid tiers sell governance at scale.

| Tier | Price model | What's included |
|---|---|---|
| **Community** (OSS) | Free | Gateway, policy engine, SDK, live dashboard, default policy packs; self-hosted, single node |
| **Cloud console** | Subscription (per protected agent or reviewer seat) | Hosted multi-tenant console, SSO + RBAC, Slack/Teams approvals, long-term audit retention, anchored audit head |
| **Enterprise** | Annual contract | Compliance reporting (EU AI Act Art. 14, ISO/IEC 42001 evidence packs), managed and curated policy packs, on-prem/VPC, SIEM export (OpenTelemetry), support SLA |

We have not set price points. Pricing would be validated in design-partner interviews and is out of scope for this project.

**Target users**

| Segment | Why they buy |
|---|---|
| Fintech and payments | Agents that initiate transfers or touch card data need approval thresholds and audit trails |
| Developer-tool and DevOps platforms | Coding agents with shell, repo and cloud credentials (the Replit, Amazon Q and PocketOS pattern) |
| Enterprises running internal agents | Copilot-style agents acting on company data and email (the EchoLeak and GitHub MCP pattern) |
| Regulated industries (BFSI, healthcare, public sector) | Must show human oversight and keep evidence (EU AI Act Art. 14, ISO 42001) |

**Buyer and user:** the CISO or head of AI platform buys it. Platform and DevOps engineers integrate it. Security analysts and team leads review the held actions.

---

## 8. Go-to-market

1. **Developer-led adoption (months 0–6).** Publish the open-source gateway with a one-line `@guard.protect()` integration. Ship plugins for LangChain/LangGraph, CrewAI, the OpenAI Agents SDK and the Claude Agent SDK. Provide ready-made policy packs (DevOps, finance, data) and a reproducible attack demo like the one in this project.
2. **MCP proxy mode (months 3–9).** A transparent firewall in front of any MCP server removes the need for an SDK. It targets the MCP risk Gartner highlights *[Gartner, Apr 2026]*.
3. **Design partners (months 6–12).** Three to five fintech or devtools companies that already run agents in production. Success metric: high-impact actions routed through review, with no increase in incident rate.
4. **Compliance-led enterprise sales (year 2+).** Sell evidence for EU AI Act Article 14 oversight and ISO/IEC 42001 audits, timed to the Annex III deadline of 2 Dec 2027.
5. **Ecosystem.** SIEM export via OpenTelemetry and marketplace listings. Align with the OWASP Agent Control Standard so that buyers can compare against a standard.

---

## 9. Regulatory and standards tailwinds

| Framework | Requirement | ActionGuard control |
|---|---|---|
| **OWASP Top 10 for LLM Apps 2025 / 2026** | LLM06 Excessive Agency (ranked LLM03 in 2026): "utilise human-in-the-loop control… for high-impact actions" and "implement authorization in downstream systems rather than relying on an LLM" | Gateway policy (authorization outside the LLM) and the review queue |
| **OWASP Top 10 for Agentic Applications 2026** (Dec 2025) | ASI02 Tool Misuse, ASI03 Identity & Privilege Abuse, ASI05 Unexpected Code Execution, ASI09 Human-Agent Trust Exploitation | Tool-call rules, admin-only approvals, destructive-shell and RCE denies, explained verdicts |
| **OWASP Agent Control Standard v0.1** (Sep 2026) | Runtime enforcement with policy enforcement points | The SDK (PEP) and gateway (PDP) architecture |
| **NIST AI RMF 1.0** (Jan 2023) | Govern, Map, Measure, Manage | Versioned policy and admin roles; tools named in rules; risk scores and stats; review and kill switch |
| **NIST AI Agent Standards Initiative** (Feb 2026) | Agent security, identity and authorization | Per-agent identity in every request; authorization at the gateway |
| **EU AI Act Art. 14** | Humans must be able to oversee, override and stop high-risk systems. Annex III obligations apply from **2 Dec 2027** and Annex I from **2 Aug 2028**, after the Digital Omnibus (published in the OJ on 24 Jul 2026) | Review queue (override), kill switch ("stop" button), reasons shown for every verdict |
| **ISO/IEC 42001:2023** | Certifiable AI management system with documented controls and evidence | Policy file as a documented control; hash-chained ledger as evidence |

---

## 10. Risks to this analysis

- The TAM, SAM and SOM figures are estimates built on analyst forecasts that use different definitions, and the SAM and SOM percentages are our assumptions.
- Gartner figures were checked through newsroom excerpts and reputable reprints, because Gartner's pages block automated fetching *[research notes, "excluded or uncertain items"]*.
- Deal values for Lakera, Invariant, Aim and Astrix were not disclosed. The Pangea figure is a reported value.
