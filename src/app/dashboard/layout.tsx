import { cookies } from "next/headers";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import DemoBanner from "@/components/dashboard/DemoBanner";

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
  let demoBannerData: {
    orgId: string;
    objectiveCount: number;
    hasDemoData: boolean;
    enableDemo: boolean;
    canLaunchDemo: boolean;
  } | null = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");

    if (token) {
      const user = decodeJwtPayload(token.value);
      userEmail = user?.email ?? "";

      if (user?.activeOrgId) {
        const headers = { cookie: `access_token=${token.value}` };
        const [orgRes, demoStatusRes] = await Promise.all([
          fetch(`${process.env.API_BASE_URL}/organizations/${user.activeOrgId}`, {
            headers,
            cache: "no-store",
          }),
          fetch(`${process.env.API_BASE_URL}/organizations/${user.activeOrgId}/demo/status`, {
            headers,
            cache: "no-store",
          }),
        ]);

        if (orgRes.ok) {
          const org = await orgRes.json();
          orgName = org.name ?? "";
        }

        if (demoStatusRes.ok) {
          const status = await demoStatusRes.json();
          demoBannerData = {
            orgId: user.activeOrgId,
            objectiveCount: status.objectiveCount ?? 0,
            hasDemoData: status.hasDemoData ?? false,
            enableDemo: status.enableDemo ?? true,
            canLaunchDemo: status.canLaunchDemo ?? false,
          };
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
          {demoBannerData && (
            <div className="px-6 pt-6 max-w-5xl mx-auto">
              <DemoBanner
                orgId={demoBannerData.orgId}
                objectiveCount={demoBannerData.objectiveCount}
                hasDemoData={demoBannerData.hasDemoData}
                enableDemo={demoBannerData.enableDemo}
                canLaunchDemo={demoBannerData.canLaunchDemo}
              />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
