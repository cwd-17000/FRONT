import { cookies } from "next/headers";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

function decodeJwtPayload(token: string) {
  try {
    const base64 = token.split(".")[1];
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as {
      sub: string;
      email: string;
      activeOrgId: string | null;
    };
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gracefully read user/org info for the header — pages handle auth redirects
  let userEmail = "";
  let orgName = "";

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");

    if (token) {
      const user = decodeJwtPayload(token.value);
      userEmail = user?.email ?? "";

      if (user?.activeOrgId) {
        const res = await fetch(
          `${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`,
          {
            headers: { cookie: `access_token=${token.value}` },
            cache: "no-store",
          }
        );
        if (res.ok) {
          const org = await res.json();
          orgName = org.name ?? "";
        }
      }
    }
  } catch {
    // Graceful degradation — pages handle redirects
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header userEmail={userEmail} orgName={orgName} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
