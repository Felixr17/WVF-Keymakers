#!/usr/bin/env python3
"""Keymakers Community Circle — HumHub pilot helper (host-side, standard library only).

Uses only REST API 0.11.7 operations listed in the module's OpenAPI files
(docs/swagger/space.yaml, docs/swagger/user.yaml):

  GET  /api/v1/space                         POST /api/v1/space
  GET  /api/v1/space/{id}/membership         POST/DELETE /api/v1/space/{id}/membership/{userId}
  GET  /api/v1/user/get-by-email             POST /api/v1/user
  PUT  /api/v1/user/{id}                     DELETE /api/v1/user/session/all/{id}

Commands
  openapi       Check the installed module's OpenAPI files list every operation used here.
  plan          Print intended spaces per demo user. No network.
  spaces        Create any missing pilot spaces (matched by name). Records IDs in state/space-ids.json.
  demo-users    Create missing synthetic users. Local only.
  sync          Make demo users' memberships and account status match the access matrix. Local only.
  verify        Read-only check that HumHub matches the intended plan. Exits 1 on mismatch.

Every command is idempotent: re-running creates no duplicate spaces, users, or memberships.
This script is a pilot/administration aid. The future Keymakers Dashboard adapter, not this
script and never the public website, will provision real members.
"""

import argparse
import json
import os
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_DIR = os.path.join(ROOT, "config")
STATE_DIR = os.path.join(ROOT, "state")
LOCAL_HOSTS = {"localhost", "127.0.0.1"}
STATUS_ENABLED = 1
STATUS_DISABLED = 0
ACTIVE_STATES = {"Enabled"}
DISABLED_STATES = {"Suspended", "Revoked"}
PAGE_LIMIT = 50


class PilotError(Exception):
    pass


def load_json(name):
    with open(os.path.join(CONFIG_DIR, name), encoding="utf-8") as fh:
        return json.load(fh)


def load_env(path=None):
    """Values from .env, overridden by the process environment."""
    path = path or os.path.join(ROOT, ".env")
    values = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip().strip('"').strip("'")
    for key, value in os.environ.items():
        if key.startswith(("HUMHUB_", "KEYMAKERS_")):
            values[key] = value
    return values


def sanitize(text, secrets=()):
    text = str(text)
    for secret in secrets:
        if secret:
            text = text.replace(secret, "[redacted]")
    return text[:300]


# --------------------------------------------------------------------------
# Policy (deterministic; mirrors config/access-matrix.json)
# --------------------------------------------------------------------------

def intended_space_keys(user, matrix):
    """Spaces a person should hold. Unknown values grant nothing."""
    state = user.get("lifecycleState")
    if state == "Revoked":
        return []
    if state not in ACTIVE_STATES | {"Suspended"}:
        return []

    levels = matrix["participationLevels"]
    level = user.get("participationLevel")
    keys = []
    if level in levels:
        chain = []
        current = level
        while current:
            if current in chain:
                raise PilotError(f"participation level cycle at {current}")
            chain.append(current)
            current = levels[current].get("inherits")
        for name in reversed(chain):
            keys.extend(levels[name]["spaces"])

    roles = matrix["roles"]
    for role in user.get("roles", []):
        if role not in roles:
            raise PilotError(f"unknown role {role!r} for {user.get('key')}")
        if role != "staff" and not keys:
            continue
        keys.extend(roles[role]["spaces"])

    seen = []
    for key in keys:
        if key not in seen:
            seen.append(key)
    return seen


def intended_status(user):
    return STATUS_DISABLED if user.get("lifecycleState") in DISABLED_STATES else STATUS_ENABLED


# --------------------------------------------------------------------------
# REST client
# --------------------------------------------------------------------------

