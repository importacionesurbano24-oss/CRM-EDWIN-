import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
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
            Iniciar sesión
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Entra con tu correo y contraseña para ver la malla de clientes.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
