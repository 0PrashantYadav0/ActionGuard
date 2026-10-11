# User Manual

ActionGuard 1.0.0: installation, operation, the panel demo runbook, integration, troubleshooting and FAQ.

---

## 1. Installation

**Requirements:** Python 3.10 or newer. Nothing else: no `pip install`, no internet.

```bash
python3 --version          # must print 3.10 or higher
cd ActionGuard             # the project root (contains actionguard/, policies/, demo/)
python3 -m unittest discover -s tests -v   # optional sanity check: 16 tests, "OK"
```

Run every command from the **project root**, so that `python3 -m actionguard` can find the package.

Optional, only for the real-LLM demo:
```bash
pip install anthropic
export ANTHROPIC_API_KEY=...
```

## 2. Running the gateway

```bash
python3 -m actionguard
```

Expected output:
```text
ActionGuard gateway  ->  http://127.0.0.1:8700/?token=demo-admin-token
policy: acme-default-v1 (20 rules)   db: /…/ActionGuard/actionguard.db
WARNING: default admin token in use — set ACTIONGUARD_ADMIN_TOKEN outside demos
```

Open the printed URL (including `?token=…`) in a browser. Stop the gateway with `Ctrl+C`.

| Option | Default | Purpose |
|---|---|---|
| `--host` | `127.0.0.1` | Bind address |
| `--port` | `8700` | Port. `demo/run_demo.py` expects 8700 |
| `--policy` | `policies/default.json` | Policy file, also used by hot reload |
| `--db` | `actionguard.db` (project root) | SQLite database |
| env `ACTIONGUARD_ADMIN_TOKEN` | `demo-admin-token` | Admin bearer token |

Using your own token (set it in **both** terminals, because the demo script also reads it):
```bash
export ACTIONGUARD_ADMIN_TOKEN='a-long-random-string'
python3 -m actionguard
```

**Clean slate:** stop the gateway, run `rm actionguard.db`, start it again. A restart also clears an active lockdown.

## 3. Dashboard tour

![ActionGuard dashboard](images/dashboard.png)

| Area | What it shows |
|---|---|
| **Header** | Policy name chip (`policy: acme-default-v1`), connection indicator (`live` / `reconnecting`), and the **Kill switch** button (it becomes **Release lockdown** while engaged, and a red banner "LOCKDOWN ACTIVE" appears) |
| **Stat tiles** | *Actions inspected* (total) · *Allowed / approved* (allowed + approved) · *Awaiting human* (pending) · *Blocked* (denied + rejected + expired) · *Agents seen* (distinct agent names) |
| **Live action feed** | One row per action: `#`, time, agent, tool, arguments, a risk bar (green < 50, amber 50–89, red ≥ 90) and a status pill. New rows arrive through SSE without a refresh. On page load the 200 most recent actions are shown |
| **Awaiting approval** | A card per pending action: `#id · agent → tool`, arguments, the descriptions of the rules that caused the hold, and **Approve** / **Reject** buttons. Decisions from the dashboard are recorded with `decided_by = "dashboard"` |
| **Audit ledger** | **Verify audit chain** button. It shows "✔ Chain intact — N entries" with the head hash, or "✖ TAMPERING DETECTED at entry #N" |
| **Active policy** | All rules with their effect and description |

Click (or press Enter on) any feed row to expand it. The expanded view shows the engine verdict, every matched rule with its effect, risk contribution and description, who decided it, and the full argument JSON:

![Expanded action showing the reasons for a deny](images/dashboard-detail.png)

## 4. Running the demo scenarios

Terminal 1: `python3 -m actionguard`. Browser: the printed URL. Terminal 2:

```bash
python3 demo/run_demo.py               # all 6, press Enter between scenarios; you answer approvals in the dashboard
python3 demo/run_demo.py --auto        # unattended; a simulated reviewer approves payments and rejects everything else
python3 demo/run_demo.py --scenario 4  # one scenario only (1-6)
```