class Client:
    def __init__(self, base_url, token, insecure=False, opener=None):
        if not base_url:
            raise PilotError("HUMHUB_API_BASE_URL is not set")
        if not token:
            raise PilotError("HUMHUB_API_TOKEN is not set")
        parsed = urllib.parse.urlparse(base_url)
        if parsed.scheme != "https":
            raise PilotError("HUMHUB_API_BASE_URL must use https")
        self.base = base_url.rstrip("/") + "/api/v1"
        self.host = parsed.hostname
        self.token = token
        self.context = ssl._create_unverified_context() if insecure else ssl.create_default_context()
        self._open = opener or (lambda req: urllib.request.urlopen(req, context=self.context, timeout=30))

    def request(self, method, path, body=None, query=None):
        url = self.base + path
        if query:
            url += "?" + urllib.parse.urlencode(query)
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", "Bearer " + self.token)
        req.add_header("Accept", "application/json")
        if data is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with self._open(req) as resp:
                raw = resp.read().decode() or "null"
                return resp.status, json.loads(raw)
        except urllib.error.HTTPError as err:
            try:
                payload = json.loads(err.read().decode() or "null")
            except ValueError:
                payload = None
            return err.code, payload
        except (urllib.error.URLError, OSError) as err:
            raise PilotError("HumHub unreachable: " + sanitize(err, [self.token])) from None

    def expect(self, status, payload, ok, action):
        if status not in ok:
            message = payload.get("message", "") if isinstance(payload, dict) else ""
            if isinstance(payload, dict):
                fields = sorted(k for k, v in payload.items() if isinstance(v, dict))
                details = [f"{f}.{name}" for f in fields for name in sorted(payload[f])]
                if details:
                    message += " fields: " + ", ".join(details)
            raise PilotError(f"{action} failed (HTTP {status}) {sanitize(message, [self.token])}".strip())
        return payload

    def paged(self, path):
        page = 1
        while True:
            status, payload = self.request("GET", path, query={"page": page, "limit": PAGE_LIMIT})
            payload = self.expect(status, payload, {200}, "GET " + path)
            results = payload.get("results", [])
            yield from results
            pages = payload.get("pages")
            if not results or (pages is not None and page >= pages) or len(results) < PAGE_LIMIT:
                return
            page += 1

    def find_user_by_email(self, email):
        status, payload = self.request("GET", "/user/get-by-email", query={"email": email})
        if status == 404:
            return None
        return self.expect(status, payload, {200}, "find user")

    def member_ids(self, space_id):
        return {m["user"]["id"] for m in self.paged(f"/space/{space_id}/membership") if m.get("user")}


# --------------------------------------------------------------------------
# State
# --------------------------------------------------------------------------

def read_space_ids():
    path = os.path.join(STATE_DIR, "space-ids.json")
    if not os.path.exists(path):
        raise PilotError("state/space-ids.json missing; run `pilot.py spaces` first")
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def write_space_ids(ids):
    os.makedirs(STATE_DIR, exist_ok=True)
    with open(os.path.join(STATE_DIR, "space-ids.json"), "w", encoding="utf-8") as fh:
        json.dump(ids, fh, indent=2)
        fh.write("\n")


def require_local(env, client):
    if env.get("HUMHUB_PILOT_ENV") != "local":
        raise PilotError("demo users are local-only: set HUMHUB_PILOT_ENV=local")
    if client.host not in LOCAL_HOSTS:
        raise PilotError(f"demo users are local-only: refusing host {client.host!r}")


def check_demo_users(users):
    for user in users:
        if not user["email"].endswith("@example.com"):
            raise PilotError(f"demo user {user['key']} must use an example.com address")


# --------------------------------------------------------------------------
# Commands
# --------------------------------------------------------------------------

def cmd_plan(_env, _client, out):
    matrix = load_json("access-matrix.json")
    names = {s["key"]: s["name"] for s in load_json("spaces.json")["spaces"]}
    for user in load_json("demo-users.json")["users"]:
        keys = intended_space_keys(user, matrix)
        status = "enabled" if intended_status(user) == STATUS_ENABLED else "disabled"
        spaces = ", ".join(names[k] for k in keys) or "(none)"
        out(f"{user['username']:<16} {user['lifecycleState']:<10} account {status:<8} spaces: {spaces}")
    return 0


