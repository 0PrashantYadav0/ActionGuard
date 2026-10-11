"""Simulate an insider covering their tracks: rewrite one audit entry directly in SQLite.

    python demo/tamper.py            # then click 'Verify audit chain' in the dashboard
"""
import sqlite3
import sys
from pathlib import Path

db = sys.argv[1] if len(sys.argv) > 1 else str(Path(__file__).resolve().parent.parent / "actionguard.db")
con = sqlite3.connect(db)
row = con.execute("SELECT seq FROM audit WHERE data LIKE '%\"deny\"%' ORDER BY seq LIMIT 1").fetchone()
if not row:
    sys.exit("No denied action in the audit log yet — run the demo first.")
con.execute("UPDATE audit SET data = replace(data, '\"deny\"', '\"allow\"') WHERE seq = ?", row)
con.commit()
print(f"Rewrote audit entry #{row[0]}: 'deny' -> 'allow'. The hash chain should now report it.")
