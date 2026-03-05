import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL;

async function proxy(req: NextRequest): Promise<NextResponse> {
  // Strip the leading /api from the path and forward to NestJS
  const pathname = req.nextUrl.pathname.replace(/^\/api/, "");
  const search = req.nextUrl.search ?? "";
  const url = `${API_BASE_URL}${pathname}${search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  // Forward the incoming cookie to NestJS on server-to-server calls
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  let body: BodyInit | null = null;
  if (!["GET", "HEAD"].includes(req.method)) {
    body = await req.text();
  }

  const nestRes = await fetch(url, {
    method: req.method,
    headers,
    body,
  });

  const resBody = await nestRes.text();

  const response = new NextResponse(resBody, {
    status: nestRes.status,
    headers: { "Content-Type": nestRes.headers.get("content-type") ?? "application/json" },
  });

  // ✅ Forward Set-Cookie from NestJS so the httpOnly cookie lands in the browser
  const setCookie = nestRes.headers.get("set-cookie");
  if (setCookie) {
    response.headers.set("set-cookie", setCookie);
  }

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
