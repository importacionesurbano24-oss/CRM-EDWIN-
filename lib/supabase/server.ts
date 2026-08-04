import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/lib/types";

// cache() memoiza por request: layout.tsx y page.tsx comparten la misma
// instancia y las consultas envueltas en cache() de lib/data no se repiten.
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ocurre al llamar desde un Server Component (no puede escribir
            // cookies). Se ignora porque proxy.ts refresca la sesión en cada
            // request y sí puede escribirlas.
          }
        },
      },
    }
  );
});
