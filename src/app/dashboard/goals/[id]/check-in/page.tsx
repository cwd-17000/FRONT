import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import CheckInForm from "./CheckInForm";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null };
  } catch {
    return null;
  }
}

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const res = await fetch(
    `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/goals/${id}`,
    { headers: { cookie: `access_token=${token.value}` }, cache: "no-store" }
  );

  if (res.status === 404) notFound();
  if (!res.ok) redirect("/dashboard/goals");

  const goal = await res.json();

  if (goal.type === "OBJECTIVE" || goal.status !== "ACTIVE") {
    redirect(`/dashboard/goals/${id}`);
  }

  return (
    <CheckInForm
      activeOrgId={user.activeOrgId}
      goalId={id}
      goalTitle={goal.title}
      goalCurrentValue={goal.currentValue}
      goalTargetValue={goal.targetValue}
      goalUnit={goal.unit}
    />
  );
}