| # | Scenario | Agent | What happens | Your action (interactive mode) |
|---|---|---|---|---|
| 1 | Routine engineering work | `devops-bot` | `read_file README.md`, `git status`, `pytest -q`, a `SELECT`: all **executed** | none |
| 2 | Prompt injection → credential theft | `research-bot` | Fetches a setup page with a hidden HTML-comment instruction. `~/.ssh/id_rsa` **denied** (`deny-credential-access`); `.env` **held** (risk 60); POST of an AWS key to `attacker.example` **denied** (`deny-secret-exfiltration`) | **Reject** the `.env` read |
| 3 | Destructive commands | `devops-bot` | `rm -rf / --no-preserve-root`, `DROP TABLE customers;`, `curl … \| sudo bash`: all **denied**, risk 100 | none |
| 4 | Human-in-the-loop | `finance-bot` | Payment of 250 executes; payment of 25000 **held** (risk 40); email to `cfo@acme.com` executes; email to `partner@unknown-corp.io` **held** (risk 30) | **Approve** the 25000 payment, **Reject** the external email |
| 5 | Runaway loop | `loop-bot` | 25 rapid `read_file` calls: 20 green, then 5 red (`rate-limit`) | none |
| 6 | Kill switch | `devops-bot` | The script engages lockdown as `security-team`; `git status` is **denied** (`lockdown`); lockdown released; `git status` executes | none (or use the button, see §5) |

Held actions wait up to **120 s**. If you do not decide in time, they become `expired` and the agent is blocked.

**Tamper demo:** after running the scenarios:
```bash
python3 demo/tamper.py        # rewrites the first audit entry containing "deny" to "allow"
```
Then click **Verify audit chain**. On a fresh database this reports `TAMPERING DETECTED at entry #6` (the `~/.ssh/id_rsa` denial). The tamper is permanent for that database. Delete `actionguard.db` to start over.

**Optional real LLM:** `python3 demo/claude_agent.py` runs Claude (`claude-opus-5-5`) with the same simulated tools and a task that leads into the poisoned page. You can also pass your own task: `python3 demo/claude_agent.py "Pay the Q4 cloud invoice of 25000 to ACME-VENDOR-7731"`. Its output is not deterministic, so use it only after the scripted demo.

---

## 5. Panel demo runbook (about 8 minutes)

### 5.1 Preparation (T−30 min)

