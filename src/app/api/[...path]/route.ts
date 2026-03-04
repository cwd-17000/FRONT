import { NextRequest } from "next/server";

const API_URL = process.env.API_BASE_URL!;

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const url = `${API_URL}/${path.join("/")}`;

  const res = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.get("cookie") || "",
    },
    body: req.method !== "GET" ? await req.text() : undefined,
    credentials: "include",
  });

  const body = await res.text();

  return new Response(body, {
    status: res.status,
    headers: {
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
