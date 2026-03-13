/**
 * Binary-safe proxy for the goals bulk import endpoint.
 *
 * The catch-all proxy at /api/[...path] reads the body with req.text(),
 * which corrupts multipart binary data. This specific route intercepts
 * POST /api/organizations/:orgId/goals/import and forwards the raw
 * ArrayBuffer so the .xlsx/.csv bytes reach the backend intact.
 */
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL?.trim();

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> },
) {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: "API_BASE_URL is not configured" }, { status: 500 });
  }

  const { orgId } = await context.params;
  const search = req.nextUrl.search ?? "";
  const url = `${API_BASE_URL}/organizations/${orgId}/goals/import${search}`;

  // Build forwarded headers — preserve Content-Type (includes multipart boundary)
  const fwdHeaders = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) fwdHeaders.set("content-type", contentType);

  // Forward auth cookie + extract Bearer token
  const cookie = req.headers.get("cookie") ?? "";
  if (cookie) fwdHeaders.set("cookie", cookie);
  const tokenMatch = cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  if (tokenMatch) fwdHeaders.set("authorization", `Bearer ${tokenMatch[1]}`);

  // Read the body as raw bytes — critical for binary file content
  const body = await req.arrayBuffer();

  let nestRes: Response;
  try {
    nestRes = await fetch(url, { method: "POST", headers: fwdHeaders, body });
  } catch {
    return NextResponse.json({ message: "Unable to reach upstream API" }, { status: 502 });
  }

  const resBody = await nestRes.text();
  return new NextResponse(resBody, {
    status: nestRes.status,
    headers: {
      "content-type": nestRes.headers.get("content-type") ?? "application/json",
    },
  });
}
