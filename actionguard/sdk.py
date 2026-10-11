"""Client SDK — the enforcement point that lives inside the agent process.

    guard = Guard(agent="devops-bot")

    @guard.protect("run_shell")
    def run_shell(command): ...

Every call to run_shell now asks the gateway first. Denied -> Blocked is raised and the
function body never runs. Review -> the call waits for a human. Gateway down -> Blocked
(fail closed).
"""
import functools
import inspect
import json
import time
import urllib.error
import urllib.request


class Blocked(Exception):
    def __init__(self, action):
        self.action = action
        why = "; ".join(r["description"] for r in action.get("reasons", []) if r["effect"] != "allow")
        super().__init__(f"ActionGuard blocked {action.get('tool')} [{action.get('status')}]: {why}")


def _local_block(tool, status, why):
    return Blocked({"tool": tool, "status": status, "reasons": [{"effect": "deny", "description": why}]})


class Guard:
    def __init__(self, agent, url="http://127.0.0.1:8700", poll_seconds=1.0, on_pending=None):
        self.agent = agent
        self.url = url.rstrip("/")
        self.poll_seconds = poll_seconds
        self.on_pending = on_pending  # callback(action) when a human needs to look

    def _call(self, method, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.url + path, data=data, method=method,
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.load(r)

    def check(self, tool, **args):
        """Return the final action record if allowed/approved, else raise Blocked."""
        try:
            action = self._call("POST", "/v1/actions", {"agent": self.agent, "tool": tool, "args": args})
            if action["status"] == "pending" and self.on_pending:
                self.on_pending(action)
            while action["status"] == "pending":
                time.sleep(self.poll_seconds)
                action = self._call("GET", f"/v1/actions/{action['id']}")
        except urllib.error.HTTPError as e:
            raise _local_block(tool, "gateway-error", f"gateway rejected the request: HTTP {e.code} "
                               f"{e.read().decode(errors='replace')[:200]}") from e
        except (urllib.error.URLError, OSError) as e:
            raise _local_block(tool, "gateway-unreachable", f"fail-closed: {e}") from e
        except (TypeError, ValueError) as e:
            raise _local_block(tool, "invalid-args", f"arguments are not JSON-serialisable: {e}") from e
        if action["status"] in ("allowed", "approved"):
            return action
        raise Blocked(action)

    def protect(self, tool=None):
        def deco(fn):
            sig = inspect.signature(fn)

            @functools.wraps(fn)
            def wrapper(*a, **kw):
                bound = sig.bind(*a, **kw)
                bound.apply_defaults()
                self.check(tool or fn.__name__, **bound.arguments)
                return fn(*a, **kw)
            return wrapper
        return deco
