import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL?.trim();

async function proxy(req: NextRequest): Promise<NextResponse> {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { message: "API_BASE_URL is not configured" },
      { status: 500 },
    );
  }

  // Strip the leading /api from the path and forward to NestJS
  const pathname = req.nextUrl.pathname.replace(/^\/api/, "");
  const search = req.nextUrl.search ?? "";
  const url = `${API_BASE_URL}${pathname}${search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("expect");
  headers.delete("connection");
  headers.delete("content-length");

  // Forward the incoming cookie to NestJS on server-to-server calls
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const cookieHeader = req.headers.get("cookie") ?? "";
  const tokenMatch = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
  if (tokenMatch) {
    headers.set("Authorization", `Bearer ${tokenMatch[1]}`);
  }

  let body: BodyInit | null = null;
  if (!["GET", "HEAD"].includes(req.method)) {
    body = await req.text();
  }

  let nestRes: Response;
  try {
    nestRes = await fetch(url, {
      method: req.method,
      headers,
      body,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach upstream API" },
      { status: 502 },
    );
  }

  const resBody = await nestRes.text();

  const response = new NextResponse(resBody, {
    status: nestRes.status,
  });

  const contentType = nestRes.headers.get("content-type");
  if (contentType) {
    response.headers.set("content-type", contentType);
  }

  // Forward all Set-Cookie headers exactly as received from upstream.
  const maybeHeaders = nestRes.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies =
    typeof maybeHeaders.getSetCookie === "function"
      ? maybeHeaders.getSetCookie()
      : [];

  if (setCookies.length > 0) {
    for (const cookieValue of setCookies) {
      response.headers.append("set-cookie", cookieValue);
    }
  } else {
    const setCookie = nestRes.headers.get("set-cookie");
    if (setCookie) {
      response.headers.append("set-cookie", setCookie);
    }
  }

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
