export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    // Check the origin actually serving this request, including local and
    // Vercel preview URLs, instead of forcing the canonical production domain.
    const expected = new URL(request.url).origin;
    return new URL(origin).origin === expected;
  } catch { return false; }
}
