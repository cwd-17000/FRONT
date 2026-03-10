import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NewInitiativeForm from "./NewInitiativeForm";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as {
      activeOrgId: string | null;
    };
  } catch {
    return null;
  }
}

interface Goal {
  id: string;
  name: string;
}

export default async function NewInitiativePage({
  searchParams,
}: {
  searchParams: Promise<{ goalId?: string }>;
}) {
  const { goalId } = await searchParams;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const res = await fetch(
    `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/goals`,
    {
      headers: { cookie: `access_token=${token.value}` },
      cache: "no-store",
    }
  );

  const goals: Goal[] = res.ok ? await res.json() : [];

  return (
    <NewInitiativeForm
      activeOrgId={user.activeOrgId}
      goals={goals}
      defaultGoalId={goalId ?? ""}
    />
  );
}
