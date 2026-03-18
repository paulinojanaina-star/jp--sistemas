// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4'
  }
  public: {
    Tables: {
      inventory_movements: {
        Row: {
          created_at: string | null
          health_unit_name: string
          id: string
          item_id: string
          observations: string | null
          quantity: number
          responsible_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          health_unit_name: string
          id?: string
          item_id: string
          observations?: string | null
          quantity: number
          responsible_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          health_unit_name?: string
          id?: string
          item_id?: string
          observations?: string | null
          quantity?: number
          responsible_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_movements_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inventory_movements_responsible_id_fkey'
            columns: ['responsible_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      items: {
        Row: {
          category: string | null
          created_at: string | null
          current_quantity: number | null
          description: string | null
          id: string
          min_quantity: number | null
          name: string
          unit_type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_quantity?: number | null
          description?: string | null
          id?: string
          min_quantity?: number | null
          name: string
          unit_type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_quantity?: number | null
          description?: string | null
          id?: string
          min_quantity?: number | null
          name?: string
          unit_type?: string | null
        }
        Relationships: []
      }
      'Janaina Paulino': {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: Janaina Paulino
//   id: bigint (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: inventory_movements
//   id: uuid (not null, default: gen_random_uuid())
//   item_id: uuid (not null)
//   type: text (not null)
//   quantity: numeric (not null)
//   health_unit_name: text (not null)
//   responsible_id: uuid (not null)
//   observations: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: items
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   description: text (nullable)
//   category: text (nullable)
//   min_quantity: numeric (nullable, default: 0)
//   current_quantity: numeric (nullable, default: 0)
//   unit_type: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: profiles
//   id: uuid (not null)
//   email: text (not null)
//   full_name: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())

// --- CONSTRAINTS ---
// Table: Janaina Paulino
//   PRIMARY KEY Janaina Paulino_pkey: PRIMARY KEY (id)
// Table: inventory_movements
//   FOREIGN KEY inventory_movements_item_id_fkey: FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
//   PRIMARY KEY inventory_movements_pkey: PRIMARY KEY (id)
//   CHECK inventory_movements_quantity_check: CHECK ((quantity > (0)::numeric))
//   FOREIGN KEY inventory_movements_responsible_id_fkey: FOREIGN KEY (responsible_id) REFERENCES profiles(id)
//   CHECK inventory_movements_type_check: CHECK ((type = ANY (ARRAY['IN'::text, 'OUT'::text])))
// Table: items
//   PRIMARY KEY items_pkey: PRIMARY KEY (id)
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: inventory_movements
//   Policy "authenticated_insert_movements" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_movements" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: items
//   Policy "authenticated_delete_items" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_insert_items" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_select_items" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update_items" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: profiles
//   Policy "authenticated_select_profiles" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true

// --- WARNING: TABLES WITH RLS ENABLED BUT NO POLICIES ---
// These tables have Row Level Security enabled but NO policies defined.
// This means ALL queries (SELECT, INSERT, UPDATE, DELETE) will return ZERO rows
// for non-superuser roles (including the anon and authenticated roles used by the app).
// You MUST create RLS policies for these tables to allow data access.
//   - Janaina Paulino

// --- DATABASE FUNCTIONS ---
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.profiles (id, email, full_name)
//     VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION process_inventory_movement()
//   CREATE OR REPLACE FUNCTION public.process_inventory_movement()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     current_qty NUMERIC;
//   BEGIN
//     -- Get current quantity
//     SELECT current_quantity INTO current_qty FROM public.items WHERE id = NEW.item_id FOR UPDATE;
//
//     IF NEW.type = 'OUT' THEN
//       IF current_qty - NEW.quantity < 0 THEN
//         RAISE EXCEPTION 'Estoque insuficiente para esta saída. Quantidade atual: %', current_qty;
//       END IF;
//       UPDATE public.items SET current_quantity = current_quantity - NEW.quantity WHERE id = NEW.item_id;
//     ELSIF NEW.type = 'IN' THEN
//       UPDATE public.items SET current_quantity = current_quantity + NEW.quantity WHERE id = NEW.item_id;
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: inventory_movements
//   trigger_process_movement: CREATE TRIGGER trigger_process_movement BEFORE INSERT ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION process_inventory_movement()
