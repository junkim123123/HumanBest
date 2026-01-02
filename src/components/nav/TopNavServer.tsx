import { getCurrentUser } from "@/lib/auth";
import { TopNav } from "./TopNavClient";

interface TopNavServerProps {
  variant: "public" | "app";
}

export async function TopNavServer({ variant }: TopNavServerProps) {
  const user = await getCurrentUser();
  
  return <TopNav variant={variant} user={user} />;
}
