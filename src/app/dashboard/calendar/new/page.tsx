import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NewCalendarEventForm from "./NewCalendarEventForm";

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

export default async function NewCalendarEventPage() {
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

  return <NewCalendarEventForm activeOrgId={user.activeOrgId} initiatives={initiatives} />;
}
