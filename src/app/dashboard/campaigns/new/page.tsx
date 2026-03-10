import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NewCampaignForm from "./NewCampaignForm";

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

interface Initiative {
  id: string;
  name: string;
}

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ initiativeId?: string }>;
}) {
  const { initiativeId } = await searchParams;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

  const user = decodeJwtPayload(token.value);
  if (!user?.activeOrgId) redirect("/onboarding");

  const res = await fetch(
    `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/initiatives`,
    {
      headers: { cookie: `access_token=${token.value}` },
      cache: "no-store",
    }
  );

  const initiatives: Initiative[] = res.ok ? await res.json() : [];

  return (
    <NewCampaignForm
      activeOrgId={user.activeOrgId}
      initiatives={initiatives}
      defaultInitiativeId={initiativeId ?? ""}
    />
  );
}
