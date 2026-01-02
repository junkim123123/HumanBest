import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppNavbar } from "@/components/nav/TopNav";
import type { UserRole } from "@/lib/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const role = (user.user_metadata?.role || user.app_metadata?.role || "VIEWER") as UserRole;

  return (
    <>
      <AppNavbar user={user} needsAttentionCount={0} showBilling={true} />
      {children}
    </>
  );
}

