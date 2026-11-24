import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { readJsonBody, RequestBodyError } from "../src/lib/request-body";
const schema = z.object({ name: z.string() }).strict();
const request = (body: string) => new Request("http://localhost", {
  method: "POST", headers: { "content-type": "application/json; charset=utf-8" }, body,
});
test("JSON bodies preserve schema validation and reject malformed JSON", async () => {
  assert.deepEqual(await readJsonBody(request('{"name":"Ada"}'), schema), { name: "Ada" });
  await assert.rejects(readJsonBody(request("{"), schema), (e: unknown) => e instanceof RequestBodyError && e.status === 400);
  await assert.rejects(readJsonBody(request('{"name":12}'), schema), z.ZodError);
});
test("body limit counts UTF-8 bytes, not characters", async () => {
  await assert.rejects(readJsonBody(request(JSON.stringify({ name: "é".repeat(9000) })), schema),
    (e: unknown) => e instanceof RequestBodyError && e.status === 413);
});
test("oversized streaming requests cancel before consuming the remaining chunks", async () => {
  let cancelled = false;
  let reads = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) { reads++; controller.enqueue(new Uint8Array(9000)); },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const r = new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: stream, duplex: "half" } as RequestInit);
  await assert.rejects(readJsonBody(r, schema), (e: unknown) => e instanceof RequestBodyError && e.status === 413);
  assert.equal(cancelled, true);
  assert.equal(reads, 2);
});
test("unsupported media types and oversized declared lengths are rejected", async () => {
  await assert.rejects(readJsonBody(new Request("http://localhost", { method: "POST", body: "{}" }), schema),
    (e: unknown) => e instanceof RequestBodyError && e.status === 415);
  const r = new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json", "content-length": "20000" }, body: "{}" });
  await assert.rejects(readJsonBody(r, schema), (e: unknown) => e instanceof RequestBodyError && e.status === 413);
});
