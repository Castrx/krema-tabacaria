"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerSessionClient } from "@/lib/supabase/server-session";

export async function signOutAction() {
  const supabase = await getSupabaseServerSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