def cmd_spaces(_env, client, out):
    config = load_json("spaces.json")
    existing = {s["name"]: s["id"] for s in client.paged("/space")}
    ids = {}
    for space in config["spaces"]:
        if space["name"] in existing:
            ids[space["key"]] = existing[space["name"]]
            out(f"exists  {space['name']} (id {ids[space['key']]})")
            continue
        body = {
            "name": space["name"],
            "description": space["description"],
            "visibility": space["visibility"],
            "join_policy": space["joinPolicy"],
        }
        status, payload = client.request("POST", "/space", body=body)
        payload = client.expect(status, payload, {200, 201}, "create space " + space["name"])
        ids[space["key"]] = payload["id"]
        out(f"created {space['name']} (id {payload['id']})")
    write_space_ids(ids)
    out("Space IDs written to state/space-ids.json (untracked). Copy them to the dashboard's HUMHUB_*_SPACE_ID values later.")
    return 0


def cmd_demo_users(env, client, out):
    require_local(env, client)
    users = load_json("demo-users.json")["users"]
    check_demo_users(users)
    password = env.get("HUMHUB_DEMO_PASSWORD", "")
    if len(password) < 12:
        raise PilotError("HUMHUB_DEMO_PASSWORD must be set in .env (12+ characters)")
    for user in users:
        if client.find_user_by_email(user["email"]):
            out(f"exists  {user['username']}")
            continue
        body = {
            "account": {"username": user["username"], "email": user["email"], "status": STATUS_ENABLED},
            "profile": {"firstname": user["firstname"], "lastname": user["lastname"]},
            "password": {"newPassword": password, "mustChangePassword": False},
        }
        status, payload = client.request("POST", "/user", body=body)
        client.expect(status, payload, {200, 201}, "create user " + user["username"])
        out(f"created {user['username']}")
    return 0


def _plan_for(client, users, matrix, space_ids):
    pilot_space_ids = set(space_ids.values())
    members = {sid: client.member_ids(sid) for sid in pilot_space_ids}
    plan = []
    for user in users:
        record = client.find_user_by_email(user["email"])
        if not record:
            raise PilotError(f"{user['username']} not found; run `pilot.py demo-users` first")
        uid = record["id"]
        wanted = {space_ids[k] for k in intended_space_keys(user, matrix)}
        current = {sid for sid, ids in members.items() if uid in ids}
        plan.append({
            "user": user,
            "id": uid,
            "add": sorted(wanted - current),
            "remove": sorted(current - wanted),
            "status": record.get("account", {}).get("status"),
            "wantStatus": intended_status(user),
        })
    return plan


def cmd_sync(env, client, out):
    require_local(env, client)
    matrix = load_json("access-matrix.json")
    users = load_json("demo-users.json")["users"]
    check_demo_users(users)
    space_ids = read_space_ids()
    for item in _plan_for(client, users, matrix, space_ids):
        uid, name = item["id"], item["user"]["username"]
        # Re-enable before adding memberships so HumHub accepts them; disable last.
        if item["wantStatus"] == STATUS_ENABLED and item["status"] != STATUS_ENABLED:
            client.expect(*client.request("PUT", f"/user/{uid}", body={"account": {"status": STATUS_ENABLED}}), {200}, "enable " + name)
        for sid in item["add"]:
            status, payload = client.request("POST", f"/space/{sid}/membership/{uid}", query={"silent": "true", "canLeave": 0})
            client.expect(status, payload, {200, 201}, f"add {name} to space {sid}")
        for sid in item["remove"]:
            status, payload = client.request("DELETE", f"/space/{sid}/membership/{uid}")
            client.expect(status, payload, {200, 204}, f"remove {name} from space {sid}")
        if item["wantStatus"] == STATUS_DISABLED:
            if item["status"] != STATUS_DISABLED:
                client.expect(*client.request("PUT", f"/user/{uid}", body={"account": {"status": STATUS_DISABLED}}), {200}, "disable " + name)
            status, payload = client.request("DELETE", f"/user/session/all/{uid}")
            client.expect(status, payload, {200, 204, 404}, "end sessions " + name)
        out(f"synced  {name}: +{len(item['add'])} -{len(item['remove'])} status={item['wantStatus']}")
    return 0


