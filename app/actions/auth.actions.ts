"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/action-result";

const LoginSchema = z.object({
  email: z.string().trim().email("Correo inválido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export async function actionLogin(
  _prevState: ActionResult<null> | undefined,
  formData: FormData
): Promise<ActionResult<null>> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { data: null, error: "Correo o contraseña incorrectos." };
  }

  redirect("/inicio");
}

export async function actionLogout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
