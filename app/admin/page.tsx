import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";
import AdminAuth from "./AdminAuth";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminPage() {
  const supabase = createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AdminAuth />;
  }

  const email = user.email?.toLowerCase() ?? "";
  const adminEmails = getAdminEmails();

  if (!adminEmails.includes(email)) {
    return <AdminAuth unauthorizedEmail={email} />;
  }

  return <AdminPanel email={email} />;
}
