"""SQLite persistence: mutable action state + append-only, hash-chained audit ledger."""
import hashlib
import json
import sqlite3
import threading
import time

SCHEMA = """
CREATE TABLE IF NOT EXISTS actions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ts          REAL NOT NULL,
    agent       TEXT NOT NULL,
    tool        TEXT NOT NULL,
    args        TEXT NOT NULL,
    decision    TEXT NOT NULL,            -- allow | review | deny (engine verdict)
    status      TEXT NOT NULL,            -- allowed | denied | pending | approved | rejected | expired
    risk        INTEGER NOT NULL,
    reasons     TEXT NOT NULL,
    decided_by  TEXT,
    decided_at  REAL
);
CREATE TABLE IF NOT EXISTS audit (
    seq        INTEGER PRIMARY KEY AUTOINCREMENT,
    ts         REAL NOT NULL,
    action_id  INTEGER,
    event      TEXT NOT NULL,
    data       TEXT NOT NULL,
    prev_hash  TEXT NOT NULL,
    hash       TEXT NOT NULL
);
"""
GENESIS = "0" * 64
FINAL = {"allow": "allowed", "deny": "denied", "review": "pending"}


def _hash(prev, ts, action_id, event, data):
    payload = json.dumps([prev, ts, action_id, event, data], sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


class Store:
    def __init__(self, path):
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        self.lock = threading.Lock()  # ponytail: one writer lock; fine for SQLite, swap for Postgres at scale

    # --- audit ledger -------------------------------------------------------
    def _append_audit(self, action_id, event, data):
        row = self.db.execute("SELECT hash FROM audit ORDER BY seq DESC LIMIT 1").fetchone()
        prev = row["hash"] if row else GENESIS
        ts = time.time()
        data = json.dumps(data, sort_keys=True)
        self.db.execute(
            "INSERT INTO audit (ts, action_id, event, data, prev_hash, hash) VALUES (?,?,?,?,?,?)",
            (ts, action_id, event, data, prev, _hash(prev, ts, action_id, event, data)))

    def log_event(self, event, data):
        with self.lock, self.db:
            self._append_audit(None, event, data)

    def verify_chain(self):
        prev = GENESIS
        count = 0
        for r in self.db.execute("SELECT * FROM audit ORDER BY seq"):
            if r["prev_hash"] != prev or r["hash"] != _hash(prev, r["ts"], r["action_id"], r["event"], r["data"]):
                return {"ok": False, "broken_at": r["seq"], "checked": count}
            prev = r["hash"]
            count += 1
        return {"ok": True, "checked": count, "head": prev}

    # --- actions ------------------------------------------------------------
    def record(self, agent, tool, args, verdict):
        with self.lock, self.db:
            cur = self.db.execute(
                "INSERT INTO actions (ts, agent, tool, args, decision, status, risk, reasons) "
                "VALUES (?,?,?,?,?,?,?,?)",
                (time.time(), agent, tool, json.dumps(args), verdict["decision"],
                 FINAL[verdict["decision"]], verdict["risk"], json.dumps(verdict["reasons"])))
            aid = cur.lastrowid
            self._append_audit(aid, "evaluated", {"agent": agent, "tool": tool, "args": args, **verdict})
        return self.get(aid)

    def resolve(self, action_id, approve, by):
        """Approve/reject a pending action. Returns the row, or None if it wasn't pending."""
        status = "approved" if approve else "rejected"
        with self.lock, self.db:
            n = self.db.execute(
                "UPDATE actions SET status=?, decided_by=?, decided_at=? WHERE id=? AND status='pending'",
                (status, by, time.time(), action_id)).rowcount
            if n:
                self._append_audit(action_id, status, {"by": by})
        return self.get(action_id) if n else None

    def expire_stale(self, timeout):
        """Fail closed: pending approvals nobody answered in time become 'expired' (= denied)."""
        cutoff = time.time() - timeout
        with self.lock, self.db:
            ids = [r["id"] for r in self.db.execute(
                "SELECT id FROM actions WHERE status='pending' AND ts < ?", (cutoff,))]
            for aid in ids:
                self.db.execute("UPDATE actions SET status='expired', decided_by='timeout', decided_at=? "
                                "WHERE id=?", (time.time(), aid))
                self._append_audit(aid, "expired", {"timeout_seconds": timeout})
        return [self.get(i) for i in ids]

    def get(self, action_id):
        r = self.db.execute("SELECT * FROM actions WHERE id=?", (action_id,)).fetchone()
        return _row(r) if r else None

    def list(self, limit=200, status=None):
        q, params = "SELECT * FROM actions", []
        if status:
            q, params = q + " WHERE status=?", [status]
        rows = self.db.execute(q + " ORDER BY id DESC LIMIT ?", params + [limit])
        return [_row(r) for r in rows]

    def stats(self):
        out = {"total": 0, "allowed": 0, "denied": 0, "pending": 0, "approved": 0, "rejected": 0, "expired": 0}
        for r in self.db.execute("SELECT status, COUNT(*) n FROM actions GROUP BY status"):
            out[r["status"]] = r["n"]
            out["total"] += r["n"]
        avg = self.db.execute("SELECT AVG(risk) FROM actions").fetchone()[0]
        out["avg_risk"] = round(avg or 0, 1)
        out["agents"] = self.db.execute("SELECT COUNT(DISTINCT agent) FROM actions").fetchone()[0]
        return out


def _row(r):
    d = dict(r)
    d["args"] = json.loads(d["args"])
    d["reasons"] = json.loads(d["reasons"])
    return d
