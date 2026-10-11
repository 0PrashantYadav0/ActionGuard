"""Policy engine: turns a proposed agent action into allow / review / deny.

Evaluation order (first two short-circuit):
  1. Lockdown (kill switch) on          -> deny
  2. Agent over its rate limit          -> deny
  3. Every matching rule contributes its effect and risk
  4. Decision = strictest effect matched (default_decision if none matched)
  5. Risk >= deny_threshold -> deny; risk >= review_threshold -> at least review
"""
import fnmatch
import json
import re
import threading
import time
from collections import defaultdict, deque

STRICTNESS = {"allow": 0, "review": 1, "deny": 2}
EFFECTS = set(STRICTNESS) | {"flag"}  # flag = adds risk, no decision of its own


class PolicyError(ValueError):
    pass


class Policy:
    def __init__(self, data):
        self.name = data.get("name", "unnamed")
        self.default_decision = data.get("default_decision", "review")
        self.review_threshold = data.get("review_threshold", 50)
        self.deny_threshold = data.get("deny_threshold", 90)
        self.approval_timeout = data.get("approval_timeout_seconds", 120)
        rl = data.get("rate_limit", {})
        self.rate_max = rl.get("max_actions", 20)
        self.rate_window = rl.get("window_seconds", 10)
        if self.default_decision not in STRICTNESS:
            raise PolicyError(f"default_decision must be one of {list(STRICTNESS)}")
        self.raw = data
        self.rules = [self._compile(r) for r in data.get("rules", [])]

    @staticmethod
    def _compile(rule):
        for key in ("id", "tool", "effect"):
            if key not in rule:
                raise PolicyError(f"rule missing '{key}': {rule}")
        if rule["effect"] not in EFFECTS:
            raise PolicyError(f"rule {rule['id']}: bad effect {rule['effect']!r}")
        tools = rule["tool"] if isinstance(rule["tool"], list) else [rule["tool"]]
        try:
            when = {f: re.compile(p, re.I) for f, p in rule.get("when", {}).items()}
        except re.error as e:
            raise PolicyError(f"rule {rule['id']}: bad regex: {e}") from e
        return {
            "id": rule["id"],
            "description": rule.get("description", ""),
            "tools": tools,
            "effect": rule["effect"],
            "risk": _int(rule.get("risk", 0), rule["id"]),
            "when": when,
            "above": rule.get("above", {}),
        }

    @classmethod
    def load(cls, path):
        with open(path) as f:
            return cls(json.load(f))


def _int(value, rule_id):
    try:
        return int(value)
    except (TypeError, ValueError):
        raise PolicyError(f"rule {rule_id}: risk must be an integer, got {value!r}") from None


def _rule_matches(rule, tool, args):
    if not any(fnmatch.fnmatch(tool, t) for t in rule["tools"]):
        return False
    for field, rx in rule["when"].items():
        value = json.dumps(args, sort_keys=True) if field == "*" else args.get(field)
        if value is None or not rx.search(str(value)):
            return False
    for field, limit in rule["above"].items():
        try:
            if float(args.get(field)) <= limit:
                return False
        except (TypeError, ValueError):
            return False
    return True


class Engine:
    def __init__(self, policy):
        self.policy = policy
        self.lockdown = False
        self._recent = defaultdict(deque)  # agent -> timestamps of recent actions
        self._lock = threading.Lock()

    def _over_rate_limit(self, agent, now):
        # ponytail: in-memory per-process window; move to Redis if the gateway is scaled out
        with self._lock:
            q = self._recent[agent]
            while q and now - q[0] > self.policy.rate_window:
                q.popleft()
            q.append(now)
            return len(q) > self.policy.rate_max

    def evaluate(self, agent, tool, args, now=None):
        now = time.time() if now is None else now
        p = self.policy
        if self.lockdown:
            return _result("deny", 100, [_reason("lockdown", "deny", 100, "Global kill switch is engaged")])
        if self._over_rate_limit(agent, now):
            return _result("deny", 100, [_reason("rate-limit", "deny", 100,
                f"More than {p.rate_max} actions in {p.rate_window}s — possible runaway loop")])

        matched = [r for r in p.rules if _rule_matches(r, tool, args)]
        reasons = [_reason(r["id"], r["effect"], r["risk"], r["description"]) for r in matched]
        effects = [r["effect"] for r in matched if r["effect"] != "flag"]
        decision = max(effects, key=STRICTNESS.get) if effects else p.default_decision
        if not effects:
            reasons.append(_reason("default", p.default_decision, 0,
                                   "No rule decides this action; policy default applies"))
        risk = min(100, sum(r["risk"] for r in matched))
        if risk >= p.deny_threshold:
            decision = "deny"
        elif risk >= p.review_threshold and decision == "allow":
            decision = "review"
        return _result(decision, risk, reasons)


def _reason(rule, effect, risk, description):
    return {"rule": rule, "effect": effect, "risk": risk, "description": description}


def _result(decision, risk, reasons):
    return {"decision": decision, "risk": risk, "reasons": reasons}
