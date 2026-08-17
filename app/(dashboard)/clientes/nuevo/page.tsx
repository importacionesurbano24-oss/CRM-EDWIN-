import { redirect } from "next/navigation";

// No hay un formulario de página completa para alta de cliente — vive como
// modal en /clientes (NuevoClienteDialog). Este redirect con ?nuevo=1 hace
// que ese modal se abra solo al llegar acá.
export default function NuevoClientePage() {
  redirect("/clientes?nuevo=1");
}