- [ ] `lsof -ti tcp:8700 | xargs kill` (free the port), then `rm -f actionguard.db` (fresh DB, so the tamper hits entry #6)
- [ ] Terminal 1: `python3 -m actionguard`. Browser: open `http://127.0.0.1:8700/?token=demo-admin-token`. Indicator shows **live**
- [ ] Terminal 2: font size ≥ 18 pt, `cd` to the project root, `clear`
- [ ] Arrange windows: browser on the left (≈ 60%), terminal 2 on the right
- [ ] Have `docs/images/dashboard.png` and `dashboard-detail.png` open in a background tab
- [ ] Have a **pre-recorded screen capture** of `python3 demo/run_demo.py --auto` plus the tamper step ready
- [ ] Do a full dry run, then stop the gateway, `rm actionguard.db`, start it again, and reload the browser

### 5.2 Script

| Time | Do | Say (key points) |
|---|---|---|
| **0:00–0:45** | Show the empty dashboard | "AI agents now run shell commands, SQL, email and payments. Prompt-level guardrails filter text. A prompt-injected agent still calls tools. ActionGuard is a firewall at the point of execution: every tool call is checked against a policy before it runs, and the result is allow, deny, or hold for a human." |
| **0:45–1:30** | Point at the *Active policy* panel, then the header | "The policy is declarative JSON: 20 rules with allow, review, deny and a fourth effect, flag, that only adds risk. The strictest matching rule wins, and risk adds up: 50 or more escalates to a human, 90 or more is denied. Unknown actions default to review. The SDK is the enforcement point and the gateway decides, the same PEP/PDP split as XACML." |
| **1:30–2:00** | Terminal: `python3 demo/run_demo.py` → **Scenario 1** | "Routine work must not be slowed down: reads, `git status`, tests and SELECTs pass. The decision takes about 0.13 ms in the engine and about 3 ms end to end." |
| **2:00–3:15** | Enter → **Scenario 2**. When `.env` is held, click **Reject**. Then click the `attacker.example` row to expand it | "The agent reads a web page with an instruction hidden in an HTML comment, and it obeys. ActionGuard doesn't try to detect the injection. It stops the consequences: the SSH key read is denied, the `.env` read is allowed by one rule but flagged with risk 60, so a human sees it. I reject. The exfiltration of an AWS key to an unknown domain is denied. Here is exactly why: rule id, effect, risk." |
| **3:15–3:45** | Enter → **Scenario 3** | "`rm -rf /`, `DROP TABLE`, `curl` piped into `sudo bash`. All three are denied with risk 100, and the function body never runs." |
| **3:45–4:45** | Enter → **Scenario 4**. **Approve** the 25000 payment, **Reject** the external email | "Not everything is black and white. A 250 payment goes through. 25000 waits for a person, and the agent is blocked mid-call until I decide. I approve it and the agent continues. An email of the customer list to an outside domain: I reject it. If nobody answers within 120 seconds, it expires and fails closed." |
| **4:45–5:15** | Enter → **Scenario 5** | "A buggy agent loops. After 20 calls in 10 seconds the rate limit cuts it off. This is OWASP LLM10, Unbounded Consumption." |
| **5:15–6:00** | Enter → **Scenario 6**. Watch the red banner appear and disappear. Optionally click **Kill switch** yourself, run `python3 demo/run_demo.py --scenario 1` to show even `git status` denied, then click **Release lockdown** | "Security sees something odd and freezes every agent with one switch. Only the admin token can do this, and the agent never has that token, so it can't approve itself or lift the lockdown." |
| **6:00–7:15** | **Tamper moment.** Click **Verify audit chain** → "Chain intact — N entries". Terminal: `python3 demo/tamper.py`. Click **Verify audit chain** again → "TAMPERING DETECTED at entry #6" | "Every decision is in an append-only log where each record contains the SHA-256 of the previous one. Now I play a malicious insider: I open the database directly and change the SSH-key denial to allow. Verify again: the chain breaks at exactly that entry. The edit can't be hidden without recomputing every later hash, and anchoring the head hash externally closes that gap too." |
| **7:15–8:00** | Back to the stats tiles | "16 automated tests pass, there are no dependencies beyond Python, and the latency is sub-millisecond. Limitations: regexes can be evaded by obfuscation, which is why unknown commands go to review, and the SDK is cooperative, so the next step is putting tools behind the gateway. Thank you, happy to take questions." |

### 5.3 Fallback plan

| Problem | Immediate fallback |
|---|---|
| Port 8700 busy at start | `lsof -ti tcp:8700 \| xargs kill`, then restart the gateway |
| Dashboard shows *reconnecting* | Check terminal 1. Restart the gateway and reload the browser tab (keep `?token=`) |
| You talked too long and a held action became `expired` | Say "this is fail-closed in action: nobody approved, so it's blocked". Rerun with `--scenario 2` or `--scenario 4` |
| Approve/Reject shows an alert about the token | The URL lost `?token=demo-admin-token`. Reopen the printed URL |
| Interactive run goes wrong midway | `Ctrl+C`, then `python3 demo/run_demo.py --auto` (no clicks needed; the auto-reviewer approves payments and rejects the rest) |
| Tamper reports a different entry number | The DB was not fresh. Say "the first denied entry". The point is that the break is detected |
| Laptop or projector failure | Play the pre-recorded `--auto` run, then show `docs/images/dashboard.png` and `dashboard-detail.png` |
| Panel asks for a real LLM | `python3 demo/claude_agent.py` (needs `anthropic` and an API key; non-deterministic, so present it as an encore) |

---

## 6. Writing your own policy rule

1. Open `policies/default.json` (or your own file passed with `--policy`).
2. Add a rule to `rules`. Fields: `id`, `tool` (glob or list), `effect` (`allow`|`review`|`deny`|`flag`), optional `description`, `risk`, `when` (`{field: regex}`, `"*"` = all arguments as JSON) and `above` (`{field: number}`). Full semantics: [API & policy spec §5](03-api-and-policy-spec.md#5-policy-language-specification).

   ```json
   {
     "id": "deny-prod-db-writes",
     "description": "No agent may modify the production database",
     "tool": "db_query",
     "when": { "sql": "^\\s*(insert|update|delete|alter|drop)\\b", "database": "^prod$" },
     "effect": "deny",
     "risk": 100
   }
   ```
   Remember that JSON needs double backslashes (`\\s`, `\\b`). Regexes are case-insensitive and unanchored unless you use `^`/`$`.
3. Reload without restarting:
   ```bash
   curl -s -X POST http://127.0.0.1:8700/v1/policy/reload -H 'Authorization: Bearer demo-admin-token'
   ```
   `200 {"policy": "..."}` means it is active. `400 "policy rejected, old policy kept: ..."` means fix the error; the old policy stays in force.
4. Test it:
   ```bash
   curl -s -X POST http://127.0.0.1:8700/v1/actions -H 'Content-Type: application/json' \
     -d '{"agent":"tester","tool":"db_query","args":{"sql":"UPDATE t SET x=1","database":"prod"}}'
   ```
   Check `decision`, `risk` and `reasons` in the response.

**Guidelines:** write narrow, anchored `allow` rules, and use `deny` for well-known dangerous patterns. Use `flag` for weak signals that should add up. Keep `default_decision: review` so that anything you did not anticipate goes to a human. Remember that `.` in a regex matches any character (escape it as `\\.`), that a negated class such as `[^;]` also matches a newline (exclude `\n\r` explicitly), and that `$` also matches before a trailing newline, so anchor with `\Z` instead. Our own `allow-safe-shell` rule had exactly this bug before it was fixed (see [Threat model D-2](04-threat-model.md#8-defects-found-during-threat-modelling-and-their-resolution)).

## 7. Integrating the SDK into an agent

The package is not published to PyPI. Either copy the `actionguard/` directory into your project or add the project root to `PYTHONPATH`.

```python
import subprocess
from actionguard import Guard, Blocked

guard = Guard(
    agent="devops-bot",                       # ^[\w.\-:]{1,64}$
    url="http://127.0.0.1:8700",
    on_pending=lambda a: print(f"waiting for approval of #{a['id']} (risk {a['risk']})"),
)

@guard.protect()                              # tool name = "run_shell"
def run_shell(command: str) -> str:
    return subprocess.run(command, shell=True, capture_output=True, text=True).stdout

def call_tool(name, args):
    """Called by your agent loop for each tool_use block."""
    try:
        return {"ok": True, "output": TOOLS[name](**args)}
    except Blocked as e:
        # Return the reason to the model so it can explain or choose another approach.
        return {"ok": False, "error": str(e)}
```

Key points:
- Wrap **every** side-effecting tool. Unwrapped tools are not protected.
- Arguments must be JSON-serialisable. Otherwise the call raises `Blocked` (`invalid-args`) and the tool does not run.
- A held action blocks the calling thread until a reviewer decides or the 120 s timeout passes.
- If the gateway is down, every protected call raises `Blocked` (`gateway-unreachable`). If the gateway answers with an HTTP error, the call raises `Blocked` (`gateway-error`, with the HTTP code and message). This is intended: the SDK fails closed.
- Never give the agent process `ACTIONGUARD_ADMIN_TOKEN`.
- Non-Python agents can call the HTTP API directly: `POST /v1/actions`, then poll `GET /v1/actions/{id}` while `status` is `pending`, and execute only on `allowed` or `approved`.

`demo/claude_agent.py` shows a full integration with the Anthropic tool runner: a `Blocked` exception is returned to Claude as an error tool result.

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `OSError: [Errno 48] Address already in use` (macOS) / `[Errno 98]` (Linux) | Another gateway is running | `lsof -ti tcp:8700 \| xargs kill` |
| `Gateway not reachable at http://127.0.0.1:8700. Start it first` | Gateway not running, or running on another port | Start `python3 -m actionguard` on port 8700 |
| `No module named actionguard` | Not in the project root | `cd` to the project root, or set `PYTHONPATH` |
| `401 {"error": "admin token required"}` on approve/reject/lockdown, or a browser alert "Admin token missing or wrong" | Dashboard opened without `?token=`, or a different token set in the environment | Open `http://127.0.0.1:8700/?token=<token>`; export the same `ACTIONGUARD_ADMIN_TOKEN` in every terminal |
| `409 {"error": "not pending"}` | Action already decided or expired (expiry is checked before every approve or reject, so an overdue action cannot be approved) | None needed |
| Every action is denied with rule `lockdown` | Kill switch engaged | Click **Release lockdown**, or `POST /v1/lockdown {"enabled": false}` |
| Every action from one agent is denied with `rate-limit` | More than 20 calls in 10 s | Wait 10 s without calling, or raise `rate_limit` in the policy |
| Held actions turn `expired` | No decision within `approval_timeout_seconds` (120) | Decide faster, or raise the value in the policy |
| Want to start over / old demo data on screen | Persistent DB | Stop the gateway, `rm actionguard.db`, restart |
| `tamper.py`: "No denied action in the audit log yet" | Fresh DB | Run the demo first |
| Dashboard says *reconnecting* | Gateway stopped | Restart the gateway, then reload the page |
| Policy reload returns `400` | Invalid rule, regex, non-integer `risk`, missing file or invalid JSON | Read the message; the old policy is still active |
| SDK raises `Blocked [gateway-error]: gateway rejected the request: HTTP 400 {"error": "agent must match ..."}` | Invalid agent or tool name (spaces, > 64 chars) | Use only letters, digits, `_ . - :` |
| SDK raises `Blocked [invalid-args]: arguments are not JSON-serialisable: ...` | A tool argument is an object `json` cannot encode (e.g. a file handle or a custom class) | Pass plain strings, numbers, lists or dicts |
| `ModuleNotFoundError: anthropic` | Optional demo dependency | `pip install anthropic` |

## 9. FAQ: likely viva questions

**Q1. How is this different from prompt guardrails like NeMo Guardrails or Lakera Guard?**
Those inspect the *text* going into or out of the model and try to recognise malicious instructions. ActionGuard inspects the *action*, the concrete tool call with its arguments, at the moment it would take effect. It assumes the model can be fooled and limits what a fooled model can do. The two are complementary layers.

**Q2. Can't the agent just bypass the SDK?**
If the agent's process has raw access to the capability (a shell, an HTTP client, DB credentials), yes. The SDK is a cooperative enforcement point, and we say so in the threat model. The fix is architectural: put the tools behind the gateway so that the agent holds no credentials and the only path to the shell, database or payment API goes through a decision. That is our main future-work item. What the current design already guarantees is that a prompt-injected model, which can only choose tool calls and arguments, cannot get past it.

**Q3. Why not use an LLM to judge whether an action is safe?**
An LLM judge is probabilistic, adds hundreds of milliseconds or more, costs money per call, and can itself be prompt-injected by the very arguments it is reading. A security control should be deterministic, explainable (rule ids), testable and fast. An LLM score could later be added as one more `flag`-style risk input, but never as the only decider.

**Q4. What is the latency overhead?**
The engine takes a median of 0.13 ms per evaluation with 20 rules. The full round trip from the SDK through HTTP, the engine, the SQLite insert and the audit hash takes a median of about 3 ms (p95 about 11 ms) on an Apple M1. An LLM step takes hundreds of milliseconds or more, so the overhead is negligible.

**Q5. How does the hash chain prove integrity?**
Each audit record stores `prev_hash` and `hash = SHA-256(JSON[prev_hash, ts, action_id, event, data])`. The first record links to 64 zeros. Verification recomputes every hash from the start. Changing any field of any record changes its hash and breaks the link to the next one, so verification reports the first broken `seq`. We demonstrated this live with `tamper.py`.

**Q6. Then can't an insider just recompute all the hashes?**
Yes. An unkeyed chain shows that the log is internally consistent, not that it is the original. Deleting the newest records is also not detectable internally. The standard fix is to anchor the head hash externally: publish it periodically to a write-once store or transparency log, or use an HMAC key held outside the database. That is listed as future work.

**Q7. Why does the strictest rule win instead of the first matching rule?**
First-match semantics make the outcome depend on rule order, a classic firewall misconfiguration. With strictest-wins (XACML's deny-overrides), a broad allow such as "workspace reads are fine" can never override a specific deny such as "never touch SSH keys", whatever the order.

**Q8. What does the `flag` effect add?**
It contributes risk without deciding. Several weak signals can add up: a POST to an unknown domain (50) carrying something that looks like a card number (40) totals 90 and is denied, even though no single rule says deny. A flag can also escalate an allowed action, as when the `.env` read is allowed by path but flagged with 60, so it goes to review.

**Q9. What happens if the gateway crashes or the reviewer is away?**
It fails closed. If the gateway is unreachable, the SDK raises `Blocked`. If nobody answers a pending action within 120 s, it becomes `expired` and is treated as denied. We chose safety over availability, as a firewall does.

**Q10. How do you stop an agent from approving its own request?**
Approve, reject, lockdown and policy reload require an admin bearer token, compared in constant time. Agents submit and poll without any token, and the SDK has no way to send one. Our integration test checks that an approve without the token returns 401.

**Q11. Why SQLite and only the standard library?**
A security component's dependencies are part of its attack surface, and the demo must run offline on any laptop. SQLite gives ACID transactions, so an action and its audit record are written atomically. The documented ceiling is a single writer lock. The scale-out path is PostgreSQL plus a shared rate limiter.

**Q12. Can regex rules be evaded?**
Yes, through base64, variable expansion, quoting tricks or equivalent commands. That is why our `allow` rules are narrow, anchored allow-lists and the default decision is `review`: an obfuscated command matches no allow rule and goes to a human instead of running. We tested `echo … | base64 -d | sh`, and it was held for review. Our own probing also found three allow-rule gaps: a newline in `allow-safe-shell` let a second command through, a recipient list ending in `@acme.com` counted as internal email, and a negative payment was allowed. We logged them in the threat model, fixed the regexes, and added `test_known_bypasses_closed` so they stay fixed. All three now go to review.

**Q13. How does this map to OWASP?**
Mainly LLM06 Excessive Agency: complete mediation, least privilege through allow-lists, and human approval for high-impact actions. It also covers LLM01 Prompt Injection (its consequences), LLM02 Sensitive Information Disclosure (secret and PII rules), LLM05 Improper Output Handling (generated shell and SQL are checked before execution) and LLM10 Unbounded Consumption (rate limit).

**Q14. Why SSE rather than WebSockets for the dashboard?**
Updates only flow server → browser. Commands go through ordinary authenticated POSTs. SSE is plain HTTP that the standard-library server can produce, and browsers reconnect automatically. WebSockets would add a handshake and framing for no benefit.
