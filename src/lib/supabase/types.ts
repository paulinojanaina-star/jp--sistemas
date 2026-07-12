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
      employees: {
        Row: {
          birth_date: string | null
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          birth_date?: string | null
          category: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          birth_date?: string | null
          category?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          batch_number: string | null
          created_at: string | null
          document_url: string | null
          edit_justification: string | null
          expiry_date: string | null
          health_unit_name: string
          id: string
          item_id: string
          manufacturing_date: string | null
          observations: string | null
          quantity: number
          responsible_id: string
          special_reason: string | null
          type: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          document_url?: string | null
          edit_justification?: string | null
          expiry_date?: string | null
          health_unit_name: string
          id?: string
          item_id: string
          manufacturing_date?: string | null
          observations?: string | null
          quantity: number
          responsible_id: string
          special_reason?: string | null
          type: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          document_url?: string | null
          edit_justification?: string | null
          expiry_date?: string | null
          health_unit_name?: string
          id?: string
          item_id?: string
          manufacturing_date?: string | null
          observations?: string | null
          quantity?: number
          responsible_id?: string
          special_reason?: string | null
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
          created_at: string | null
          current_quantity: number | null
          description: string | null
          id: string
          min_quantity: number | null
          name: string
          supplier: string | null
          unit_price: number | null
          unit_type: string | null
        }
        Insert: {
          created_at?: string | null
          current_quantity?: number | null
          description?: string | null
          id?: string
          min_quantity?: number | null
          name: string
          supplier?: string | null
          unit_price?: number | null
          unit_type?: string | null
        }
        Update: {
          created_at?: string | null
          current_quantity?: number | null
          description?: string | null
          id?: string
          min_quantity?: number | null
          name?: string
          supplier?: string | null
          unit_price?: number | null
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
      notifications: {
        Row: {
          created_at: string | null
          id: string
          item_id: string | null
          message: string
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          message: string
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
        ]
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
      system_holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name: string
          type?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      time_off_requests: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          notes: string | null
          start_date: string
          type: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          notes?: string | null
          start_date: string
          type: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          notes?: string | null
          start_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'time_off_requests_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      merge_items: {
        Args: { destination_item_id: string; source_item_id: string }
        Returns: undefined
      }
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
