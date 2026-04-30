import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RadioIndexPage() {
  // Hard-redirect langsung ke slug radiortm
  redirect("/radio/radiortm");
}