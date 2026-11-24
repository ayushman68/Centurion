import { z } from "zod";

export class RequestBodyError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function readJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json")
    throw new RequestBodyError(415, "CONTENT_TYPE", "Send JSON data.");
  const limit = 16000;
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > limit) {
    await request.body?.cancel();
    throw new RequestBodyError(413, "TOO_LARGE", "Request is too large.");
  }
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) {
          await reader.cancel();
          throw new RequestBodyError(413, "TOO_LARGE", "Request is too large.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new RequestBodyError(400, "INVALID_JSON", "Invalid JSON.");
  }
  return schema.parse(value);
}
