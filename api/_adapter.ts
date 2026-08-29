import type { VercelRequest, VercelResponse } from "@vercel/node";

export type WebHandler = (request: Request) => Promise<Response>;

export async function runWebHandler(req: VercelRequest, res: VercelResponse, handler: WebHandler) {
  const protocol = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `${protocol}://${host}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach(item => headers.append(key, item));
    else if (value !== undefined) headers.set(key, value);
  }

  const method = req.method || "GET";
  const body = method === "GET" || method === "HEAD"
    ? undefined
    : typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body ?? {});

  const response = await handler(new Request(url, { method, headers, body }));
  const responseBody = Buffer.from(await response.arrayBuffer());

  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.status(response.status).send(responseBody);
}
