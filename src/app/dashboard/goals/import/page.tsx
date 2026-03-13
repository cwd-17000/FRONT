import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GoalsImportClient from "@/components/goals/GoalsImportClient";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as { activeOrgId: string | null; sub: string };
  } catch {
    return null;
  }
}

export default async function GoalsImportPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  return <GoalsImportClient orgId={user.activeOrgId} />;
}
