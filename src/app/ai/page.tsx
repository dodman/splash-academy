import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AiPageClient from "./AiPageClient";

export const metadata = { title: "Splash AI" };

export default async function AiPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <AiPageClient />;
}
