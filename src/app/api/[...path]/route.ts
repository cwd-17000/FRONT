import { NextRequest } from "next/server";

const API_URL = process.env.API_BASE_URL;

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  if (!API_URL) {
    return Response.json(
      { error: "Missing API_BASE_URL environment variable" },
      { status: 500 }
    );
  }

  if (API_URL === req.nextUrl.origin) {
    return Response.json(
      {
        error:
          "API_BASE_URL points to this frontend host. Set it to your backend API host.",
      },
      { status: 500 }
    );
  }

  const { path } = await context.params;
  const normalizedApiUrl = API_URL.replace(/\/$/, "");
  const pathSuffix = path.join("/");
  const directUrl = `${normalizedApiUrl}/${pathSuffix}`;
  const prefixedUrl = `${normalizedApiUrl}/api/${pathSuffix}`;

  const requestInit: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.get("cookie") || "",
    },
    body: req.method !== "GET" ? await req.text() : undefined,
    credentials: "include",
  };

  let res = await fetch(directUrl, requestInit);
  if (res.status === 404) {
    res = await fetch(prefixedUrl, requestInit);
  }

  const body = await res.text();

  return new Response(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
      "set-cookie": res.headers.get("set-cookie") ?? "",
    },
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as DELETE,
};
