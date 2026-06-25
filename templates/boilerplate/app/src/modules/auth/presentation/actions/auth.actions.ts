"use server";

import { AuthError } from "next-auth";
import {
  signIn,
  signOut,
} from "../../infrastructure/session/providers/nextauth";
import type { SignInState } from "./types";

/**
 * Login por credenciais. Em sucesso, o `signIn` lança um redirect (NEXT_REDIRECT)
 * que deve propagar; só capturamos `AuthError` para devolver mensagem ao form.
 */
export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/preview",
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Credenciais inválidas." };
    }
    throw error;
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
