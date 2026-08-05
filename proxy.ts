import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas de auth: si ya hay sesión, se redirige lejos de ellas (ej. /login).
const AUTH_ROUTES = ["/login"];

// Rutas siempre públicas sin importar la sesión — el cliente abre su
// cotización por link, esté Edwin logueado en ese navegador o no.
function esRutaPublicaSiempre(pathname: string) {
  return pathname.startsWith("/cotizacion/");
}

function faltaConfiguracion() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sin credenciales de Supabase, crear el cliente truena en cada request.
  // Mandamos a /setup con instrucciones en vez de dejar que la app crashee.
  if (faltaConfiguracion()) {
    if (pathname === "/setup") return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/setup";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() revalida el token contra el servidor de Supabase Auth.
  // getSession() no lo hace y no debe usarse para decisiones de autorización aquí.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (esRutaPublicaSiempre(pathname)) {
    return supabaseResponse;
  }

  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
