const PASOS = [
  {
    titulo: "Crea el proyecto en Supabase",
    detalle:
      'Entra a supabase.com → New Project. Ponle un nombre y una contraseña de base de datos, y espera a que termine de crearse (1-2 min).',
  },
  {
    titulo: "Copia las 3 claves a .env.local",
    detalle:
      "En el proyecto → Project Settings → API. Copia Project URL, anon public key y service_role key a las variables correspondientes en .env.local (en la raíz de este proyecto).",
  },
  {
    titulo: "Corre la migración",
    detalle:
      "En Supabase → SQL Editor → New query. Pega todo el contenido de supabase/migrations/0001_init.sql y presiona Run. Esto crea las tablas de clientes y seguimientos.",
  },
  {
    titulo: "Crea tu usuario",
    detalle:
      "En Supabase → Authentication → Users → Add user → Create new user. Ese correo y contraseña son los que usarás para entrar a PasoCRM.",
  },
  {
    titulo: "Reinicia el servidor",
    detalle:
      "Detén pnpm dev (Ctrl+C) y vuelve a correrlo para que tome las variables nuevas.",
  },
];

export default function SetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path d="M3 14L9 4L15 14H3Z" fill="#0A0A0A" />
            </svg>
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-foreground">
              PasoCRM
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Dormiluna
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="mb-1 text-lg font-semibold text-foreground">
            Falta conectar Supabase
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            El proyecto está listo, pero <code className="rounded bg-[#1A1A1A] px-1 py-0.5 text-[13px]">.env.local</code>{" "}
            todavía no tiene las credenciales de Supabase. Son 5 pasos, toman
            unos 5 minutos:
          </p>

          <ol className="flex flex-col gap-4">
            {PASOS.map((paso, i) => (
              <li key={paso.titulo} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {paso.titulo}
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted-foreground">
                    {paso.detalle}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-6 text-xs text-[#444]">
            El detalle completo está en README.md, en la raíz del proyecto.
          </p>
        </div>
      </div>
    </div>
  );
}
