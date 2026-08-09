"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/common/adapters/supabase/server";
import { getSession } from "@/modules/auth";
import type { SignInState } from "./types";

/**
 * Login por email/senha via Supabase Auth.
 */
export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { ok: false, message: "Credenciais inválidas." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, message: "Credenciais inválidas." };
  }

  const session = await getSession();
  if (session?.user.roles?.includes("admin")) {
    redirect("/studio");
  }

  redirect("/wiki");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
