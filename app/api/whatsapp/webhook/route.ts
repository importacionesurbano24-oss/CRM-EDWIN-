import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { getUserIdPropietario } from "@/lib/whatsapp/propietario";
import { mismoTelefono } from "@/lib/whatsapp/telefono";

// Única API route de lógica de negocio permitida por CLAUDE.md: Meta solo
// puede llamar a una URL HTTP, no a un Server Action.

interface MensajeMeta {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface CambioMeta {
  field: string;
  value: {
    messages?: MensajeMeta[];
    contacts?: { profile?: { name?: string }; wa_id: string }[];
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modo = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (modo === "subscribe" && token && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Token de verificación inválido.", { status: 403 });
}

function verificarFirma(cuerpoTexto: string, firmaHeader: string | null): boolean {
  const secreto = process.env.WHATSAPP_APP_SECRET;
  if (!secreto || !firmaHeader) return false;

  const esperado =
    "sha256=" + createHmac("sha256", secreto).update(cuerpoTexto).digest("hex");

  const a = Buffer.from(firmaHeader);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

function textoDelMensaje(mensaje: MensajeMeta): string {
  if (mensaje.type === "text" && mensaje.text) return mensaje.text.body;
  return `[mensaje de tipo "${mensaje.type}", no soportado todavía]`;
}

export async function POST(request: Request) {
  const cuerpoTexto = await request.text();

  if (!verificarFirma(cuerpoTexto, request.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Firma inválida.", { status: 401 });
  }

  const userId = await getUserIdPropietario();
  if (!userId) {
    return new NextResponse("Sin usuario propietario.", { status: 500 });
  }

  const payload = JSON.parse(cuerpoTexto) as {
    entry?: { changes?: CambioMeta[] }[];
  };

  const supabase = createServiceClient();

  for (const entry of payload.entry ?? []) {
    for (const cambio of entry.changes ?? []) {
      if (cambio.field !== "messages" || !cambio.value.messages) continue;

      const nombreContacto = cambio.value.contacts?.[0]?.profile?.name;

      for (const mensaje of cambio.value.messages) {
        const clienteId = await obtenerOCrearCliente(
          supabase,
          userId,
          mensaje.from,
          nombreContacto
        );
        if (!clienteId) continue;

        const { error } = await supabase.from("mensajes_whatsapp").insert({
          user_id: userId,
          cliente_id: clienteId,
          direccion: "entrante",
          contenido: textoDelMensaje(mensaje),
          whatsapp_message_id: mensaje.id,
        });

        // 23505 = ya existía (Meta reintentó la entrega del webhook) — no es un error real.
        if (error && error.code !== "23505") {
          console.error("webhook whatsapp insert:", error.message);
        }
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}

async function obtenerOCrearCliente(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  numeroWhatsapp: string,
  nombreContacto: string | undefined
): Promise<string | null> {
  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("id, telefono_whatsapp")
    .eq("user_id", userId);

  if (error) {
    console.error("obtenerOCrearCliente (buscar):", error.message);
    return null;
  }

  const existente = (clientes ?? []).find(
    (c) => c.telefono_whatsapp && mismoTelefono(c.telefono_whatsapp, numeroWhatsapp)
  );
  if (existente) return existente.id;

  const { data: nuevoCliente, error: errorCrear } = await supabase
    .from("clientes")
    .insert({
      user_id: userId,
      nombre: nombreContacto || `WhatsApp ${numeroWhatsapp}`,
      telefono_whatsapp: numeroWhatsapp,
      origen: "otro",
    })
    .select("id")
    .single();

  if (errorCrear || !nuevoCliente) {
    console.error("obtenerOCrearCliente (crear):", errorCrear?.message);
    return null;
  }

  await supabase.from("seguimientos").insert({
    user_id: userId,
    cliente_id: nuevoCliente.id,
    etapa: "prospecto",
    notas: "Cliente creado automáticamente por un mensaje de WhatsApp entrante.",
  });

  return nuevoCliente.id;
}
