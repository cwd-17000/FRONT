import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NewGoalForm from "./NewGoalForm";

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

export default async function NewGoalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  // Pass activeOrgId directly to the client form — no fetch needed
  return <NewGoalForm activeOrgId={user.activeOrgId} />;
}
