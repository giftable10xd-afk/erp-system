import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDefaultLandingPath } from "@/lib/nav-items";

export default async function Home() {
  const session = await getSession();
  redirect(session ? getDefaultLandingPath(session.permissions) : "/start");
}
