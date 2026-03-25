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
      appointment_assets: {
        Row: {
          appointment_id: string
          asset_id: string
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          appointment_id: string
          asset_id: string
          end_time: string
          id?: string
          start_time: string
        }
        Update: {
          appointment_id?: string
          asset_id?: string
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_assets_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_files: {
        Row: {
          appointment_id: string
          created_at: string | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by_user_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by_user_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_files_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_files_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_products: {
        Row: {
          appointment_id: string
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          sold_by_staff_id: string | null
          unit_price_snapshot: number
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number
          sold_by_staff_id?: string | null
          unit_price_snapshot: number
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          sold_by_staff_id?: string | null
          unit_price_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointment_products_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_products_sold_by_staff_id_fkey"
            columns: ["sold_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_business"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_services: {
        Row: {
          appointment_id: string
          buffer_snapshot: number | null
          duration_snapshot: number
          id: string
          price_snapshot: number
          service_id: string
          staff_service_id: string | null
        }
        Insert: {
          appointment_id: string
          buffer_snapshot?: number | null
          duration_snapshot: number
          id?: string
          price_snapshot: number
          service_id: string
          staff_service_id?: string | null
        }
        Update: {
          appointment_id?: string
          buffer_snapshot?: number | null
          duration_snapshot?: number
          id?: string
          price_snapshot?: number
          service_id?: string
          staff_service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_staff_service_id_fkey"
            columns: ["staff_service_id"]
            isOneToOne: false
            referencedRelation: "staff_services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          business_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_note: string | null
          customer_user_id: string | null
          deleted_at: string | null
          end_time: string
          family_profile_id: string | null
          id: string
          metadata: Json | null
          service_id: string | null
          staff_business_id: string
          start_time: string
          status: string
          total_duration_minutes: number
          total_price: number
        }
        Insert: {
          appointment_date: string
          business_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_note?: string | null
          customer_user_id?: string | null
          deleted_at?: string | null
          end_time: string
          family_profile_id?: string | null
          id?: string
          metadata?: Json | null
          service_id?: string | null
          staff_business_id: string
          start_time: string
          status?: string
          total_duration_minutes?: number
          total_price?: number
        }
        Update: {
          appointment_date?: string
          business_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_note?: string | null
          customer_user_id?: string | null
          deleted_at?: string | null
          end_time?: string
          family_profile_id?: string | null
          id?: string
          metadata?: Json | null
          service_id?: string | null
          staff_business_id?: string
          start_time?: string
          status?: string
          total_duration_minutes?: number
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_family_profile_id_fkey"
            columns: ["family_profile_id"]
            isOneToOne: false
            referencedRelation: "family_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_business_id_fkey"
            columns: ["staff_business_id"]
            isOneToOne: false
            referencedRelation: "staff_business"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          action_type: string
          actor_role: string | null
          business_id: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action?: string | null
          action_type: string
          actor_role?: string | null
          business_id?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string | null
          action_type?: string
          actor_role?: string | null
          business_id?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      break_schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          label: string | null
          staff_business_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          label?: string | null
          staff_business_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          label?: string | null
          staff_business_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "break_schedules_staff_business_id_fkey"
            columns: ["staff_business_id"]
            isOneToOne: false
            referencedRelation: "staff_business"
            referencedColumns: ["id"]
          },
        ]
      }
      business_announcements: {
        Row: {
          business_id: string
          content: string | null
          created_at: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          priority: number | null
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          content?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          priority?: number | null
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          content?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          priority?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_announcements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_closed_dates: {
        Row: {
          business_id: string
          created_at: string | null
          date: string
          id: string
          reason: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          date: string
          id?: string
          reason?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          date?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_closed_dates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_customers: {
        Row: {
          business_id: string
          connected_at: string | null
          email: string | null
          first_name: string | null
          id: string
          internal_notes: string | null
          is_blocked: boolean | null
          is_vip: boolean | null
          last_name: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          business_id: string
          connected_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          internal_notes?: string | null
          is_blocked?: boolean | null
          is_vip?: boolean | null
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string
          connected_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          internal_notes?: string | null
          is_blocked?: boolean | null
          is_vip?: boolean | null
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      business_features: {
        Row: {
          business_id: string
          created_at: string | null
          feature_id: string
          id: string
          is_enabled: boolean | null
          settings: Json | null
          source: string
          valid_until: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          feature_id: string
          id?: string
          is_enabled?: boolean | null
          settings?: Json | null
          source?: string
          valid_until?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          feature_id?: string
          id?: string
          is_enabled?: boolean | null
          settings?: Json | null
          source?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_features_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          business_id: string
          close_time: string
          created_at: string | null
          day_of_week: number
          id: string
          is_open: boolean | null
          open_time: string
        }
        Insert: {
          business_id: string
          close_time: string
          created_at?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean | null
          open_time: string
        }
        Update: {
          business_id?: string
          close_time?: string
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean | null
          open_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_owners: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_owners_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_owners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      business_packages: {
        Row: {
          assigned_by: string
          billing_cycle: string
          business_id: string
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          package_id: string
          start_date: string
          status: string
        }
        Insert: {
          assigned_by: string
          billing_cycle?: string
          business_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          package_id: string
          start_date?: string
          status?: string
        }
        Update: {
          assigned_by?: string
          billing_cycle?: string
          business_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          package_id?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_packages_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_packages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          appointment_id: string | null
          business_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          business_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          business_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          auto_approve: boolean | null
          cancellation_buffer_minutes: number | null
          cancelled_at: string | null
          category: string | null
          contract_end: string | null
          contract_notes: string | null
          contract_start: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          invite_code: string | null
          is_active: boolean | null
          logo_url: string | null
          metadata: Json | null
          module_id: string
          name: string
          onboarding_status:
            | Database["public"]["Enums"]["onboarding_status_type"]
            | null
          package_id: string | null
          phone: string | null
          qr_code: string | null
          status: string
          suspended_at: string | null
          suspended_reason: string | null
        }
        Insert: {
          address?: string | null
          auto_approve?: boolean | null
          cancellation_buffer_minutes?: number | null
          cancelled_at?: string | null
          category?: string | null
          contract_end?: string | null
          contract_notes?: string | null
          contract_start?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          module_id: string
          name: string
          onboarding_status?:
            | Database["public"]["Enums"]["onboarding_status_type"]
            | null
          package_id?: string | null
          phone?: string | null
          qr_code?: string | null
          status?: string
          suspended_at?: string | null
          suspended_reason?: string | null
        }
        Update: {
          address?: string | null
          auto_approve?: boolean | null
          cancellation_buffer_minutes?: number | null
          cancelled_at?: string | null
          category?: string | null
          contract_end?: string | null
          contract_notes?: string | null
          contract_start?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          module_id?: string
          name?: string
          onboarding_status?:
            | Database["public"]["Enums"]["onboarding_status_type"]
            | null
          package_id?: string | null
          phone?: string | null
          qr_code?: string | null
          status?: string
          suspended_at?: string | null
          suspended_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          appointment_id: string | null
          business_id: string
          created_at: string | null
          customer_user_id: string
          id: string
          note: string
          staff_business_id: string
        }
        Insert: {
          appointment_id?: string | null
          business_id: string
          created_at?: string | null
          customer_user_id: string
          id?: string
          note: string
          staff_business_id: string
        }
        Update: {
          appointment_id?: string | null
          business_id?: string
          created_at?: string | null
          customer_user_id?: string
          id?: string
          note?: string
          staff_business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_staff_business_id_fkey"
            columns: ["staff_business_id"]
            isOneToOne: false
            referencedRelation: "staff_business"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_profiles: {
        Row: {
          birth_date: string | null
          created_at: string | null
          full_name: string
          gender: string | null
          id: string
          relationship: string | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          full_name: string
          gender?: string | null
          id?: string
          relationship?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          relationship?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          key: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          key: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          key?: string
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          business_id: string
          change_type: string
          created_at: string | null
          id: string
          new_stock: number
          notes: string | null
          previous_stock: number
          product_id: string
          quantity_changed: number
          recorded_by: string | null
        }
        Insert: {
          business_id: string
          change_type: string
          created_at?: string | null
          id?: string
          new_stock: number
          notes?: string | null
          previous_stock: number
          product_id: string
          quantity_changed: number
          recorded_by?: string | null
        }
        Update: {
          business_id?: string
          change_type?: string
          created_at?: string | null
          id?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          product_id?: string
          quantity_changed?: number
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          business_id: string | null
          created_at: string | null
          email: string
          expires_at: string
          full_name: string
          id: string
          invited_by: string
          phone: string | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          business_id?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          full_name: string
          id?: string
          invited_by: string
          phone?: string | null
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          invited_by?: string
          phone?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          reason: string | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          staff_business_id: string
          start_time: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          reason?: string | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_business_id: string
          start_time?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          reason?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_business_id?: string
          start_time?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_staff_business_id_fkey"
            columns: ["staff_business_id"]
            isOneToOne: false
            referencedRelation: "staff_business"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          color: string | null
          config: Json | null
          created_at: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_available_for_new_businesses: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_available_for_new_businesses?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_available_for_new_businesses?: boolean | null
          name?: string
        }
        Relationships: []
      }
      no_show_records: {
        Row: {
          appointment_id: string
          id: string
          marked_at: string | null
          marked_by_staff_business_id: string
        }
        Insert: {
          appointment_id: string
          id?: string
          marked_at?: string | null
          marked_by_staff_business_id: string
        }
        Update: {
          appointment_id?: string
          id?: string
          marked_at?: string | null
          marked_by_staff_business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "no_show_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "no_show_records_marked_by_staff_business_id_fkey"
            columns: ["marked_by_staff_business_id"]
            isOneToOne: false
            referencedRelation: "staff_business"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          business_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          related_id: string | null
          related_type: string | null
          sent_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      package_features: {
        Row: {
          created_at: string | null
          feature_id: string
          id: string
          package_id: string
        }
        Insert: {
          created_at?: string | null
          feature_id: string
          id?: string
          package_id: string
        }
        Update: {
          created_at?: string | null
          feature_id?: string
          id?: string
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_features_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_appointments_per_month: number | null
          max_services: number | null
          max_staff: number | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          sector_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_appointments_per_month?: number | null
          max_services?: number | null
          max_staff?: number | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          sector_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_appointments_per_month?: number | null
          max_services?: number | null
          max_staff?: number | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          sector_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          base_salary_amount: number
          business_id: string
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          product_commission_amount: number
          service_commission_amount: number
          staff_business_id: string
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          base_salary_amount?: number
          business_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          product_commission_amount?: number
          service_commission_amount?: number
          staff_business_id: string
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          base_salary_amount?: number
          business_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          product_commission_amount?: number
          service_commission_amount?: number
          staff_business_id?: string
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_staff_business_id_fkey"
            columns: ["staff_business_id"]
            isOneToOne: false
            referencedRelation: "staff_business"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          content: string
          created_at: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          starts_at: string | null
          target_role: string
          target_sector_id: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          target_role?: string
          target_sector_id?: string | null
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          target_role?: string
          target_sector_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_announcements_target_sector_id_fkey"
            columns: ["target_sector_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_announcements_target_sector_id_fkey"
            columns: ["target_sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_billing_profiles: {
        Row: {
          address: string
          billing_email: string | null
          business_id: string
          city: string | null
          company_name: string
          country: string | null
          id: string
          tax_number: string | null
          tax_office: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          billing_email?: string | null
          business_id: string
          city?: string | null
          company_name: string
          country?: string | null
          id?: string
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          billing_email?: string | null
          business_id?: string
          city?: string | null
          company_name?: string
          country?: string | null
          id?: string
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_billing_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number | null
          tax_amount: number
          tax_rate: number | null
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
          tax_amount: number
          tax_rate?: number | null
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          tax_amount?: number
          tax_rate?: number | null
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "platform_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_invoices: {
        Row: {
          billing_email: string | null
          business_id: string
          created_at: string | null
          id: string
          invoice_no: string
          pdf_url: string | null
          status: string | null
          total_amount: number
          transaction_id: string | null
        }
        Insert: {
          billing_email?: string | null
          business_id: string
          created_at?: string | null
          id?: string
          invoice_no: string
          pdf_url?: string | null
          status?: string | null
          total_amount: number
          transaction_id?: string | null
        }
        Update: {
          billing_email?: string | null
          business_id?: string
          created_at?: string | null
          id?: string
          invoice_no?: string
          pdf_url?: string | null
          status?: string | null
          total_amount?: number
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "platform_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_transactions: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          notes: string | null
          payment_provider: string | null
          provider_transaction_id: string | null
          status: string | null
          subscription_id: string | null
          subtotal: number | null
          tax_total: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_provider?: string | null
          provider_transaction_id?: string | null
          status?: string | null
          subscription_id?: string | null
          subtotal?: number | null
          tax_total?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_provider?: string | null
          provider_transaction_id?: string | null
          status?: string | null
          subscription_id?: string | null
          subtotal?: number | null
          tax_total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean
          min_stock_alert: number
          name: string
          purchase_price: number
          selling_price: number
          sku: string | null
          stock_quantity: number
          updated_at: string | null
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          min_stock_alert?: number
          name: string
          purchase_price?: number
          selling_price?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          min_stock_alert?: number
          name?: string
          purchase_price?: number
          selling_price?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_default_features: {
        Row: {
          created_at: string | null
          feature_id: string
          id: string
          sector_id: string
        }
        Insert: {
          created_at?: string | null
          feature_id: string
          id?: string
          sector_id: string
        }
        Update: {
          created_at?: string | null
          feature_id?: string
          id?: string
          sector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sector_default_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sector_default_features_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sector_default_features_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_default_services: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          price: number | null
          sector_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          price?: number | null
          sector_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          price?: number | null
          sector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sector_default_services_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sector_default_services_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_duration_minutes: number
          base_price: number
          buffer_time_minutes: number | null
          business_id: string
          category: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          base_duration_minutes?: number
          base_price?: number
          buffer_time_minutes?: number | null
          business_id: string
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          base_duration_minutes?: number
          base_price?: number
          buffer_time_minutes?: number | null
          business_id?: string
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_business: {
        Row: {
          business_id: string
          calendar_color: string | null
          can_set_own_duration: boolean | null
          can_set_own_price: boolean | null
          created_at: string | null
          deleted_at: string | null
          expertise_level: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          role: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          calendar_color?: string | null
          can_set_own_duration?: boolean | null
          can_set_own_price?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          expertise_level?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          role?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          calendar_color?: string | null
          can_set_own_duration?: boolean | null
          can_set_own_price?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          expertise_level?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_business_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_business_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_commissions: {
        Row: {
          base_salary: number
          created_at: string | null
          id: string
          product_commission_rate: number
          service_commission_rate: number
          staff_business_id: string
          updated_at: string | null
        }
        Insert: {
          base_salary?: number
          created_at?: string | null
          id?: string
          product_commission_rate?: number
          service_commission_rate?: number
          staff_business_id: string
          updated_at?: string | null
        }
        Update: {
          base_salary?: number
          created_at?: string | null
          id?: string
          product_commission_rate?: number
          service_commission_rate?: number
          staff_business_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_commissions_staff_business_id_fkey"
            columns: ["staff_business_id"]
            isOneToOne: true
            referencedRelation: "staff_business"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          business_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          invited_by: string
          phone: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_by: string
          phone: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_by?: string
          phone?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          custom_duration_minutes: number | null
          custom_price: number | null
          id: string
          is_active: boolean | null
          service_id: string
          staff_business_id: string
        }
        Insert: {
          custom_duration_minutes?: number | null
          custom_price?: number | null
          id?: string
          is_active?: boolean | null
          service_id: string
          staff_business_id: string
        }
        Update: {
          custom_duration_minutes?: number | null
          custom_price?: number | null
          id?: string
          is_active?: boolean | null
          service_id?: string
          staff_business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_business_id_fkey"
            columns: ["staff_business_id"]
            isOneToOne: false
            referencedRelation: "staff_business"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          business_id: string
          change_reason: string | null
          changed_at: string | null
          created_at: string | null
          id: string
          package_id: string
          period_end: string
          period_start: string
          status: string
        }
        Insert: {
          business_id: string
          change_reason?: string | null
          changed_at?: string | null
          created_at?: string | null
          id?: string
          package_id: string
          period_end?: string
          period_start: string
          status: string
        }
        Update: {
          business_id?: string
          change_reason?: string | null
          changed_at?: string | null
          created_at?: string | null
          id?: string
          package_id?: string
          period_end?: string
          period_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          contract_url: string | null
          created_at: string | null
          ends_at: string | null
          id: string
          next_billing_date: string | null
          package_id: string
          starts_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          contract_url?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          next_billing_date?: string | null
          package_id: string
          starts_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          contract_url?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          next_billing_date?: string | null
          package_id?: string
          starts_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          business_id: string
          category: string
          created_at: string | null
          description: string | null
          id: string
          payment_method: string
          recorded_by: string | null
          transaction_date: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          business_id: string
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method: string
          recorded_by?: string | null
          transaction_date?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          business_id?: string
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string
          recorded_by?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          commercial_consent: boolean | null
          commercial_consent_at: string | null
          created_at: string | null
          email: string | null
          global_role: string
          id: string
          is_active: boolean | null
          kvkk_consent: boolean
          kvkk_consent_at: string | null
          kvkk_consent_version: string | null
          name: string | null
          notification_settings: Json | null
          phone: string | null
          phone_verified_at: string | null
          provider_id: string | null
          role: string | null
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          commercial_consent?: boolean | null
          commercial_consent_at?: string | null
          created_at?: string | null
          email?: string | null
          global_role?: string
          id: string
          is_active?: boolean | null
          kvkk_consent?: boolean
          kvkk_consent_at?: string | null
          kvkk_consent_version?: string | null
          name?: string | null
          notification_settings?: Json | null
          phone?: string | null
          phone_verified_at?: string | null
          provider_id?: string | null
          role?: string | null
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          commercial_consent?: boolean | null
          commercial_consent_at?: string | null
          created_at?: string | null
          email?: string | null
          global_role?: string
          id?: string
          is_active?: boolean | null
          kvkk_consent?: boolean
          kvkk_consent_at?: string | null
          kvkk_consent_version?: string | null
          name?: string | null
          notification_settings?: Json | null
          phone?: string | null
          phone_verified_at?: string | null
          provider_id?: string | null
          role?: string | null
        }
        Relationships: []
      }
      work_schedule_templates: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_working: boolean | null
          staff_business_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_working?: boolean | null
          staff_business_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_working?: boolean | null
          staff_business_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedule_templates_staff_business_id_fkey"
            columns: ["staff_business_id"]
            isOneToOne: false
            referencedRelation: "staff_business"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      sectors: {
        Row: {
          color: string | null
          config: Json | null
          created_at: string | null
          description: string | null
          display_name: string | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          is_available_for_new_businesses: boolean | null
          name: string | null
        }
        Insert: {
          color?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          is_available_for_new_businesses?: boolean | null
          name?: string | null
        }
        Update: {
          color?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          is_available_for_new_businesses?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      anonymize_customer_data: {
        Args: {
          p_business_id: string
          p_customer_user_id: string
          p_reason?: string
        }
        Returns: Json
      }
      check_and_update_contract_expiry: { Args: never; Returns: number }
      check_business_limit: {
        Args: { p_business_id: string; p_feature_key: string }
        Returns: boolean
      }
      check_feature_access: {
        Args: { p_business_id: string; p_feature_key: string }
        Returns: boolean
      }
      create_business_v2: {
        Args: {
          p_address?: string
          p_module_id: string
          p_name: string
          p_phone?: string
        }
        Returns: string
      }
      create_owner_user_transaction: {
        Args: {
          p_auth_user_id: string
          p_business_id: string
          p_email: string
          p_name: string
          p_phone: string
        }
        Returns: Json
      }
      create_staff_user_transaction:
        | {
            Args: {
              p_auth_user_id: string
              p_business_id: string
              p_email: string
              p_name: string
              p_phone: string
              p_role: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_auth_user_id: string
              p_business_id: string
              p_calendar_color?: string
              p_email: string
              p_expertise_level?: string
              p_name: string
              p_phone: string
              p_role: string
            }
            Returns: Json
          }
      hard_delete_business: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      has_kvkk_consent: { Args: { p_user_id?: string }; Returns: boolean }
      is_business_owner: { Args: { _business_id: string }; Returns: boolean }
      is_customer_of: { Args: { _business_id: string }; Returns: boolean }
      is_related_to_user: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      is_staff_of: { Args: { _business_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action: string
          p_after?: Json
          p_before?: Json
          p_business_id?: string
          p_ip_address?: string
          p_target_id: string
          p_target_table: string
          p_user_agent?: string
        }
        Returns: string
      }
      onboard_business: {
        Args: {
          p_business_name: string
          p_ends_at?: string
          p_metadata?: Json
          p_onboarding_status?: Database["public"]["Enums"]["onboarding_status_type"]
          p_owner_user_id: string
          p_package_id: string
          p_sector_id: string
        }
        Returns: string
      }
      owner_add_staff_leave: {
        Args: {
          p_date: string
          p_end_time?: string
          p_reason?: string
          p_request_type: string
          p_staff_business_id: string
          p_start_time?: string
        }
        Returns: Json
      }
      suspend_business: {
        Args: {
          p_business_id: string
          p_reactivate?: boolean
          p_reason: string
        }
        Returns: Json
      }
      sync_business_sector_features: {
        Args: { p_business_id: string; p_sector_id: string }
        Returns: undefined
      }
      upsert_business_hours: {
        Args: { p_business_id: string; p_hours: Json }
        Returns: Json
      }
    }
    Enums: {
      onboarding_status_type:
        | "contract_pending"
        | "payment_pending"
        | "setup"
        | "live"
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
      onboarding_status_type: [
        "contract_pending",
        "payment_pending",
        "setup",
        "live",
      ],
    },
  },
} as const