def cmd_verify(_env, client, out):
    matrix = load_json("access-matrix.json")
    users = load_json("demo-users.json")["users"]
    ok = True
    for item in _plan_for(client, users, matrix, read_space_ids()):
        good = not item["add"] and not item["remove"] and item["status"] == item["wantStatus"]
        ok = ok and good
        detail = "" if good else f" missing={item['add']} extra={item['remove']} status={item['status']} want={item['wantStatus']}"
        out(f"{'PASS' if good else 'FAIL'}    {item['user']['username']}{detail}")
    return 0 if ok else 1


REQUIRED_OPERATIONS = [
    ("space.yaml", "/space", "get"),
    ("space.yaml", "/space", "post"),
    ("space.yaml", "/space/{id}/membership", "get"),
    ("space.yaml", "/space/{id}/membership/{userId}", "post"),
    ("space.yaml", "/space/{id}/membership/{userId}", "delete"),
    ("user.yaml", "/user", "post"),
    ("user.yaml", "/user/get-by-email", "get"),
    ("user.yaml", "/user/{id}", "put"),
    ("user.yaml", "/user/session/all/{id}", "delete"),
]


def openapi_operations(text):
    """(path, method) pairs from a REST module swagger YAML file (paths section only)."""
    ops, path = set(), None
    for line in text.splitlines():
        stripped = line.strip().strip('"').strip("'")
        if line.startswith("  ") and not line.startswith("   ") and stripped.endswith(":"):
            candidate = stripped[:-1].strip('"').strip("'")
            path = candidate if candidate.startswith("/") else None
        elif path and line.startswith("    ") and not line.startswith("     "):
            method = line.strip().rstrip(":")
            if method in {"get", "post", "put", "patch", "delete"}:
                ops.add((path, method))
    return ops


def cmd_openapi(env, _client, out):
    folder = env.get("OPENAPI_DIR") or os.path.join(STATE_DIR, "openapi")
    missing = []
    for filename, path, method in REQUIRED_OPERATIONS:
        file_path = os.path.join(folder, filename)
        if not os.path.exists(file_path):
            raise PilotError(f"{file_path} missing; copy the installed module's docs/swagger first")
        with open(file_path, encoding="utf-8") as fh:
            found = (path, method) in openapi_operations(fh.read())
        out(f"{'OK  ' if found else 'MISSING'} {method.upper():<6} /api/v1{path}")
        if not found:
            missing.append((method, path))
    return 1 if missing else 0


COMMANDS = {
    "openapi": cmd_openapi,
    "plan": cmd_plan,
    "spaces": cmd_spaces,
    "demo-users": cmd_demo_users,
    "sync": cmd_sync,
    "verify": cmd_verify,
}


def main(argv=None, out=print):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=sorted(COMMANDS))
    parser.add_argument("--env-file", default=None)
    args = parser.parse_args(argv)
    env = load_env(args.env_file)
    try:
        client = None
        if args.command not in ("plan", "openapi"):
            client = Client(env.get("HUMHUB_API_BASE_URL"), env.get("HUMHUB_API_TOKEN"), env.get("HUMHUB_TLS_INSECURE") == "1")
        return COMMANDS[args.command](env, client, out)
    except PilotError as err:
        out("ERROR: " + sanitize(err, [env.get("HUMHUB_API_TOKEN", ""), env.get("HUMHUB_DEMO_PASSWORD", "")]))
        return 2


if __name__ == "__main__":
    sys.exit(main())
