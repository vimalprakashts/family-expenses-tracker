export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_fields: string[] | null
          created_at: string
          entity_id: string
          entity_type: string
          family_id: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_fields?: string[] | null
          created_at?: string
          entity_id: string
          entity_type: string
          family_id?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          changed_fields?: string[] | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          family_id?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_number: string
          account_number_masked: string | null
          account_type: Database["public"]["Enums"]["account_type"] | null
          balance: number | null
          bank_name: string
          branch: string | null
          color: string | null
          created_at: string
          created_by: string
          family_id: string
          id: string
          ifsc_code: string | null
          is_active: boolean | null
          is_primary: boolean | null
          linked_debit_card: string | null
          min_balance: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          account_number: string
          account_number_masked?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          balance?: number | null
          bank_name: string
          branch?: string | null
          color?: string | null
          created_at?: string
          created_by: string
          family_id: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          linked_debit_card?: string | null
          min_balance?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          account_number?: string
          account_number_masked?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          balance?: number | null
          bank_name?: string
          branch?: string | null
          color?: string | null
          created_at?: string
          created_by?: string
          family_id?: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          linked_debit_card?: string | null
          min_balance?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_bills: {
        Row: {
          bill_amount: number
          billing_date: string
          created_at: string
          created_by: string
          credit_card_id: string
          due_date: string
          family_id: string
          id: string
          min_due: number | null
          month: number
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
          updated_by: string | null
          year: number
        }
        Insert: {
          bill_amount: number
          billing_date: string
          created_at?: string
          created_by: string
          credit_card_id: string
          due_date: string
          family_id: string
          id?: string
          min_due?: number | null
          month: number
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          year: number
        }
        Update: {
          bill_amount?: number
          billing_date?: string
          created_at?: string
          created_by?: string
          credit_card_id?: string
          due_date?: string
          family_id?: string
          id?: string
          min_due?: number | null
          month?: number
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_bills_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_bills_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_bills_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_bills_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          available_limit: number | null
          bank_name: string
          billing_date: number | null
          card_name: string
          card_number_masked: string | null
          created_at: string
          created_by: string
          credit_limit: number
          due_date: number | null
          family_id: string
          id: string
          interest_rate: number | null
          is_active: boolean | null
          min_due: number | null
          outstanding: number | null
          reward_points: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          available_limit?: number | null
          bank_name: string
          billing_date?: number | null
          card_name: string
          card_number_masked?: string | null
          created_at?: string
          created_by: string
          credit_limit: number
          due_date?: number | null
          family_id: string
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          min_due?: number | null
          outstanding?: number | null
          reward_points?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          available_limit?: number | null
          bank_name?: string
          billing_date?: number | null
          card_name?: string
          card_number_masked?: string | null
          created_at?: string
          created_by?: string
          credit_limit?: number
          due_date?: number | null
          family_id?: string
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          min_due?: number | null
          outstanding?: number | null
          reward_points?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_cards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_cards_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"] | null
          created_at: string
          created_by: string
          description: string | null
          family_id: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          linked_id: string | null
          linked_type: string | null
          name: string
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"] | null
          created_at?: string
          created_by: string
          description?: string | null
          family_id: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          linked_id?: string | null
          linked_type?: string | null
          name: string
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"] | null
          created_at?: string
          created_by?: string
          description?: string | null
          family_id?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          linked_id?: string | null
          linked_type?: string | null
          name?: string
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          created_by: string
          display_order: number | null
          family_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_linked: boolean | null
          is_recurring: boolean | null
          linked_id: string | null
          linked_type: string | null
          name: string
          planned_amount: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          display_order?: number | null
          family_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_linked?: boolean | null
          is_recurring?: boolean | null
          linked_id?: string | null
          linked_type?: string | null
          name: string
          planned_amount: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          display_order?: number | null
          family_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_linked?: boolean | null
          is_recurring?: boolean | null
          linked_id?: string | null
          linked_type?: string | null
          name?: string
          planned_amount?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_records: {
        Row: {
          category_id: string
          created_at: string
          created_by: string
          family_id: string
          id: string
          month: number
          planned_amount: number | null
          spent_amount: number | null
          status: Database["public"]["Enums"]["expense_status"] | null
          updated_at: string | null
          updated_by: string | null
          year: number
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by: string
          family_id: string
          id?: string
          month: number
          planned_amount?: number | null
          spent_amount?: number | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          year: number
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string
          family_id?: string
          id?: string
          month?: number
          planned_amount?: number | null
          spent_amount?: number | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_records_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_records_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          created_by: string
          currency: string | null
          fy_start_month: number | null
          id: string
          name: string
          owner_id: string | null
          timezone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string | null
          fy_start_month?: number | null
          id?: string
          name: string
          owner_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string | null
          fy_start_month?: number | null
          id?: string
          name?: string
          owner_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          family_id: string
          id: string
          invitation_token: string | null
          invited_by: string
          relationship: string | null
          role: Database["public"]["Enums"]["family_role"] | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          family_id: string
          id?: string
          invitation_token?: string | null
          invited_by: string
          relationship?: string | null
          role?: Database["public"]["Enums"]["family_role"] | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          family_id?: string
          id?: string
          invitation_token?: string | null
          invited_by?: string
          relationship?: string | null
          role?: Database["public"]["Enums"]["family_role"] | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          created_by: string
          family_id: string
          id: string
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          relationship: string | null
          role: Database["public"]["Enums"]["family_role"] | null
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          family_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          relationship?: string | null
          role?: Database["public"]["Enums"]["family_role"] | null
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          family_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          relationship?: string | null
          role?: Database["public"]["Enums"]["family_role"] | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      income_records: {
        Row: {
          created_at: string
          created_by: string
          expected_amount: number | null
          family_id: string
          id: string
          month: number
          received_amount: number | null
          source_id: string
          status: Database["public"]["Enums"]["income_status"] | null
          updated_at: string | null
          updated_by: string | null
          year: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expected_amount?: number | null
          family_id: string
          id?: string
          month: number
          received_amount?: number | null
          source_id: string
          status?: Database["public"]["Enums"]["income_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expected_amount?: number | null
          family_id?: string
          id?: string
          month?: number
          received_amount?: number | null
          source_id?: string
          status?: Database["public"]["Enums"]["income_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "income_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_records_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "income_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      income_sources: {
        Row: {
          created_at: string
          created_by: string
          display_order: number | null
          expected_amount: number
          family_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          display_order?: number | null
          expected_amount: number
          family_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          display_order?: number | null
          expected_amount?: number
          family_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_sources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_sources_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_sources_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance: {
        Row: {
          coverage: number
          created_at: string
          created_by: string
          expiry_date: string | null
          family_id: string
          frequency: Database["public"]["Enums"]["payment_frequency"] | null
          id: string
          insured_name: string | null
          linked_schedule_id: string | null
          maturity_date: string | null
          next_due_date: string | null
          nominees: Json | null
          policy_name: string | null
          policy_number: string
          premium: number
          premium_day: number | null
          provider: string
          start_date: string
          status: Database["public"]["Enums"]["insurance_status"] | null
          type: Database["public"]["Enums"]["insurance_type"]
          updated_at: string | null
          updated_by: string | null
          vehicle_number: string | null
        }
        Insert: {
          coverage: number
          created_at?: string
          created_by: string
          expiry_date?: string | null
          family_id: string
          frequency?: Database["public"]["Enums"]["payment_frequency"] | null
          id?: string
          insured_name?: string | null
          linked_schedule_id?: string | null
          maturity_date?: string | null
          next_due_date?: string | null
          nominees?: Json | null
          policy_name?: string | null
          policy_number: string
          premium: number
          premium_day?: number | null
          provider: string
          start_date: string
          status?: Database["public"]["Enums"]["insurance_status"] | null
          type: Database["public"]["Enums"]["insurance_type"]
          updated_at?: string | null
          updated_by?: string | null
          vehicle_number?: string | null
        }
        Update: {
          coverage?: number
          created_at?: string
          created_by?: string
          expiry_date?: string | null
          family_id?: string
          frequency?: Database["public"]["Enums"]["payment_frequency"] | null
          id?: string
          insured_name?: string | null
          linked_schedule_id?: string | null
          maturity_date?: string | null
          next_due_date?: string | null
          nominees?: Json | null
          policy_name?: string | null
          policy_number?: string
          premium?: number
          premium_day?: number | null
          provider?: string
          start_date?: string
          status?: Database["public"]["Enums"]["insurance_status"] | null
          type?: Database["public"]["Enums"]["insurance_type"]
          updated_at?: string | null
          updated_by?: string | null
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_linked_schedule_id_fkey"
            columns: ["linked_schedule_id"]
            isOneToOne: false
            referencedRelation: "scheduled_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          amc_name: string | null
          chit_value: number | null
          created_at: string
          created_by: string
          current_value: number | null
          family_id: string
          folio_number: string | null
          id: string
          interest_rate: number | null
          invested_amount: number
          linked_schedule_id: string | null
          maturity_date: string | null
          name: string
          organizer: string | null
          returns_percent: number | null
          sip_amount: number | null
          sip_date: number | null
          start_date: string
          status: Database["public"]["Enums"]["investment_status"] | null
          type: Database["public"]["Enums"]["investment_type"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amc_name?: string | null
          chit_value?: number | null
          created_at?: string
          created_by: string
          current_value?: number | null
          family_id: string
          folio_number?: string | null
          id?: string
          interest_rate?: number | null
          invested_amount: number
          linked_schedule_id?: string | null
          maturity_date?: string | null
          name: string
          organizer?: string | null
          returns_percent?: number | null
          sip_amount?: number | null
          sip_date?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["investment_status"] | null
          type: Database["public"]["Enums"]["investment_type"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amc_name?: string | null
          chit_value?: number | null
          created_at?: string
          created_by?: string
          current_value?: number | null
          family_id?: string
          folio_number?: string | null
          id?: string
          interest_rate?: number | null
          invested_amount?: number
          linked_schedule_id?: string | null
          maturity_date?: string | null
          name?: string
          organizer?: string | null
          returns_percent?: number | null
          sip_amount?: number | null
          sip_date?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["investment_status"] | null
          type?: Database["public"]["Enums"]["investment_type"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_linked_schedule_id_fkey"
            columns: ["linked_schedule_id"]
            isOneToOne: false
            referencedRelation: "scheduled_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lending_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          id: string
          lending_id: string
          notes: string | null
          outstanding_after: number | null
          payment_date: string
          transaction_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          id?: string
          lending_id: string
          notes?: string | null
          outstanding_after?: number | null
          payment_date: string
          transaction_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          id?: string
          lending_id?: string
          notes?: string | null
          outstanding_after?: number | null
          payment_date?: string
          transaction_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lending_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lending_payments_lending_id_fkey"
            columns: ["lending_id"]
            isOneToOne: false
            referencedRelation: "personal_lending"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lending_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lending_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          id: string
          interest_paid: number | null
          is_prepayment: boolean | null
          loan_id: string
          outstanding_after: number | null
          payment_date: string
          principal_paid: number | null
          transaction_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          id?: string
          interest_paid?: number | null
          is_prepayment?: boolean | null
          loan_id: string
          outstanding_after?: number | null
          payment_date: string
          principal_paid?: number | null
          transaction_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          id?: string
          interest_paid?: number | null
          is_prepayment?: boolean | null
          loan_id?: string
          outstanding_after?: number | null
          payment_date?: string
          principal_paid?: number | null
          transaction_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          account_number: string | null
          collateral: string | null
          created_at: string
          created_by: string
          emi: number
          emi_day: number | null
          end_date: string | null
          family_id: string
          id: string
          interest_rate: number
          lender: string
          linked_expense_id: string | null
          linked_schedule_id: string | null
          months_paid: number | null
          next_emi_date: string | null
          outstanding: number
          principal: number
          start_date: string
          status: Database["public"]["Enums"]["loan_status"] | null
          tenure_months: number
          type: Database["public"]["Enums"]["loan_type"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          account_number?: string | null
          collateral?: string | null
          created_at?: string
          created_by: string
          emi: number
          emi_day?: number | null
          end_date?: string | null
          family_id: string
          id?: string
          interest_rate: number
          lender: string
          linked_expense_id?: string | null
          linked_schedule_id?: string | null
          months_paid?: number | null
          next_emi_date?: string | null
          outstanding: number
          principal: number
          start_date: string
          status?: Database["public"]["Enums"]["loan_status"] | null
          tenure_months: number
          type: Database["public"]["Enums"]["loan_type"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          account_number?: string | null
          collateral?: string | null
          created_at?: string
          created_by?: string
          emi?: number
          emi_day?: number | null
          end_date?: string | null
          family_id?: string
          id?: string
          interest_rate?: number
          lender?: string
          linked_expense_id?: string | null
          linked_schedule_id?: string | null
          months_paid?: number | null
          next_emi_date?: string | null
          outstanding?: number
          principal?: number
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"] | null
          tenure_months?: number
          type?: Database["public"]["Enums"]["loan_type"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_linked_expense_id_fkey"
            columns: ["linked_expense_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_linked_schedule_id_fkey"
            columns: ["linked_schedule_id"]
            isOneToOne: false
            referencedRelation: "scheduled_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          amount: number | null
          created_at: string
          created_by: string
          family_id: string
          id: string
          is_read: boolean | null
          linked_id: string | null
          linked_type: string | null
          message: string
          priority: Database["public"]["Enums"]["notification_priority"] | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          amount?: number | null
          created_at?: string
          created_by: string
          family_id: string
          id?: string
          is_read?: boolean | null
          linked_id?: string | null
          linked_type?: string | null
          message: string
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          amount?: number | null
          created_at?: string
          created_by?: string
          family_id?: string
          id?: string
          is_read?: boolean | null
          linked_id?: string | null
          linked_type?: string | null
          message?: string
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_lending: {
        Row: {
          created_at: string
          created_by: string
          date: string
          expected_return: string | null
          family_id: string
          id: string
          interest_rate: number | null
          notes: string | null
          original_amount: number
          outstanding: number
          person_contact: string | null
          person_name: string
          person_relation: string | null
          purpose: string | null
          status: Database["public"]["Enums"]["lending_status"] | null
          type: Database["public"]["Enums"]["lending_type"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          expected_return?: string | null
          family_id: string
          id?: string
          interest_rate?: number | null
          notes?: string | null
          original_amount: number
          outstanding: number
          person_contact?: string | null
          person_name: string
          person_relation?: string | null
          purpose?: string | null
          status?: Database["public"]["Enums"]["lending_status"] | null
          type: Database["public"]["Enums"]["lending_type"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          expected_return?: string | null
          family_id?: string
          id?: string
          interest_rate?: number | null
          notes?: string | null
          original_amount?: number
          outstanding?: number
          person_contact?: string | null
          person_name?: string
          person_relation?: string | null
          purpose?: string | null
          status?: Database["public"]["Enums"]["lending_status"] | null
          type?: Database["public"]["Enums"]["lending_type"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_lending_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_lending_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_lending_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_instances: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          due_date: string
          family_id: string
          id: string
          month: number
          paid_amount: number | null
          paid_date: string | null
          schedule_id: string
          status: Database["public"]["Enums"]["schedule_status"] | null
          transaction_id: string | null
          updated_at: string | null
          updated_by: string | null
          year: number
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          due_date: string
          family_id: string
          id?: string
          month: number
          paid_amount?: number | null
          paid_date?: string | null
          schedule_id: string
          status?: Database["public"]["Enums"]["schedule_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          year: number
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          due_date?: string
          family_id?: string
          id?: string
          month?: number
          paid_amount?: number | null
          paid_date?: string | null
          schedule_id?: string
          status?: Database["public"]["Enums"]["schedule_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_scheduled_instances_transaction"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_instances_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_instances_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "scheduled_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_instances_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_payments: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["schedule_category"] | null
          created_at: string
          created_by: string
          default_account_id: string | null
          default_payment_mode: string | null
          due_day: number | null
          due_months: number[] | null
          end_date: string | null
          family_id: string
          frequency: Database["public"]["Enums"]["payment_frequency"] | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_auto_linked: boolean | null
          is_variable: boolean | null
          linked_id: string | null
          linked_type: string | null
          name: string
          notes: string | null
          reminders: number[] | null
          start_date: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["schedule_category"] | null
          created_at?: string
          created_by: string
          default_account_id?: string | null
          default_payment_mode?: string | null
          due_day?: number | null
          due_months?: number[] | null
          end_date?: string | null
          family_id: string
          frequency?: Database["public"]["Enums"]["payment_frequency"] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_auto_linked?: boolean | null
          is_variable?: boolean | null
          linked_id?: string | null
          linked_type?: string | null
          name: string
          notes?: string | null
          reminders?: number[] | null
          start_date: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["schedule_category"] | null
          created_at?: string
          created_by?: string
          default_account_id?: string | null
          default_payment_mode?: string | null
          due_day?: number | null
          due_months?: number[] | null
          end_date?: string | null
          family_id?: string
          frequency?: Database["public"]["Enums"]["payment_frequency"] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_auto_linked?: boolean | null
          is_variable?: boolean | null
          linked_id?: string | null
          linked_type?: string | null
          name?: string
          notes?: string | null
          reminders?: number[] | null
          start_date?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_payments_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_payments_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          created_by: string
          date: string
          description: string | null
          expense_record_id: string | null
          family_id: string
          id: string
          income_record_id: string | null
          is_unplanned: boolean | null
          notes: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode"] | null
          receipt_url: string | null
          scheduled_instance_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          unplanned_category: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          expense_record_id?: string | null
          family_id: string
          id?: string
          income_record_id?: string | null
          is_unplanned?: boolean | null
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"] | null
          receipt_url?: string | null
          scheduled_instance_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          unplanned_category?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          expense_record_id?: string | null
          family_id?: string
          id?: string
          income_record_id?: string | null
          is_unplanned?: boolean | null
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"] | null
          receipt_url?: string | null
          scheduled_instance_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          unplanned_category?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_expense_record_id_fkey"
            columns: ["expense_record_id"]
            isOneToOne: false
            referencedRelation: "expense_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_income_record_id_fkey"
            columns: ["income_record_id"]
            isOneToOne: false
            referencedRelation: "income_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_scheduled_instance_id_fkey"
            columns: ["scheduled_instance_id"]
            isOneToOne: false
            referencedRelation: "scheduled_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_email_verified: boolean | null
          is_mobile_verified: boolean | null
          last_login: string | null
          mobile: string | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_email_verified?: boolean | null
          is_mobile_verified?: boolean | null
          last_login?: string | null
          mobile?: string | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_email_verified?: boolean | null
          is_mobile_verified?: boolean | null
          last_login?: string | null
          mobile?: string | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_family_for_user: {
        Args: { p_family_name: string; p_user_id: string }
        Returns: {
          family_id: string
          family_name: string
          member_id: string
        }[]
      }
      get_current_user_id: { Args: never; Returns: string }
      get_user_family_ids:
        | { Args: never; Returns: string[] }
        | { Args: { user_uuid: string }; Returns: string[] }
      is_family_admin: { Args: { family_uuid: string }; Returns: boolean }
      is_family_member: { Args: { family_uuid: string }; Returns: boolean }
    }
    Enums: {
      account_type: "savings" | "current" | "salary" | "joint"
      audit_action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE"
      document_category:
        | "bank"
        | "tax"
        | "insurance"
        | "property"
        | "identity"
        | "other"
      expense_status: "under" | "on-budget" | "over"
      family_role: "admin" | "member" | "viewer"
      income_status: "pending" | "partial" | "received"
      insurance_status: "active" | "expired" | "surrendered"
      insurance_type:
        | "lic"
        | "term"
        | "health"
        | "vehicle"
        | "property"
        | "other"
      investment_status: "active" | "matured" | "closed"
      investment_type:
        | "mutual-fund"
        | "fd"
        | "rd"
        | "ppf"
        | "epf"
        | "gold"
        | "stocks"
        | "nps"
        | "other"
        | "ssy"
        | "chit_fund"
      lending_status: "pending" | "partial" | "overdue" | "settled"
      lending_type: "lent" | "borrowed"
      loan_status: "active" | "closed" | "prepaid"
      loan_type: "home" | "car" | "personal" | "gold" | "education" | "other"
      notification_priority: "low" | "medium" | "high"
      notification_type:
        | "emi"
        | "budget"
        | "card"
        | "insurance"
        | "reminder"
        | "system"
      payment_frequency:
        | "monthly"
        | "quarterly"
        | "half-yearly"
        | "yearly"
        | "custom"
      payment_mode: "cash" | "upi" | "card" | "bank" | "cheque"
      schedule_category:
        | "insurance"
        | "education"
        | "tax"
        | "maintenance"
        | "subscription"
        | "vehicle"
        | "other"
      schedule_status: "pending" | "paid" | "overdue"
      transaction_type: "income" | "expense" | "transfer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["savings", "current", "salary", "joint"],
      audit_action: ["CREATE", "UPDATE", "DELETE", "RESTORE"],
      document_category: [
        "bank",
        "tax",
        "insurance",
        "property",
        "identity",
        "other",
      ],
      expense_status: ["under", "on-budget", "over"],
      family_role: ["admin", "member", "viewer"],
      income_status: ["pending", "partial", "received"],
      insurance_status: ["active", "expired", "surrendered"],
      insurance_type: ["lic", "term", "health", "vehicle", "property", "other"],
      investment_status: ["active", "matured", "closed"],
      investment_type: [
        "mutual-fund",
        "fd",
        "rd",
        "ppf",
        "epf",
        "gold",
        "stocks",
        "nps",
        "other",
        "ssy",
        "chit_fund",
      ],
      lending_status: ["pending", "partial", "overdue", "settled"],
      lending_type: ["lent", "borrowed"],
      loan_status: ["active", "closed", "prepaid"],
      loan_type: ["home", "car", "personal", "gold", "education", "other"],
      notification_priority: ["low", "medium", "high"],
      notification_type: [
        "emi",
        "budget",
        "card",
        "insurance",
        "reminder",
        "system",
      ],
      payment_frequency: [
        "monthly",
        "quarterly",
        "half-yearly",
        "yearly",
        "custom",
      ],
      payment_mode: ["cash", "upi", "card", "bank", "cheque"],
      schedule_category: [
        "insurance",
        "education",
        "tax",
        "maintenance",
        "subscription",
        "vehicle",
        "other",
      ],
      schedule_status: ["pending", "paid", "overdue"],
      transaction_type: ["income", "expense", "transfer"],
    },
  },
} as const

