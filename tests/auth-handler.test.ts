import test from "node:test";
import assert from "node:assert/strict";
import { protectAuthPost } from "../src/lib/auth-handler";
const origin = "https://centurion.example";
function request(body = '{"email":"user@example.com"}', from: string | null = origin) {
  const headers = new Headers({ "content-type": "application/json" });
  if (from) headers.set("origin", from);
  return new Request(origin + "/api/auth/sign-in/email", { method: "POST", headers, body });
}
test("authentication rejects missing and cross-site origins before calling auth", async () => {
  let calls = 0;
  const handler = protectAuthPost(async () => { calls++; return Response.json({}); }, origin);
  assert.equal((await handler(request("{}", null))).status, 403);
  assert.equal((await handler(request("{}", "https://attacker.example"))).status, 403);
  assert.equal(calls, 0);
});
test("authentication rejects oversized, malformed and non-object bodies", async () => {
  let calls = 0;
  const handler = protectAuthPost(async () => { calls++; return Response.json({}); }, origin);
  for (const [body, status] of [[JSON.stringify({ name: "x".repeat(16001) }), 413], ["{", 400], ["[]", 400]] as const)
    assert.equal((await handler(request(body))).status, status);
  assert.equal(calls, 0);
});
test("authentication forwards valid credentials and retains session cookies", async () => {
  const handler = protectAuthPost(async (req) => {
    assert.deepEqual(await req.json(), { email: "user@example.com" });
    assert.equal(req.headers.get("origin"), origin);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": "session=test; HttpOnly; Secure" } });
  }, origin);
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie")!, /HttpOnly; Secure/);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});
test("authentication fails closed without a configured canonical origin", async () => {
  const handler = protectAuthPost(async () => { throw new Error("must not run"); }, undefined);
  assert.equal((await handler(request())).status, 503);
});
