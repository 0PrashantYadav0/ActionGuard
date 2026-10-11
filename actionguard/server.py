"""ActionGuard gateway: HTTP API + live event stream + dashboard. Stdlib only."""
import argparse
import sys
import hmac
import json
import os
import queue
import re
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .engine import Engine, Policy
from .store import Store

ROOT = Path(__file__).resolve().parent.parent
DASHBOARD = ROOT / "dashboard" / "index.html"
MAX_BODY = 1_000_000
NAME_RX = re.compile(r"^[\w.\-:]{1,64}$")


class Gateway:
    """Everything the HTTP layer needs, kept separate so tests can drive it directly."""

    def __init__(self, policy_path, db_path, admin_token):
        self.policy_path = policy_path
        self.engine = Engine(Policy.load(policy_path))
        self.store = Store(db_path)
        self.admin_token = admin_token
        self.subscribers = []
        self.sub_lock = threading.Lock()

    def publish(self, kind, data):
        msg = json.dumps({"type": kind, "data": data})
        with self.sub_lock:
            for q in self.subscribers:
                q.put(msg)

    def submit(self, agent, tool, args):
        verdict = self.engine.evaluate(agent, tool, args)
        action = self.store.record(agent, tool, args, verdict)
        self.publish("action", action)
        return action

    def resolve(self, action_id, approve, by):
        self.expire()
        action = self.store.resolve(action_id, approve, by)
        if action:
            self.publish("action", action)
        return action

    def expire(self):
        for action in self.store.expire_stale(self.engine.policy.approval_timeout):
            self.publish("action", action)

    def set_lockdown(self, on, by):
        self.engine.lockdown = on
        self.store.log_event("lockdown_on" if on else "lockdown_off", {"by": by})
        self.publish("lockdown", {"enabled": on})

    def reload_policy(self, by):
        self.engine.policy = Policy.load(self.policy_path)
        self.store.log_event("policy_reloaded", {"by": by, "policy": self.engine.policy.name})
        self.publish("policy", {"name": self.engine.policy.name})


def make_handler(gw):
    class Handler(BaseHTTPRequestHandler):
        server_version = "ActionGuard/1.0"

        def log_message(self, *a):  # keep the console for the presenter
            pass

        # --- helpers --------------------------------------------------------
        def _send(self, code, body, ctype="application/json"):
            data = body if isinstance(body, bytes) else json.dumps(body).encode()
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _json_body(self):
            n = int(self.headers.get("Content-Length") or 0)
            if n > MAX_BODY:
                raise ValueError("body too large")
            body = json.loads(self.rfile.read(n) or b"{}")
            if not isinstance(body, dict):
                raise ValueError("body must be a JSON object")
            return body

        def _is_admin(self):
            got = self.headers.get("Authorization", "").removeprefix("Bearer ").strip()
            return bool(gw.admin_token) and hmac.compare_digest(got.encode(), gw.admin_token.encode())

        # --- routes ---------------------------------------------------------
        def do_GET(self):
            url = urlparse(self.path)
            path, qs = url.path, parse_qs(url.query)
            gw.expire()
            if path == "/":
                return self._send(200, DASHBOARD.read_bytes(), "text/html; charset=utf-8")
            if path == "/v1/health":
                return self._send(200, {"ok": True, "lockdown": gw.engine.lockdown})
            if path == "/v1/actions":
                status = qs.get("status", [None])[0]
                return self._send(200, gw.store.list(status=status))
            if m := re.fullmatch(r"/v1/actions/(\d+)", path):
                action = gw.store.get(int(m[1]))
                return self._send(200, action) if action else self._send(404, {"error": "not found"})
            if path == "/v1/stats":
                return self._send(200, {**gw.store.stats(), "lockdown": gw.engine.lockdown})
            if path == "/v1/policy":
                return self._send(200, gw.engine.policy.raw)
            if path == "/v1/audit/verify":
                return self._send(200, gw.store.verify_chain())
            if path == "/v1/events":
                return self._stream()
            self._send(404, {"error": "not found"})

        def do_POST(self):
            path = urlparse(self.path).path
            try:
                body = self._json_body()
            except (ValueError, json.JSONDecodeError) as e:
                return self._send(400, {"error": str(e)})

            if path == "/v1/actions":
                agent, tool, args = body.get("agent"), body.get("tool"), body.get("args", {})
                if not (isinstance(agent, str) and NAME_RX.match(agent)):
                    return self._send(400, {"error": "agent must match " + NAME_RX.pattern})
                if not (isinstance(tool, str) and NAME_RX.match(tool)):
                    return self._send(400, {"error": "tool must match " + NAME_RX.pattern})
                if not isinstance(args, dict):
                    return self._send(400, {"error": "args must be an object"})
                return self._send(201, gw.submit(agent, tool, args))

            # Everything below changes what agents may do: admin only.
            # Agents never hold this token, so an agent cannot approve its own request.
            if not self._is_admin():
                return self._send(401, {"error": "admin token required"})
            who = str(body.get("by", "admin"))[:64]
            if m := re.fullmatch(r"/v1/actions/(\d+)/(approve|reject)", path):
                action = gw.resolve(int(m[1]), m[2] == "approve", who)
                return self._send(200, action) if action else self._send(409, {"error": "not pending"})
            if path == "/v1/lockdown":
                gw.set_lockdown(bool(body.get("enabled")), who)
                return self._send(200, {"lockdown": gw.engine.lockdown})
            if path == "/v1/policy/reload":
                try:
                    gw.reload_policy(who)
                except Exception as e:  # any bad policy file: keep serving the old one
                    return self._send(400, {"error": f"policy rejected, old policy kept: {e}"})
                return self._send(200, {"policy": gw.engine.policy.name})
            self._send(404, {"error": "not found"})

        def _stream(self):
            q = queue.Queue()
            with gw.sub_lock:
                gw.subscribers.append(q)
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            try:
                while True:
                    try:
                        msg = q.get(timeout=15)
                        self.wfile.write(f"data: {msg}\n\n".encode())
                    except queue.Empty:
                        gw.expire()
                        self.wfile.write(b": keepalive\n\n")
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass
            finally:
                with gw.sub_lock:
                    gw.subscribers.remove(q)

    return Handler


def serve(gw, host="127.0.0.1", port=8700):
    httpd = ThreadingHTTPServer((host, port), make_handler(gw))
    httpd.daemon_threads = True
    return httpd


def main():
    ap = argparse.ArgumentParser(description="ActionGuard execution firewall gateway")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8700)
    ap.add_argument("--policy", default=str(ROOT / "policies" / "default.json"))
    ap.add_argument("--db", default=str(ROOT / "actionguard.db"))
    a = ap.parse_args()

    token = os.environ.get("ACTIONGUARD_ADMIN_TOKEN") or "demo-admin-token"
    gw = Gateway(a.policy, a.db, token)
    httpd = serve(gw, a.host, a.port)
    sys.stdout.reconfigure(line_buffering=True)
    print(f"ActionGuard gateway  ->  http://{a.host}:{a.port}/?token={token}")
    print(f"policy: {gw.engine.policy.name} ({len(gw.engine.policy.rules)} rules)   db: {a.db}")
    if token == "demo-admin-token":
        print("WARNING: default admin token in use — set ACTIONGUARD_ADMIN_TOKEN outside demos")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
