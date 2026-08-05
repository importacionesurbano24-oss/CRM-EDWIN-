import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import type { Database } from "@/lib/types";

/**
 * Cliente con SUPABASE_SERVICE_ROLE_KEY — se salta RLS por completo.
 *
 * Úsalo SOLO para la página pública /cotizacion/[token]: un visitante
 * anónimo no tiene auth.uid(), así que las políticas normales (auth.uid() =
 * user_id) no le dejarían ver nada. El token en la URL hace las veces de
 * contraseña — este cliente busca una sola fila por ese token exacto, nunca
 * lista la tabla completa. No lo importes desde ningún componente cliente.
 *
 * cache(): generateMetadata() y el componente de página piden lo mismo en un
 * mismo request — sin esto se crearía el cliente y se repetiría la consulta.
 */
export const createServiceClient = cache(function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
});
