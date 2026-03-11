import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NewGoalForm from "./NewGoalForm";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null };
  } catch {
    return null;
  }
}

export default async function NewGoalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  // Fetch existing goals so user can link a parent goal in step 3
  const res = await fetch(
    `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/goals?limit=100`,
    { headers: { cookie: `access_token=${token.value}` }, cache: "no-store" }
  );

  const data = res.ok ? await res.json() : { items: [] };
  const parentGoals = (data.items ?? []).map(
    (g: { id: string; title: string; type: string; timeframe: string }) => ({
      id: g.id,
      title: g.title,
      type: g.type,
      timeframe: g.timeframe,
    })
  );

  return <NewGoalForm activeOrgId={user.activeOrgId} parentGoals={parentGoals} />;
}
