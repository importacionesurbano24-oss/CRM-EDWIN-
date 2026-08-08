import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * El webhook de Meta llega sin sesión de usuario — PasoCRM es de un solo
 * usuario (Edwin), así que se resuelve su user_id una vez con el cliente
 * de service role y se usa explícito en cada insert del webhook (los
 * inserts normales confían en `default auth.uid()`, que acá no aplica).
 */
export const getUserIdPropietario = cache(async function getUserIdPropietario(): Promise<
  string | null
> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error || !data.users[0]) {
    console.error("getUserIdPropietario:", error?.message ?? "sin usuarios");
    return null;
  }
  return data.users[0].id;
});
