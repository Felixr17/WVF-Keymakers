"""Unit tests for scripts/pilot.py. No network: HumHub is an in-memory fake.

Run from the repository root:
    python3 -m unittest discover -s community/humhub/tests -v
"""

import io
import json
import os
import re
import sys
import tempfile
import unittest
import urllib.error
import urllib.parse
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "scripts"))

import pilot  # noqa: E402

MATRIX = pilot.load_json("access-matrix.json")
SPACES = pilot.load_json("spaces.json")["spaces"]
DEMO = pilot.load_json("demo-users.json")["users"]
TOKEN = "fake-" + "0" * 24  # built at runtime so the repository secret scan stays strict
LOCAL_ENV = {"HUMHUB_PILOT_ENV": "local", "HUMHUB_DEMO_PASSWORD": "demo-password-long-enough"}


def user(**overrides):
    base = {"key": "t", "lifecycleState": "Enabled", "participationLevel": "general", "roles": []}
    base.update(overrides)
    return base


class FakeResponse:
    def __init__(self, status, payload):
        self.status = status
        self._body = json.dumps(payload).encode()

    def read(self):
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class FakeHumHub:
    """Implements only the REST 0.11.7 operations pilot.py uses."""

    def __init__(self, fail_space_create_at=None):
        self.spaces, self.users, self.members = {}, {}, {}
        self.sessions_ended, self.writes, self.requests = [], [], []
        self.fail_space_create_at = fail_space_create_at
        self._next = 1

    def _id(self):
        self._next += 1
        return self._next

    def __call__(self, req):
        url = urllib.parse.urlparse(req.full_url)
        path = url.path.removeprefix("/api/v1")
        query = dict(urllib.parse.parse_qsl(url.query))
        method = req.get_method()
        body = json.loads(req.data) if req.data else None
        self.requests.append((method, path, req.get_header("Authorization")))
        if method != "GET":
            self.writes.append((method, path))
        status, payload = self.route(method, path, query, body)
        if status >= 400:
            raise urllib.error.HTTPError(req.full_url, status, "error", {}, io.BytesIO(json.dumps(payload).encode()))
        return FakeResponse(status, payload)

    @staticmethod
    def page(items, query):
        limit, page = int(query.get("limit", 50)), int(query.get("page", 1))
        chunk = items[(page - 1) * limit: page * limit]
        return {"total": len(items), "page": page, "pages": max(1, -(-len(items) // limit)), "results": chunk}

    def route(self, method, path, query, body):
        if path == "/space" and method == "GET":
            return 200, self.page([{"id": i, "name": n} for i, n in self.spaces.items()], query)
        if path == "/space" and method == "POST":
            if len(body["description"]) > 100:
                return 422, {"message": "Validation failed", "description": {"length": "too long"}}
            if self.fail_space_create_at is not None and len(self.spaces) == self.fail_space_create_at:
                self.fail_space_create_at = None
                return 500, {"message": "Internal error " + TOKEN}
            sid = self._id()
            self.spaces[sid] = body["name"]
            self.members[sid] = set()
            return 200, {"id": sid}
        if path == "/user/get-by-email":
            for uid, u in self.users.items():
                if u["email"] == query["email"]:
                    return 200, {"id": uid, "account": {"status": u["status"]}}
            return 404, {"message": "User not found"}
        if path == "/user" and method == "POST":
            uid = self._id()
            self.users[uid] = {"email": body["account"]["email"], "status": body["account"]["status"]}
            return 200, {"id": uid}
        m = re.fullmatch(r"/user/(\d+)", path)
        if m and method == "PUT":
            self.users[int(m.group(1))]["status"] = body["account"]["status"]
            return 200, {"id": int(m.group(1))}
        m = re.fullmatch(r"/user/session/all/(\d+)", path)
        if m and method == "DELETE":
            self.sessions_ended.append(int(m.group(1)))
            return 200, {"message": "ok"}
        m = re.fullmatch(r"/space/(\d+)/membership", path)
        if m and method == "GET":
            ids = sorted(self.members[int(m.group(1))])
            return 200, self.page([{"user": {"id": i}} for i in ids], query)
        m = re.fullmatch(r"/space/(\d+)/membership/(\d+)", path)
        if m:
            sid, uid = int(m.group(1)), int(m.group(2))
            if method == "POST":
                self.members[sid].add(uid)
                return 200, {"message": "ok"}
            if method == "DELETE":
                self.members[sid].discard(uid)
                return 200, {"message": "ok"}
        return 404, {"message": "not implemented in fake: " + method + " " + path}


class PolicyTests(unittest.TestCase):
    def names(self, u):
        by_key = {s["key"]: s["name"] for s in SPACES}
        return {by_key[k] for k in pilot.intended_space_keys(u, MATRIX)}

    GENERAL = {"Welcome & Announcements", "Community Circle", "Share Your Key", "Microloan Resources"}

    def test_general_gets_selected_spaces_only(self):
        self.assertEqual(self.names(user()), self.GENERAL)

    def test_paid_adds_paid_member_circle(self):
        self.assertEqual(self.names(user(participationLevel="paid")), self.GENERAL | {"Paid Member Circle"})

    def test_roles_are_independent_of_level(self):
        self.assertEqual(self.names(user(roles=["connector"])), self.GENERAL | {"Connector Hub"})
        self.assertEqual(self.names(user(roles=["keyGuide"])), self.GENERAL | {"Key Guide Hub"})
        self.assertEqual(
            self.names(user(participationLevel="paid", roles=["keyGuide"])),
            self.GENERAL | {"Paid Member Circle", "Key Guide Hub"},
        )
        self.assertNotIn("Paid Member Circle", self.names(user(roles=["connector", "keyGuide"])))

    def test_staff_requires_explicit_role_and_grants_only_staff_space(self):
        self.assertEqual(self.names(user(participationLevel=None, roles=["staff"])), {"WVF Staff"})
        self.assertNotIn("WVF Staff", self.names(user(participationLevel="paid", roles=["connector", "keyGuide"])))

    def test_role_without_participation_level_grants_nothing(self):
        self.assertEqual(self.names(user(participationLevel=None, roles=["connector"])), set())

    def test_unknown_values_fail_closed(self):
        self.assertEqual(self.names(user(participationLevel="vip")), set())
        self.assertEqual(self.names(user(lifecycleState="Pending approval")), set())
        self.assertEqual(self.names(user(lifecycleState=None)), set())
        with self.assertRaises(pilot.PilotError):
            pilot.intended_space_keys(user(roles=["admin"]), MATRIX)

    def test_suspended_keeps_memberships_but_account_disabled(self):
        u = user(lifecycleState="Suspended", participationLevel="paid")
        self.assertIn("Paid Member Circle", self.names(u))
        self.assertEqual(pilot.intended_status(u), pilot.STATUS_DISABLED)

    def test_revoked_loses_everything(self):
        u = user(lifecycleState="Revoked", participationLevel="paid", roles=["keyGuide", "staff"])
        self.assertEqual(self.names(u), set())
        self.assertEqual(pilot.intended_status(u), pilot.STATUS_DISABLED)

    def test_every_demo_persona_is_represented(self):
        self.assertEqual({u["participationLevel"] for u in DEMO}, {"general", "paid"})
        self.assertEqual({r for u in DEMO for r in u["roles"]}, {"connector", "keyGuide", "staff"})
        self.assertTrue(all(u["email"].endswith("@example.com") for u in DEMO))


class ClientGuardTests(unittest.TestCase):
    def test_requires_https_and_token(self):
        with self.assertRaises(pilot.PilotError):
            pilot.Client("http://localhost", TOKEN)
        with self.assertRaises(pilot.PilotError):
            pilot.Client("https://localhost", "")
        with self.assertRaises(pilot.PilotError):
            pilot.Client("", TOKEN)

    def test_demo_commands_refuse_non_local(self):
        fake = FakeHumHub()
        remote = pilot.Client("https://community.example.org", TOKEN, opener=fake)
        local = pilot.Client("https://localhost", TOKEN, opener=fake)
        with self.assertRaises(pilot.PilotError):
            pilot.require_local(LOCAL_ENV, remote)
        with self.assertRaises(pilot.PilotError):
            pilot.require_local({"HUMHUB_PILOT_ENV": "production"}, local)
        with self.assertRaises(pilot.PilotError):
            pilot.cmd_demo_users(LOCAL_ENV, remote, lambda *_: None)
        self.assertEqual(fake.requests, [], "no request is sent when the guard refuses")

    def test_demo_users_must_be_example_com(self):
        with self.assertRaises(pilot.PilotError):
            pilot.check_demo_users([{"key": "x", "email": "someone@" + "gmail.com"}])

    def test_short_demo_password_refused(self):
        client = pilot.Client("https://localhost", TOKEN, opener=FakeHumHub())
        with self.assertRaises(pilot.PilotError):
            pilot.cmd_demo_users({"HUMHUB_PILOT_ENV": "local", "HUMHUB_DEMO_PASSWORD": "short"}, client, lambda *_: None)


class SanitizeTests(unittest.TestCase):
    def test_redacts_secrets_and_truncates(self):
        out = pilot.sanitize("failed with " + TOKEN + " " + "x" * 500, [TOKEN])
        self.assertNotIn(TOKEN, out)
        self.assertIn("[redacted]", out)
        self.assertLessEqual(len(out), 300)

    def test_http_errors_are_sanitized(self):
        fake = FakeHumHub(fail_space_create_at=0)
        client = pilot.Client("https://localhost", TOKEN, opener=fake)
        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(pilot, "STATE_DIR", tmp):
            with self.assertRaises(pilot.PilotError) as ctx:
                pilot.cmd_spaces({}, client, lambda *_: None)
        self.assertNotIn(TOKEN, str(ctx.exception))
        self.assertIn("HTTP 500", str(ctx.exception))

    def test_main_never_prints_the_token(self):
        lines = []
        env = {"HUMHUB_API_BASE_URL": "http://insecure", "HUMHUB_API_TOKEN": TOKEN}
        with mock.patch.object(pilot, "load_env", return_value=env):
            code = pilot.main(["verify"], out=lines.append)
        self.assertEqual(code, 2)
        self.assertNotIn(TOKEN, "\n".join(lines))


class IdempotencyTests(unittest.TestCase):
    def setUp(self):
        self.fake = FakeHumHub()
        self.client = pilot.Client("https://localhost", TOKEN, opener=self.fake)
        self.tmp = tempfile.TemporaryDirectory()
        self.patch = mock.patch.object(pilot, "STATE_DIR", self.tmp.name)
        self.patch.start()
        self.out = []

    def tearDown(self):
        self.patch.stop()
        self.tmp.cleanup()

    def run_all(self):
        pilot.cmd_spaces(LOCAL_ENV, self.client, self.out.append)
        pilot.cmd_demo_users(LOCAL_ENV, self.client, self.out.append)
        pilot.cmd_sync(LOCAL_ENV, self.client, self.out.append)

    def test_rerun_creates_nothing_new(self):
        self.run_all()
        self.assertEqual(len(self.fake.spaces), len(SPACES))
        self.assertEqual(len(self.fake.users), len(DEMO))
        self.fake.writes.clear()
        self.run_all()
        writes = [w for w in self.fake.writes if not w[1].startswith("/user/session/all/")]
        self.assertEqual(writes, [], "second run only re-ends sessions for disabled personas")
        self.assertEqual(len(self.fake.spaces), len(SPACES))
        self.assertEqual(pilot.cmd_verify(LOCAL_ENV, self.client, self.out.append), 0)

    def test_memberships_match_the_matrix(self):
        self.run_all()
        ids = pilot.read_space_ids()
        for demo in DEMO:
            uid = self.client.find_user_by_email(demo["email"])["id"]
            held = {sid for sid, members in self.fake.members.items() if uid in members}
            self.assertEqual(held, {ids[k] for k in pilot.intended_space_keys(demo, MATRIX)}, demo["username"])
            self.assertEqual(self.fake.users[uid]["status"], pilot.intended_status(demo), demo["username"])
        disabled = {self.client.find_user_by_email(d["email"])["id"] for d in DEMO if d["lifecycleState"] != "Enabled"}
        self.assertTrue(disabled and disabled <= set(self.fake.sessions_ended))

    def test_sync_removes_unapproved_memberships(self):
        self.run_all()
        ids = pilot.read_space_ids()
        general = next(d for d in DEMO if d["username"] == "demo-general")
        uid = self.client.find_user_by_email(general["email"])["id"]
        self.fake.members[ids["paid"]].add(uid)
        self.fake.members[ids["staff"]].add(uid)
        self.assertEqual(pilot.cmd_verify(LOCAL_ENV, self.client, self.out.append), 1)
        pilot.cmd_sync(LOCAL_ENV, self.client, self.out.append)
        self.assertNotIn(uid, self.fake.members[ids["paid"]])
        self.assertNotIn(uid, self.fake.members[ids["staff"]])
        self.assertEqual(pilot.cmd_verify(LOCAL_ENV, self.client, self.out.append), 0)

    def test_retry_after_partial_failure_reuses_existing_spaces(self):
        self.fake.fail_space_create_at = 3
        with self.assertRaises(pilot.PilotError):
            pilot.cmd_spaces(LOCAL_ENV, self.client, self.out.append)
        self.assertEqual(len(self.fake.spaces), 3)
        pilot.cmd_spaces(LOCAL_ENV, self.client, self.out.append)
        self.assertEqual(sorted(self.fake.spaces.values()), sorted(s["name"] for s in SPACES))

    def test_pagination_reads_every_page(self):
        for i in range(120):
            self.fake.spaces[1000 + i] = f"Other {i}"
        self.assertEqual(len(list(self.client.paged("/space"))), 120)

    def test_bearer_header_is_sent(self):
        self.client.find_user_by_email("nobody@example.com")
        self.assertEqual(self.fake.requests[-1][2], "Bearer " + TOKEN)


class DeploymentGateTests(unittest.TestCase):
    def approved(self):
        gate = pilot.load_json("deployment-gate.json")
        gate["status"], gate["deploymentEnabled"] = "approved", True
        for check in gate["checks"]:
            check.update(confirmed=True, confirmedBy="WVF budget owner", evidence="signed note on file")
        return gate

    def test_shipped_gate_is_blocked(self):
        self.assertFalse(pilot.deployment_gate_passed(pilot.load_json("deployment-gate.json")))

    def test_every_check_needs_written_evidence(self):
        self.assertTrue(pilot.deployment_gate_passed(self.approved()))
        for field, value in (("confirmed", False), ("confirmedBy", ""), ("evidence", "")):
            gate = self.approved()
            gate["checks"][0][field] = value
            self.assertFalse(pilot.deployment_gate_passed(gate), field)
        gate = self.approved()
        gate["deploymentEnabled"] = False
        self.assertFalse(pilot.deployment_gate_passed(gate))
        self.assertFalse(pilot.deployment_gate_passed({"status": "approved", "deploymentEnabled": True, "checks": []}))

    def test_non_local_commands_refuse_before_any_request(self):
        lines = []
        env = {"HUMHUB_PILOT_ENV": "production", "HUMHUB_API_BASE_URL": "https://community.example.org", "HUMHUB_API_TOKEN": TOKEN}
        with mock.patch.object(pilot, "load_env", return_value=env), mock.patch.object(pilot, "Client") as client:
            code = pilot.main(["spaces"], out=lines.append)
        self.assertEqual(code, 2)
        client.assert_not_called()
        self.assertIn("deployment gate", lines[-1])

    def test_local_pilot_is_not_blocked(self):
        pilot.require_deployment_gate({"HUMHUB_PILOT_ENV": "local"})


class OpenApiTests(unittest.TestCase):
    SAMPLE = """openapi: 3.0.0
paths:
  /space:
    get:
      summary: list
    post:
      summary: create
  "/space/{id}/membership/{userId}":
    post:
      summary: add
components:
  schemas:
    get:
      type: object
"""

    def test_parser_reads_paths_only(self):
        ops = pilot.openapi_operations(self.SAMPLE)
        self.assertEqual(ops, {("/space", "get"), ("/space", "post"), ("/space/{id}/membership/{userId}", "post")})

    def test_missing_operation_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            for name in ("space.yaml", "user.yaml"):
                with open(os.path.join(tmp, name), "w", encoding="utf-8") as fh:
                    fh.write(self.SAMPLE)
            self.assertEqual(pilot.cmd_openapi({"OPENAPI_DIR": tmp}, None, lambda *_: None), 1)


if __name__ == "__main__":
    unittest.main()
