import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ReportingDashboard from "./ReportingDashboard";
import type { Team } from "@/types/reporting";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null; sub: string };
  } catch {
    return null;
  }
}

export default async function ReportingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const orgId = user.activeOrgId;
  const headers = { cookie: `access_token=${token.value}` };

  const teamsRes = await fetch(
    `${process.env.API_BASE_URL}/organizations/${orgId}/teams`,
    { headers, cache: "no-store" },
  );
  const teams: Team[] = teamsRes.ok ? await teamsRes.json() : [];

  return <ReportingDashboard orgId={orgId} teams={teams} />;
}
