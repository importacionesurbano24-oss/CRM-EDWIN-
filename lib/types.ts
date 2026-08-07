// Tipos de la base de datos. Escritos a mano para reflejar
// supabase/migrations/0001_init.sql — reemplazar por el resultado de:
//   pnpm supabase gen types typescript --project-id [tu-project-id] > lib/types.ts
// una vez que el proyecto de Supabase esté creado y la migración aplicada.
//
// La forma (Tables/Views/Functions/Relationships) sigue exactamente lo que
// espera @supabase/supabase-js internamente — si falta alguna clave, el
// cliente tipado degrada silenciosamente a `never` en los métodos .insert()
// / .update() / selects con join.

export type Etapa =
  | "prospecto"
  | "cotizo"
  | "compro"
  | "posventa"
  | "referido_solicitado";

export type Origen = "walk-in" | "referido" | "otro";

export type EstadoCotizacion = "enviada" | "vista" | "aceptada" | "vencida";

export type RolChat = "user" | "assistant";

export interface ProductoItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          telefono_whatsapp: string | null;
          email: string | null;
          origen: Origen;
          referido_por_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          nombre: string;
          telefono_whatsapp?: string | null;
          email?: string | null;
          origen?: Origen;
          referido_por_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          telefono_whatsapp?: string | null;
          email?: string | null;
          origen?: Origen;
          referido_por_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clientes_referido_por_id_fkey";
            columns: ["referido_por_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      seguimientos: {
        Row: {
          id: string;
          user_id: string;
          cliente_id: string;
          etapa: Etapa;
          proxima_accion: string | null;
          proxima_accion_fecha: string | null;
          notas: string | null;
          link_cotizacion: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          cliente_id: string;
          etapa: Etapa;
          proxima_accion?: string | null;
          proxima_accion_fecha?: string | null;
          notas?: string | null;
          link_cotizacion?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cliente_id?: string;
          etapa?: Etapa;
          proxima_accion?: string | null;
          proxima_accion_fecha?: string | null;
          notas?: string | null;
          link_cotizacion?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seguimientos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      cotizaciones: {
        Row: {
          id: string;
          user_id: string;
          cliente_id: string;
          productos: ProductoItem[];
          monto_total: number;
          token_publico: string;
          estado: EstadoCotizacion;
          vista_en: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          cliente_id: string;
          productos?: ProductoItem[];
          monto_total?: number;
          token_publico?: string;
          estado?: EstadoCotizacion;
          vista_en?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cliente_id?: string;
          productos?: ProductoItem[];
          monto_total?: number;
          token_publico?: string;
          estado?: EstadoCotizacion;
          vista_en?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cotizaciones_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      pedidos: {
        Row: {
          id: string;
          user_id: string;
          cliente_id: string;
          cotizacion_id: string | null;
          foto_url: string;
          monto: number;
          fecha_compra: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          cliente_id: string;
          cotizacion_id?: string | null;
          foto_url: string;
          monto: number;
          fecha_compra?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cliente_id?: string;
          cotizacion_id?: string | null;
          foto_url?: string;
          monto?: number;
          fecha_compra?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_cotizacion_id_fkey";
            columns: ["cotizacion_id"];
            isOneToOne: false;
            referencedRelation: "cotizaciones";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_agente: {
        Row: {
          id: string;
          user_id: string;
          cliente_id: string | null;
          rol: RolChat;
          mensaje: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          cliente_id?: string | null;
          rol: RolChat;
          mensaje: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cliente_id?: string | null;
          rol?: RolChat;
          mensaje?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_agente_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      info_negocio: {
        Row: {
          id: string;
          user_id: string;
          contenido: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          contenido?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contenido?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      clientes_con_etapa: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          telefono_whatsapp: string | null;
          email: string | null;
          origen: Origen;
          referido_por_id: string | null;
          created_at: string;
          ultimo_seguimiento_id: string | null;
          etapa: Etapa | null;
          proxima_accion: string | null;
          proxima_accion_fecha: string | null;
          ultima_nota: string | null;
          etapa_actualizada_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type Seguimiento = Database["public"]["Tables"]["seguimientos"]["Row"];
export type Cotizacion = Database["public"]["Tables"]["cotizaciones"]["Row"];
export type Pedido = Database["public"]["Tables"]["pedidos"]["Row"];
export type ClienteConEtapa =
  Database["public"]["Views"]["clientes_con_etapa"]["Row"];
export type MensajeChat = Database["public"]["Tables"]["chat_agente"]["Row"];
export type InfoNegocio = Database["public"]["Tables"]["info_negocio"]["Row"];
