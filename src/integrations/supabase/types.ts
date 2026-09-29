export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string;
          admin_id: string;
          created_at: string;
          id: string;
          metadata: Json;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action: string;
          admin_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action?: string;
          admin_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          is_public: boolean;
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          is_public?: boolean;
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          is_public?: boolean;
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      content_pages: {
        Row: {
          body: Json;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          body?: Json;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: Json;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deposits: {
        Row: {
          amount: number;
          created_at: string;
          external_txn_id: string | null;
          id: string;
          payment_method: string;
          plan_id: string | null;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          screenshot_path: string | null;
          status: Database["public"]["Enums"]["deposit_status"];
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          external_txn_id?: string | null;
          id?: string;
          payment_method?: string;
          plan_id?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          screenshot_path?: string | null;
          status?: Database["public"]["Enums"]["deposit_status"];
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          external_txn_id?: string | null;
          id?: string;
          payment_method?: string;
          plan_id?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          screenshot_path?: string | null;
          status?: Database["public"]["Enums"]["deposit_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deposits_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "investment_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deposits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      investment_plans: {
        Row: {
          created_at: string;
          currency: string;
          daily_earning: number;
          description: string;
          disclosure: string;
          display_order: number;
          duration_days: number;
          featured: boolean;
          fees: number;
          id: string;
          investment_amount: number;
          max_investment: number;
          min_investment: number;
          name: string;
          return_type: string;
          risk_level: string;
          slug: string;
          status: string;
          terms: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          daily_earning: number;
          description?: string;
          disclosure?: string;
          display_order?: number;
          duration_days?: number;
          featured?: boolean;
          fees?: number;
          id?: string;
          investment_amount: number;
          max_investment: number;
          min_investment: number;
          name: string;
          return_type?: string;
          risk_level?: string;
          slug: string;
          status?: string;
          terms?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          daily_earning?: number;
          description?: string;
          disclosure?: string;
          display_order?: number;
          duration_days?: number;
          featured?: boolean;
          fees?: number;
          id?: string;
          investment_amount?: number;
          max_investment?: number;
          min_investment?: number;
          name?: string;
          return_type?: string;
          risk_level?: string;
          slug?: string;
          status?: string;
          terms?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investments: {
        Row: {
          amount: number;
          created_at: string;
          daily_earning: number;
          duration_days: number;
          end_date: string | null;
          fees: number;
          id: string;
          plan_id: string;
          plan_name: string;
          start_date: string | null;
          status: Database["public"]["Enums"]["investment_status"];
          terms_snapshot: Json;
          total_earned: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          daily_earning: number;
          duration_days: number;
          end_date?: string | null;
          fees?: number;
          id?: string;
          plan_id: string;
          plan_name: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["investment_status"];
          terms_snapshot?: Json;
          total_earned?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          daily_earning?: number;
          duration_days?: number;
          end_date?: string | null;
          fees?: number;
          id?: string;
          plan_id?: string;
          plan_name?: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["investment_status"];
          terms_snapshot?: Json;
          total_earned?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investments_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "investment_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          link: string | null;
          message: string;
          read: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          link?: string | null;
          message: string;
          read?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          link?: string | null;
          message?: string;
          read?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          phone: string | null;
          referral_code: string;
          referred_by: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id: string;
          phone?: string | null;
          referral_code: string;
          referred_by?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          referral_code?: string;
          referred_by?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey";
            columns: ["referred_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_commissions: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          investment_id: string | null;
          referred_id: string;
          referrer_id: string;
          status: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          investment_id?: string | null;
          referred_id: string;
          referrer_id: string;
          status?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          investment_id?: string | null;
          referred_id?: string;
          referrer_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referral_commissions_investment_id_fkey";
            columns: ["investment_id"];
            isOneToOne: false;
            referencedRelation: "investments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referral_commissions_referred_id_fkey";
            columns: ["referred_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referral_commissions_referrer_id_fkey";
            columns: ["referrer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      support_messages: {
        Row: {
          created_at: string;
          id: string;
          is_admin: boolean;
          message: string;
          sender_id: string;
          ticket_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_admin?: boolean;
          message: string;
          sender_id: string;
          ticket_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_admin?: boolean;
          message?: string;
          sender_id?: string;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "support_tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          status: Database["public"]["Enums"]["ticket_status"];
          subject: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          subject: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          subject?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          description: string;
          id: string;
          reference: string;
          related_id: string | null;
          status: Database["public"]["Enums"]["txn_status"];
          type: Database["public"]["Enums"]["txn_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          description?: string;
          id?: string;
          reference?: string;
          related_id?: string | null;
          status?: Database["public"]["Enums"]["txn_status"];
          type: Database["public"]["Enums"]["txn_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          description?: string;
          id?: string;
          reference?: string;
          related_id?: string | null;
          status?: Database["public"]["Enums"]["txn_status"];
          type?: Database["public"]["Enums"]["txn_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          available: number;
          invested: number;
          pending: number;
          total_earnings: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          available?: number;
          invested?: number;
          pending?: number;
          total_earnings?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          available?: number;
          invested?: number;
          pending?: number;
          total_earnings?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      withdrawals: {
        Row: {
          account_number: string;
          account_title: string;
          amount: number;
          bank_name: string | null;
          created_at: string;
          fee: number;
          iban: string | null;
          id: string;
          method: string;
          net_amount: number;
          paid_at: string | null;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["withdrawal_status"];
          user_id: string;
        };
        Insert: {
          account_number: string;
          account_title: string;
          amount: number;
          bank_name?: string | null;
          created_at?: string;
          fee?: number;
          iban?: string | null;
          id?: string;
          method: string;
          net_amount: number;
          paid_at?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["withdrawal_status"];
          user_id: string;
        };
        Update: {
          account_number?: string;
          account_title?: string;
          amount?: number;
          bank_name?: string | null;
          created_at?: string;
          fee?: number;
          iban?: string | null;
          id?: string;
          method?: string;
          net_amount?: number;
          paid_at?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["withdrawal_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      fn_adjust_balance: {
        Args: {
          p_admin: string;
          p_amount: number;
          p_direction: string;
          p_reason: string;
          p_user: string;
        };
        Returns: undefined;
      };
      fn_approve_deposit: {
        Args: { p_admin: string; p_deposit: string };
        Returns: undefined;
      };
      fn_create_investment: {
        Args: { p_plan_id: string; p_user: string };
        Returns: string;
      };
      fn_notify: {
        Args: {
          p_link?: string;
          p_message: string;
          p_title: string;
          p_user: string;
        };
        Returns: undefined;
      };
      fn_reject_deposit: {
        Args: { p_admin: string; p_deposit: string; p_reason: string };
        Returns: undefined;
      };
      fn_set_withdrawal_status: {
        Args: {
          p_admin: string;
          p_id: string;
          p_reason?: string;
          p_status: Database["public"]["Enums"]["withdrawal_status"];
        };
        Returns: undefined;
      };
      fn_submit_withdrawal: {
        Args: {
          p_amount: number;
          p_bank: string;
          p_iban: string;
          p_method: string;
          p_number: string;
          p_title: string;
          p_user: string;
        };
        Returns: string;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "super_admin" | "finance_admin" | "operations_admin" | "support_admin";
      deposit_status: "submitted" | "pending_verification" | "approved" | "rejected";
      investment_status: "pending" | "active" | "completed" | "cancelled";
      ticket_status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
      txn_status: "pending" | "processing" | "completed" | "rejected" | "cancelled";
      txn_type:
        | "deposit"
        | "withdrawal"
        | "investment"
        | "return"
        | "referral_commission"
        | "fee"
        | "adjustment";
      withdrawal_status: "pending" | "under_review" | "approved" | "paid" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "finance_admin", "operations_admin", "support_admin"],
      deposit_status: ["submitted", "pending_verification", "approved", "rejected"],
      investment_status: ["pending", "active", "completed", "cancelled"],
      ticket_status: ["open", "in_progress", "waiting_user", "resolved", "closed"],
      txn_status: ["pending", "processing", "completed", "rejected", "cancelled"],
      txn_type: [
        "deposit",
        "withdrawal",
        "investment",
        "return",
        "referral_commission",
        "fee",
        "adjustment",
      ],
      withdrawal_status: ["pending", "under_review", "approved", "paid", "rejected"],
    },
  },
} as const;
