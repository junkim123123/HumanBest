import { PublicNavbar } from "@/components/nav/TopNav";
import { getCurrentUser } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  return (
    <>
      <PublicNavbar user={user} />
      {children}
    </>
  );
}

