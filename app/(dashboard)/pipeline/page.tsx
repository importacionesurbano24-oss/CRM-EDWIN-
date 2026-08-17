import { redirect } from "next/navigation";

// El pipeline es la vista "Etapas" de /clientes — no una pantalla aparte.
export default function PipelinePage() {
  redirect("/clientes");
}
