import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) {
    redirect("/login");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>You are authenticated.</p>
    </div>
  );
}