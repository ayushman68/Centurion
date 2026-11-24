import { z } from "zod";
import { readJsonBody, RequestBodyError } from "./request-body";

export function protectAuthPost(
  handler: (request: Request) => Promise<Response>,
  canonicalURL: string | undefined,
) {
  return async (request: Request): Promise<Response> => {
    const error = (status: number, code: string, message: string) =>
      Response.json({ code, message }, { status, headers: { "Cache-Control": "no-store" } });
    if (!canonicalURL)
      return error(503, "AUTH_UNAVAILABLE", "Authentication is not configured.");
    if (request.headers.get("origin") !== new URL(canonicalURL).origin)
      return error(403, "ORIGIN", "Request origin is not allowed.");
    try {
      const data = await readJsonBody(request, z.record(z.string(), z.unknown()));
      const headers = new Headers(request.headers);
      headers.delete("content-length");
      const bounded = new Request(request.url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: request.signal,
      });
      const response = await handler(bounded);
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    } catch (e) {
      if (e instanceof RequestBodyError) return error(e.status, e.code, e.message);
      if (e instanceof z.ZodError) return error(400, "INVALID_JSON", "Send a JSON object.");
      // Do not return adapter/database exceptions or request bodies to callers.
      console.error(JSON.stringify({ event: "auth_request_failed", errorType: e instanceof Error ? e.name : "Unknown" }));
      return error(500, "AUTH_FAILED", "Authentication failed. Please try again.");
    }
  };
}
