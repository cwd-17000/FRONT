import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const decoded = jwtDecode<{
      sub: string;
      email: string;
      activeOrgId: string;
      permissions: string[];
    }>(token);
    return NextResponse.json({
      sub: decoded.sub,
      email: decoded.email,
      activeOrgId: decoded.activeOrgId,
      permissions: decoded.permissions ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
