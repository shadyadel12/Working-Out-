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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_messages: {
        Row: {
          attachment_path: string | null
          attachment_type: string | null
          body: string
          coach_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          attachment_path?: string | null
          attachment_type?: string | null
          body?: string
          coach_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          attachment_path?: string | null
          attachment_type?: string | null
          body?: string
          coach_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      assignment_photos: {
        Row: {
          assignment_id: string
          coach_id: string
          created_at: string
          id: string
          player_id: string
          storage_path: string
        }
        Insert: {
          assignment_id: string
          coach_id: string
          created_at?: string
          id?: string
          player_id: string
          storage_path: string
        }
        Update: {
          assignment_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          player_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_photos_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "scheduled_coaching_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_photos_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_photos_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_revisions: {
        Row: {
          coach_id: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          published_at: string
          revision: number
          snapshot: Json
        }
        Insert: {
          coach_id: string
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          published_at?: string
          revision: number
          snapshot: Json
        }
        Update: {
          coach_id?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          published_at?: string
          revision?: number
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "catalog_revisions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_revisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_path: string | null
          attachment_type: string | null
          body: string
          coach_id: string
          created_at: string
          id: string
          player_id: string
          sender_id: string
        }
        Insert: {
          attachment_path?: string | null
          attachment_type?: string | null
          body?: string
          coach_id: string
          created_at?: string
          id?: string
          player_id: string
          sender_id: string
        }
        Update: {
          attachment_path?: string | null
          attachment_type?: string | null
          body?: string
          coach_id?: string
          created_at?: string
          id?: string
          player_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkups: {
        Row: {
          check_date: string
          coach_id: string
          created_at: string
          id: string
          is_checked: boolean
          player_id: string
        }
        Insert: {
          check_date?: string
          coach_id: string
          created_at?: string
          id?: string
          is_checked?: boolean
          player_id: string
        }
        Update: {
          check_date?: string
          coach_id?: string
          created_at?: string
          id?: string
          is_checked?: boolean
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkups_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_foods: {
        Row: {
          amount: string
          coach_id: string
          created_at: string
          id: string
          measure: string
          name: string
        }
        Insert: {
          amount?: string
          coach_id: string
          created_at?: string
          id?: string
          measure?: string
          name: string
        }
        Update: {
          amount?: string
          coach_id?: string
          created_at?: string
          id?: string
          measure?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_foods_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_forms: {
        Row: {
          available_from: string | null
          available_until: string | null
          coach_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          lifecycle: Database["public"]["Enums"]["catalog_lifecycle"]
          revision: number
          share_mode: Database["public"]["Enums"]["catalog_share_mode"]
          title: string
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          coach_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          title: string
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          coach_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_forms_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_keys: {
        Row: {
          claimed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          key: string
          status: Database["public"]["Enums"]["link_status"]
        }
        Insert: {
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          status?: Database["public"]["Enums"]["link_status"]
        }
        Update: {
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          status?: Database["public"]["Enums"]["link_status"]
        }
        Relationships: [
          {
            foreignKeyName: "coach_keys_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_player_links: {
        Row: {
          checkup_days_per_week: number
          checkup_weekdays: number[]
          coach_id: string
          created_at: string
          id: string
          is_vip: boolean
          key_generated_at: string | null
          key_generated_by: string | null
          player_id: string | null
          status: Database["public"]["Enums"]["link_status"]
          subscription_end_date: string
          subscription_key: string
        }
        Insert: {
          checkup_days_per_week?: number
          checkup_weekdays?: number[]
          coach_id: string
          created_at?: string
          id?: string
          is_vip?: boolean
          key_generated_at?: string | null
          key_generated_by?: string | null
          player_id?: string | null
          status?: Database["public"]["Enums"]["link_status"]
          subscription_end_date: string
          subscription_key: string
        }
        Update: {
          checkup_days_per_week?: number
          checkup_weekdays?: number[]
          coach_id?: string
          created_at?: string
          id?: string
          is_vip?: boolean
          key_generated_at?: string | null
          key_generated_by?: string | null
          player_id?: string | null
          status?: Database["public"]["Enums"]["link_status"]
          subscription_end_date?: string
          subscription_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_player_links_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_player_links_key_generated_by_fkey"
            columns: ["key_generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_player_links_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_team_assignments: {
        Row: {
          created_at: string
          member_id: string
          owner_coach_id: string
          player_id: string
        }
        Insert: {
          created_at?: string
          member_id: string
          owner_coach_id: string
          player_id: string
        }
        Update: {
          created_at?: string
          member_id?: string
          owner_coach_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_team_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_team_assignments_owner_coach_id_fkey"
            columns: ["owner_coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_team_assignments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_team_invites: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          id: string
          invite_key: string
          owner_coach_id: string
          role: Database["public"]["Enums"]["team_role"]
          status: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          invite_key: string
          owner_coach_id: string
          role: Database["public"]["Enums"]["team_role"]
          status?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          invite_key?: string
          owner_coach_id?: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_team_invites_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_team_invites_owner_coach_id_fkey"
            columns: ["owner_coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_team_members: {
        Row: {
          created_at: string
          id: string
          member_id: string
          owner_coach_id: string
          role: Database["public"]["Enums"]["team_role"]
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          owner_coach_id: string
          role: Database["public"]["Enums"]["team_role"]
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          owner_coach_id?: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_team_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_team_members_owner_coach_id_fkey"
            columns: ["owner_coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_tasks: {
        Row: {
          add_uploads_to_progress_photos: boolean
          coach_id: string
          created_at: string
          deleted_at: string | null
          form_id: string | null
          id: string
          instructions: string | null
          lifecycle: Database["public"]["Enums"]["catalog_lifecycle"]
          revision: number
          share_mode: Database["public"]["Enums"]["catalog_share_mode"]
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          add_uploads_to_progress_photos?: boolean
          coach_id: string
          created_at?: string
          deleted_at?: string | null
          form_id?: string | null
          id?: string
          instructions?: string | null
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          add_uploads_to_progress_photos?: boolean
          coach_id?: string
          created_at?: string
          deleted_at?: string | null
          form_id?: string | null
          id?: string
          instructions?: string | null
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_tasks_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_tasks_form_fk"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "coach_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_dishes: {
        Row: {
          collection_id: string
          dish_id: string
          position: number
        }
        Insert: {
          collection_id: string
          dish_id: string
          position?: number
        }
        Update: {
          collection_id?: string
          dish_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_dishes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "dish_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_dishes_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_days: {
        Row: {
          coach_id: string
          comment: string | null
          created_at: string
          day_of_week: number
          id: string
          is_template_override: boolean
          meals: Json
          player_id: string
          template_id: string | null
          updated_at: string
          week_number: number
        }
        Insert: {
          coach_id: string
          comment?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_template_override?: boolean
          meals?: Json
          player_id: string
          template_id?: string | null
          updated_at?: string
          week_number: number
        }
        Update: {
          coach_id?: string
          comment?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_template_override?: boolean
          meals?: Json
          player_id?: string
          template_id?: string | null
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "diet_days_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_days_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_days_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "diet_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_logs: {
        Row: {
          coach_id: string
          completed_meals: number
          created_at: string
          diet_day_id: string
          id: string
          log_date: string
          player_comment: string | null
          player_id: string
          total_meals: number
          updated_at: string
        }
        Insert: {
          coach_id: string
          completed_meals: number
          created_at?: string
          diet_day_id: string
          id?: string
          log_date?: string
          player_comment?: string | null
          player_id: string
          total_meals: number
          updated_at?: string
        }
        Update: {
          coach_id?: string
          completed_meals?: number
          created_at?: string
          diet_day_id?: string
          id?: string
          log_date?: string
          player_comment?: string | null
          player_id?: string
          total_meals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_logs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_logs_diet_day_id_fkey"
            columns: ["diet_day_id"]
            isOneToOne: false
            referencedRelation: "diet_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_templates: {
        Row: {
          coach_id: string
          comment: string | null
          created_at: string
          deleted_at: string | null
          id: string
          lifecycle: Database["public"]["Enums"]["catalog_lifecycle"]
          meals: Json
          name: string
          revision: number
          share_mode: Database["public"]["Enums"]["catalog_share_mode"]
          tags: string[]
        }
        Insert: {
          coach_id: string
          comment?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          meals?: Json
          name: string
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          tags?: string[]
        }
        Update: {
          coach_id?: string
          comment?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          meals?: Json
          name?: string
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "diet_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_collections: {
        Row: {
          coach_id: string
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          lifecycle: Database["public"]["Enums"]["catalog_lifecycle"]
          revision: number
          share_mode: Database["public"]["Enums"]["catalog_share_mode"]
          title: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          title: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_collections_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_components: {
        Row: {
          dish_id: string
          food_item_id: string
          id: string
          position: number
          quantity: number
          unit: string
        }
        Insert: {
          dish_id: string
          food_item_id: string
          id?: string
          position?: number
          quantity: number
          unit: string
        }
        Update: {
          dish_id?: string
          food_item_id?: string
          id?: string
          position?: number
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_components_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_components_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          calories: number | null
          carbs_g: number | null
          categories: string[]
          category: string | null
          coach_id: string
          cook_minutes: number | null
          cooking_steps: Json
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          dietary_labels: string[]
          fat_g: number | null
          fiber_g: number | null
          id: string
          instruction_video_url: string | null
          instructions: string | null
          lifecycle: Database["public"]["Enums"]["catalog_lifecycle"]
          prep_minutes: number | null
          preparation_steps: Json
          protein_g: number | null
          revision: number
          saturated_fat_g: number | null
          servings: number
          share_mode: Database["public"]["Enums"]["catalog_share_mode"]
          sugar_g: number | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          categories?: string[]
          category?: string | null
          coach_id: string
          cook_minutes?: number | null
          cooking_steps?: Json
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          dietary_labels?: string[]
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          instruction_video_url?: string | null
          instructions?: string | null
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          prep_minutes?: number | null
          preparation_steps?: Json
          protein_g?: number | null
          revision?: number
          saturated_fat_g?: number | null
          servings?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          sugar_g?: number | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          categories?: string[]
          category?: string | null
          coach_id?: string
          cook_minutes?: number | null
          cooking_steps?: Json
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          dietary_labels?: string[]
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          instruction_video_url?: string | null
          instructions?: string | null
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          prep_minutes?: number | null
          preparation_steps?: Json
          protein_g?: number | null
          revision?: number
          saturated_fat_g?: number | null
          servings?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          sugar_g?: number | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_library: {
        Row: {
          category: string
          coach_id: string
          created_at: string
          default_note: string | null
          deleted_at: string | null
          equipment: string | null
          id: string
          instructions: string | null
          lifecycle: Database["public"]["Enums"]["catalog_lifecycle"]
          measurement_mode: string
          modality: string | null
          movement_patterns: string[]
          name: string
          revision: number
          share_mode: Database["public"]["Enums"]["catalog_share_mode"]
          tags: string[]
          target_muscle_groups: string[]
          tracking_fields: string[]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          coach_id: string
          created_at?: string
          default_note?: string | null
          deleted_at?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          measurement_mode?: string
          modality?: string | null
          movement_patterns?: string[]
          name: string
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          tags?: string[]
          target_muscle_groups?: string[]
          tracking_fields?: string[]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          coach_id?: string
          created_at?: string
          default_note?: string | null
          deleted_at?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          measurement_mode?: string
          modality?: string | null
          movement_patterns?: string[]
          name?: string
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          tags?: string[]
          target_muscle_groups?: string[]
          tracking_fields?: string[]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_library_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          actual_reps: string | null
          actual_sets: number | null
          actual_weight: string | null
          created_at: string
          exercise_id: string
          id: string
          is_completed: boolean
          log_date: string
          player_comment: string | null
          player_id: string
          player_video_delete_after: string | null
          player_video_is_external: boolean
          player_video_url: string | null
          player_video_viewed_at: string | null
          updated_at: string
        }
        Insert: {
          actual_reps?: string | null
          actual_sets?: number | null
          actual_weight?: string | null
          created_at?: string
          exercise_id: string
          id?: string
          is_completed?: boolean
          log_date?: string
          player_comment?: string | null
          player_id: string
          player_video_delete_after?: string | null
          player_video_is_external?: boolean
          player_video_url?: string | null
          player_video_viewed_at?: string | null
          updated_at?: string
        }
        Update: {
          actual_reps?: string | null
          actual_sets?: number | null
          actual_weight?: string | null
          created_at?: string
          exercise_id?: string
          id?: string
          is_completed?: boolean
          log_date?: string
          player_comment?: string | null
          player_id?: string
          player_video_delete_after?: string | null
          player_video_is_external?: boolean
          player_video_url?: string | null
          player_video_viewed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          coach_comment: string | null
          coach_video_is_external: boolean
          coach_video_url: string | null
          created_at: string
          id: string
          is_template_override: boolean
          name: string | null
          position: number
          program_day_id: string | null
          target_reps: string | null
          target_seconds: number | null
          target_sets: number | null
          target_weight: string | null
          template_exercise_id: string | null
          tempo: string | null
          workout_id: string | null
        }
        Insert: {
          coach_comment?: string | null
          coach_video_is_external?: boolean
          coach_video_url?: string | null
          created_at?: string
          id?: string
          is_template_override?: boolean
          name?: string | null
          position?: number
          program_day_id?: string | null
          target_reps?: string | null
          target_seconds?: number | null
          target_sets?: number | null
          target_weight?: string | null
          template_exercise_id?: string | null
          tempo?: string | null
          workout_id?: string | null
        }
        Update: {
          coach_comment?: string | null
          coach_video_is_external?: boolean
          coach_video_url?: string | null
          created_at?: string
          id?: string
          is_template_override?: boolean
          name?: string | null
          position?: number
          program_day_id?: string | null
          target_reps?: string | null
          target_seconds?: number | null
          target_sets?: number | null
          target_weight?: string | null
          template_exercise_id?: string | null
          tempo?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_template_exercise_id_fkey"
            columns: ["template_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_template_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          calories: number | null
          carbs_g: number | null
          category: string | null
          coach_id: string
          created_at: string
          default_unit: string
          deleted_at: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          image_url: string | null
          name: string
          protein_g: number | null
          updated_at: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          category?: string | null
          coach_id: string
          created_at?: string
          default_unit?: string
          deleted_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          name: string
          protein_g?: number | null
          updated_at?: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          category?: string | null
          coach_id?: string
          created_at?: string
          default_unit?: string
          deleted_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          name?: string
          protein_g?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_items_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_answers: {
        Row: {
          id: string
          question_id: string
          response_id: string
          value: Json
        }
        Insert: {
          id?: string
          question_id: string
          response_id: string
          value: Json
        }
        Update: {
          id?: string
          question_id?: string
          response_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "form_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "form_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "form_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      form_questions: {
        Row: {
          form_id: string
          id: string
          options: Json
          position: number
          prompt: string
          question_type: string
          required: boolean
        }
        Insert: {
          form_id: string
          id?: string
          options?: Json
          position?: number
          prompt: string
          question_type: string
          required?: boolean
        }
        Update: {
          form_id?: string
          id?: string
          options?: Json
          position?: number
          prompt?: string
          question_type?: string
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "coach_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          coach_id: string
          created_at: string
          form_id: string
          id: string
          player_id: string
          submitted_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          form_id: string
          id?: string
          player_id: string
          submitted_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          form_id?: string
          id?: string
          player_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "coach_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      library_audit_events: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          coach_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          coach_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          coach_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "library_audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_audit_events_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_group_items: {
        Row: {
          group_id: string
          measurement_id: string
          position: number
        }
        Insert: {
          group_id: string
          measurement_id: string
          position?: number
        }
        Update: {
          group_id?: string
          measurement_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "measurement_group_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "measurement_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_group_items_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_groups: {
        Row: {
          coach_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          lifecycle: Database["public"]["Enums"]["catalog_lifecycle"]
          revision: number
          share_mode: Database["public"]["Enums"]["catalog_share_mode"]
          title: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          title: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_groups_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_observations: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          measurement_id: string
          note: string | null
          observed_on: string
          player_id: string
          value: number
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          measurement_id: string
          note?: string | null
          observed_on?: string
          player_id: string
          value: number
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          measurement_id?: string
          note?: string | null
          observed_on?: string
          player_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "measurement_observations_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_observations_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_observations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          coach_id: string
          created_at: string
          deleted_at: string | null
          id: string
          max_value: number | null
          min_value: number | null
          name: string
          unit: string
          updated_at: string
          value_type: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          name: string
          unit: string
          updated_at?: string
          value_type?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          name?: string
          unit?: string
          updated_at?: string
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurements_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_entries: {
        Row: {
          day_number: number
          dish_id: string | null
          id: string
          meal_name: string
          meal_type: string
          menu_template_id: string
          note: string | null
          position: number
          week_number: number
        }
        Insert: {
          day_number: number
          dish_id?: string | null
          id?: string
          meal_name: string
          meal_type?: string
          menu_template_id: string
          note?: string | null
          position?: number
          week_number: number
        }
        Update: {
          day_number?: number
          dish_id?: string | null
          id?: string
          meal_name?: string
          meal_type?: string
          menu_template_id?: string
          note?: string | null
          position?: number
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_entries_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_entries_menu_template_id_fkey"
            columns: ["menu_template_id"]
            isOneToOne: false
            referencedRelation: "menu_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_templates: {
        Row: {
          coach_id: string
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          lifecycle: Database["public"]["Enums"]["catalog_lifecycle"]
          revision: number
          share_mode: Database["public"]["Enums"]["catalog_share_mode"]
          show_dietary_info: boolean
          title: string
          updated_at: string
          week_count: number
        }
        Insert: {
          coach_id: string
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          show_dietary_info?: boolean
          title: string
          updated_at?: string
          week_count?: number
        }
        Update: {
          coach_id?: string
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          show_dietary_info?: boolean
          title?: string
          updated_at?: string
          week_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          coach_id: string
          created_at: string
          exercise_id: string | null
          id: string
          player_id: string
        }
        Insert: {
          body: string
          coach_id: string
          created_at?: string
          exercise_id?: string | null
          id?: string
          player_id: string
        }
        Update: {
          body?: string
          coach_id?: string
          created_at?: string
          exercise_id?: string | null
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_coaching_profiles: {
        Row: {
          available_equipment: string
          client_goals: string
          coach_id: string
          coach_notes: string
          created_at: string
          id: string
          limitations_injuries: string
          player_id: string
          updated_at: string
        }
        Insert: {
          available_equipment?: string
          client_goals?: string
          coach_id: string
          coach_notes?: string
          created_at?: string
          id?: string
          limitations_injuries?: string
          player_id: string
          updated_at?: string
        }
        Update: {
          available_equipment?: string
          client_goals?: string
          coach_id?: string
          coach_notes?: string
          created_at?: string
          id?: string
          limitations_injuries?: string
          player_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_coaching_profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_coaching_profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_details: {
        Row: {
          completed_at: string
          country: string
          date_of_birth: string
          experience_level: string
          gender: string
          height: string
          mobile_number: string
          player_id: string
          position: string
          sport: string
          sport_level: string
          updated_at: string
        }
        Insert: {
          completed_at?: string
          country: string
          date_of_birth: string
          experience_level: string
          gender: string
          height: string
          mobile_number: string
          player_id: string
          position: string
          sport: string
          sport_level: string
          updated_at?: string
        }
        Update: {
          completed_at?: string
          country?: string
          date_of_birth?: string
          experience_level?: string
          gender?: string
          height?: string
          mobile_number?: string
          player_id?: string
          position?: string
          sport?: string
          sport_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_details_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_meal_plan_assignments: {
        Row: {
          assigned_at: string
          coach_id: string
          end_week: number
          id: string
          menu_template_id: string
          player_id: string
          start_week: number
          status: string
        }
        Insert: {
          assigned_at?: string
          coach_id: string
          end_week: number
          id?: string
          menu_template_id: string
          player_id: string
          start_week: number
          status?: string
        }
        Update: {
          assigned_at?: string
          coach_id?: string
          end_week?: number
          id?: string
          menu_template_id?: string
          player_id?: string
          start_week?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_meal_plan_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_meal_plan_assignments_menu_template_id_fkey"
            columns: ["menu_template_id"]
            isOneToOne: false
            referencedRelation: "menu_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_meal_plan_assignments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      private_files: {
        Row: {
          attachment_type: string | null
          byte_size: number
          coach_id: string | null
          content_type: string
          created_at: string
          deleted_at: string | null
          id: string
          object_key: string
          original_name: string
          owner_id: string
          player_id: string | null
          purpose: string
          status: string
          verified_at: string | null
        }
        Insert: {
          attachment_type?: string | null
          byte_size: number
          coach_id?: string | null
          content_type: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          object_key: string
          original_name: string
          owner_id: string
          player_id?: string | null
          purpose: string
          status?: string
          verified_at?: string | null
        }
        Update: {
          attachment_type?: string | null
          byte_size?: number
          coach_id?: string | null
          content_type?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          object_key?: string
          original_name?: string
          owner_id?: string
          player_id?: string | null
          purpose?: string
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_files_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_files_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_files_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          public_display_name: string | null
          public_attribution: string | null
          community_standards_accepted_at: string | null
          community_standards_version: number | null
          suspended_at: string | null
          suspension_reason: string | null
          deletion_requested_at: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          public_display_name?: string | null
          public_attribution?: string | null
          community_standards_accepted_at?: string | null
          community_standards_version?: number | null
          suspended_at?: string | null
          suspension_reason?: string | null
          deletion_requested_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          public_display_name?: string | null
          public_attribution?: string | null
          community_standards_accepted_at?: string | null
          community_standards_version?: number | null
          suspended_at?: string | null
          suspension_reason?: string | null
          deletion_requested_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      program_days: {
        Row: {
          coach_id: string
          created_at: string
          day_of_week: number
          day_type: Database["public"]["Enums"]["day_type"]
          diet_plan: string | null
          id: string
          player_id: string
          title: string | null
          updated_at: string
          week_number: number
        }
        Insert: {
          coach_id: string
          created_at?: string
          day_of_week: number
          day_type?: Database["public"]["Enums"]["day_type"]
          diet_plan?: string | null
          id?: string
          player_id: string
          title?: string | null
          updated_at?: string
          week_number: number
        }
        Update: {
          coach_id?: string
          created_at?: string
          day_of_week?: number
          day_type?: Database["public"]["Enums"]["day_type"]
          diet_plan?: string | null
          id?: string
          player_id?: string
          title?: string | null
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_days_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_days_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      program_deliveries: {
        Row: {
          coach_id: string
          created_at: string
          ends_on: string
          id: string
          player_id: string
          program_template_id: string
          revision: number
          snapshot: Json
          starts_at_day: number
          starts_on: string
          status: Database["public"]["Enums"]["delivery_status"]
          sync_mode: Database["public"]["Enums"]["delivery_sync_mode"]
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          ends_on: string
          id?: string
          player_id: string
          program_template_id: string
          revision: number
          snapshot: Json
          starts_at_day?: number
          starts_on: string
          status?: Database["public"]["Enums"]["delivery_status"]
          sync_mode?: Database["public"]["Enums"]["delivery_sync_mode"]
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          ends_on?: string
          id?: string
          player_id?: string
          program_template_id?: string
          revision?: number
          snapshot?: Json
          starts_at_day?: number
          starts_on?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          sync_mode?: Database["public"]["Enums"]["delivery_sync_mode"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_deliveries_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_deliveries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_deliveries_program_template_id_fkey"
            columns: ["program_template_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      program_template_day_workouts: {
        Row: {
          created_at: string
          exercise_library_ids: string[]
          id: string
          name: string
          notes: string | null
          position: number
          program_template_day_id: string
          workout_template_id: string | null
        }
        Insert: {
          created_at?: string
          exercise_library_ids?: string[]
          id?: string
          name: string
          notes?: string | null
          position?: number
          program_template_day_id: string
          workout_template_id?: string | null
        }
        Update: {
          created_at?: string
          exercise_library_ids?: string[]
          id?: string
          name?: string
          notes?: string | null
          position?: number
          program_template_day_id?: string
          workout_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_template_day_workouts_program_template_day_id_fkey"
            columns: ["program_template_day_id"]
            isOneToOne: false
            referencedRelation: "program_template_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_template_day_workouts_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      program_template_days: {
        Row: {
          created_at: string
          day_number: number
          id: string
          program_template_id: string
          week_number: number
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          program_template_id: string
          week_number: number
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          program_template_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_template_days_program_template_id_fkey"
            columns: ["program_template_id"]
            isOneToOne: false
            referencedRelation: "program_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      program_templates: {
        Row: {
          coach_id: string
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          difficulty: string
          duration_weeks: number
          experience_level: string | null
          id: string
          lifecycle: Database["public"]["Enums"]["catalog_lifecycle"]
          live_sync: boolean
          modality: string | null
          name: string
          revision: number
          share_mode: Database["public"]["Enums"]["catalog_share_mode"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          coach_id: string
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          difficulty: string
          duration_weeks: number
          experience_level?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          live_sync?: boolean
          modality?: string | null
          name: string
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          coach_id?: string
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          difficulty?: string
          duration_weeks?: number
          experience_level?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          live_sync?: boolean
          modality?: string | null
          name?: string
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photos: {
        Row: {
          assignment_id: string
          captured_at: string
          coach_id: string
          created_at: string
          id: string
          player_id: string
          storage_path: string
        }
        Insert: {
          assignment_id: string
          captured_at?: string
          coach_id: string
          created_at?: string
          id?: string
          player_id: string
          storage_path: string
        }
        Update: {
          assignment_id?: string
          captured_at?: string
          coach_id?: string
          created_at?: string
          id?: string
          player_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "scheduled_coaching_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_photos_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_photos_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_coaching_items: {
        Row: {
          coach_id: string
          completed_at: string | null
          created_at: string
          id: string
          item_id: string
          item_type: string
          player_id: string
          recurrence: Json | null
          scheduled_for: string
          snapshot: Json
          status: Database["public"]["Enums"]["delivery_status"]
        }
        Insert: {
          coach_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          player_id: string
          recurrence?: Json | null
          scheduled_for: string
          snapshot?: Json
          status?: Database["public"]["Enums"]["delivery_status"]
        }
        Update: {
          coach_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          player_id?: string
          recurrence?: Json | null
          scheduled_for?: string
          snapshot?: Json
          status?: Database["public"]["Enums"]["delivery_status"]
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_coaching_items_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_coaching_items_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          created_at: string
          exercise_log_id: string
          id: string
          reps: string | null
          set_number: number
          weight: string | null
        }
        Insert: {
          created_at?: string
          exercise_log_id: string
          id?: string
          reps?: string | null
          set_number: number
          weight?: string | null
        }
        Update: {
          created_at?: string
          exercise_log_id?: string
          id?: string
          reps?: string | null
          set_number?: number
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_log_id_fkey"
            columns: ["exercise_log_id"]
            isOneToOne: false
            referencedRelation: "exercise_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_section_exercises: {
        Row: {
          bilateral: boolean
          chain_key: string | null
          exercise_library_id: string
          id: string
          load_percent: number | null
          load_value: number | null
          note: string | null
          position: number
          reps: string | null
          rest_seconds: number | null
          seconds: number | null
          section_id: string
          sets: number | null
          tempo: string | null
        }
        Insert: {
          bilateral?: boolean
          chain_key?: string | null
          exercise_library_id: string
          id?: string
          load_percent?: number | null
          load_value?: number | null
          note?: string | null
          position?: number
          reps?: string | null
          rest_seconds?: number | null
          seconds?: number | null
          section_id: string
          sets?: number | null
          tempo?: string | null
        }
        Update: {
          bilateral?: boolean
          chain_key?: string | null
          exercise_library_id?: string
          id?: string
          load_percent?: number | null
          load_value?: number | null
          note?: string | null
          position?: number
          reps?: string | null
          rest_seconds?: number | null
          seconds?: number | null
          section_id?: string
          sets?: number | null
          tempo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_section_exercises_exercise_library_id_fkey"
            columns: ["exercise_library_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_section_exercises_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "workout_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sections: {
        Row: {
          coach_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          duration_seconds: number | null
          format: Database["public"]["Enums"]["workout_section_format"]
          id: string
          lifecycle: Database["public"]["Enums"]["catalog_lifecycle"]
          name: string
          revision: number
          rounds: number | null
          share_mode: Database["public"]["Enums"]["catalog_share_mode"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          format?: Database["public"]["Enums"]["workout_section_format"]
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          name: string
          revision?: number
          rounds?: number | null
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          format?: Database["public"]["Enums"]["workout_section_format"]
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          name?: string
          revision?: number
          rounds?: number | null
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sections_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_exercises: {
        Row: {
          bilateral: boolean
          chain_key: string | null
          coach_comment: string | null
          coach_video_is_external: boolean
          coach_video_url: string | null
          created_at: string
          exercise_library_id: string | null
          id: string
          load_percent: number | null
          load_value: number | null
          name: string
          position: number
          rest_seconds: number | null
          section_id: string | null
          section_name: string | null
          target_reps: string | null
          target_seconds: number | null
          target_sets: number | null
          target_weight: string | null
          template_id: string
          tempo: string | null
        }
        Insert: {
          bilateral?: boolean
          chain_key?: string | null
          coach_comment?: string | null
          coach_video_is_external?: boolean
          coach_video_url?: string | null
          created_at?: string
          exercise_library_id?: string | null
          id?: string
          load_percent?: number | null
          load_value?: number | null
          name: string
          position?: number
          rest_seconds?: number | null
          section_id?: string | null
          section_name?: string | null
          target_reps?: string | null
          target_seconds?: number | null
          target_sets?: number | null
          target_weight?: string | null
          template_id: string
          tempo?: string | null
        }
        Update: {
          bilateral?: boolean
          chain_key?: string | null
          coach_comment?: string | null
          coach_video_is_external?: boolean
          coach_video_url?: string | null
          created_at?: string
          exercise_library_id?: string | null
          id?: string
          load_percent?: number | null
          load_value?: number | null
          name?: string
          position?: number
          rest_seconds?: number | null
          section_id?: string | null
          section_name?: string | null
          target_reps?: string | null
          target_seconds?: number | null
          target_sets?: number | null
          target_weight?: string | null
          template_id?: string
          tempo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_exercise_library_id_fkey"
            columns: ["exercise_library_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "workout_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_sections: {
        Row: {
          id: string
          position: number
          section_id: string
          template_id: string
        }
        Insert: {
          id?: string
          position?: number
          section_id: string
          template_id: string
        }
        Update: {
          id?: string
          position?: number
          section_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_sections_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "workout_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          coach_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          difficulty: string | null
          id: string
          lifecycle: Database["public"]["Enums"]["catalog_lifecycle"]
          name: string
          notes: string | null
          revision: number
          share_mode: Database["public"]["Enums"]["catalog_share_mode"]
          tags: string[]
        }
        Insert: {
          coach_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          name: string
          notes?: string | null
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          tags?: string[]
        }
        Update: {
          coach_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["catalog_lifecycle"]
          name?: string
          notes?: string | null
          revision?: number
          share_mode?: Database["public"]["Enums"]["catalog_share_mode"]
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          id: string
          name: string | null
          position: number
          program_day_id: string
          template_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          position?: number
          program_day_id: string
          template_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          position?: number
          program_day_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_coach_key: {
        Args: { p_key: string }
        Returns: {
          claimed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          key: string
          status: Database["public"]["Enums"]["link_status"]
        }
        SetofOptions: {
          from: "*"
          to: "coach_keys"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_create_key: {
        Args: { p_coach_id: string; p_end_date: string; p_key: string }
        Returns: {
          checkup_days_per_week: number
          checkup_weekdays: number[]
          coach_id: string
          created_at: string
          id: string
          is_vip: boolean
          key_generated_at: string | null
          key_generated_by: string | null
          player_id: string | null
          status: Database["public"]["Enums"]["link_status"]
          subscription_end_date: string
          subscription_key: string
        }
        SetofOptions: {
          from: "*"
          to: "coach_player_links"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_revoke_coach_key: {
        Args: { p_key_id: string }
        Returns: {
          claimed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          key: string
          status: Database["public"]["Enums"]["link_status"]
        }
        SetofOptions: {
          from: "*"
          to: "coach_keys"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_update_key: {
        Args: {
          p_end_date: string
          p_key_id: string
          p_status: Database["public"]["Enums"]["link_status"]
        }
        Returns: {
          checkup_days_per_week: number
          checkup_weekdays: number[]
          coach_id: string
          created_at: string
          id: string
          is_vip: boolean
          key_generated_at: string | null
          key_generated_by: string | null
          player_id: string | null
          status: Database["public"]["Enums"]["link_status"]
          subscription_end_date: string
          subscription_key: string
        }
        SetofOptions: {
          from: "*"
          to: "coach_player_links"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_menu_template_to_player: {
        Args: {
          p_menu_template_id: string
          p_player_id: string
          p_start_week: number
        }
        Returns: number
      }
      assign_diet_template: {
        Args: {
          p_day_of_week: number
          p_player_id: string
          p_template_id: string
          p_week: number
        }
        Returns: string
      }
      assign_program_template_to_player: {
        Args: {
          p_player_id: string
          p_program_template_id: string
          p_start_week: number
        }
        Returns: number
      }
      assign_workout_template: {
        Args: {
          p_position?: number
          p_program_day_id: string
          p_template_id: string
        }
        Returns: string
      }
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      can_read_coach_library: {
        Args: {
          p_owner: string
          p_share: Database["public"]["Enums"]["catalog_share_mode"]
        }
        Returns: boolean
      }
      check_coach_key: { Args: { p_key: string }; Returns: boolean }
      check_subscription_key: { Args: { p_key: string }; Returns: boolean }
      check_team_invite: { Args: { p_key: string }; Returns: boolean }
      checkup_weekdays_for_count: {
        Args: { p_count: number }
        Returns: number[]
      }
      claim_coach_key: { Args: { p_key: string }; Returns: undefined }
      claim_subscription_key: {
        Args: { p_key: string }
        Returns: {
          checkup_days_per_week: number
          checkup_weekdays: number[]
          coach_id: string
          created_at: string
          id: string
          is_vip: boolean
          key_generated_at: string | null
          key_generated_by: string | null
          player_id: string | null
          status: Database["public"]["Enums"]["link_status"]
          subscription_end_date: string
          subscription_key: string
        }
        SetofOptions: {
          from: "*"
          to: "coach_player_links"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_team_invite: { Args: { p_key: string }; Returns: undefined }
      coach_create_player_key:
        | {
            Args: { p_end_date: string; p_player_id: string }
            Returns: {
              checkup_days_per_week: number
              checkup_weekdays: number[]
              coach_id: string
              created_at: string
              id: string
              is_vip: boolean
              key_generated_at: string | null
              key_generated_by: string | null
              player_id: string | null
              status: Database["public"]["Enums"]["link_status"]
              subscription_end_date: string
              subscription_key: string
            }
            SetofOptions: {
              from: "*"
              to: "coach_player_links"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_end_date: string
              p_is_vip?: boolean
              p_player_id: string
            }
            Returns: {
              checkup_days_per_week: number
              checkup_weekdays: number[]
              coach_id: string
              created_at: string
              id: string
              is_vip: boolean
              key_generated_at: string | null
              key_generated_by: string | null
              player_id: string | null
              status: Database["public"]["Enums"]["link_status"]
              subscription_end_date: string
              subscription_key: string
            }
            SetofOptions: {
              from: "*"
              to: "coach_player_links"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_checkup_days?: number
              p_end_date: string
              p_is_vip?: boolean
              p_player_id: string
            }
            Returns: {
              checkup_days_per_week: number
              checkup_weekdays: number[]
              coach_id: string
              created_at: string
              id: string
              is_vip: boolean
              key_generated_at: string | null
              key_generated_by: string | null
              player_id: string | null
              status: Database["public"]["Enums"]["link_status"]
              subscription_end_date: string
              subscription_key: string
            }
            SetofOptions: {
              from: "*"
              to: "coach_player_links"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      coach_create_unclaimed_key:
        | {
            Args: { p_end_date: string }
            Returns: {
              checkup_days_per_week: number
              checkup_weekdays: number[]
              coach_id: string
              created_at: string
              id: string
              is_vip: boolean
              key_generated_at: string | null
              key_generated_by: string | null
              player_id: string | null
              status: Database["public"]["Enums"]["link_status"]
              subscription_end_date: string
              subscription_key: string
            }
            SetofOptions: {
              from: "*"
              to: "coach_player_links"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { p_end_date: string; p_is_vip?: boolean }
            Returns: {
              checkup_days_per_week: number
              checkup_weekdays: number[]
              coach_id: string
              created_at: string
              id: string
              is_vip: boolean
              key_generated_at: string | null
              key_generated_by: string | null
              player_id: string | null
              status: Database["public"]["Enums"]["link_status"]
              subscription_end_date: string
              subscription_key: string
            }
            SetofOptions: {
              from: "*"
              to: "coach_player_links"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_checkup_days?: number
              p_end_date: string
              p_is_vip?: boolean
            }
            Returns: {
              checkup_days_per_week: number
              checkup_weekdays: number[]
              coach_id: string
              created_at: string
              id: string
              is_vip: boolean
              key_generated_at: string | null
              key_generated_by: string | null
              player_id: string | null
              status: Database["public"]["Enums"]["link_status"]
              subscription_end_date: string
              subscription_key: string
            }
            SetofOptions: {
              from: "*"
              to: "coach_player_links"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      complete_coaching_assignment: {
        Args: { p_assignment_id: string }
        Returns: undefined
      }
      create_program_delivery: {
        Args: {
          p_player_id: string
          p_program_template_id: string
          p_starts_at_day?: number
          p_starts_on: string
          p_sync_mode?: Database["public"]["Enums"]["delivery_sync_mode"]
        }
        Returns: string
      }
      create_team_invite: {
        Args: { p_role: Database["public"]["Enums"]["team_role"] }
        Returns: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          id: string
          invite_key: string
          owner_coach_id: string
          role: Database["public"]["Enums"]["team_role"]
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "coach_team_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      duplicate_workout_blueprint: {
        Args: { p_template_id: string }
        Returns: string
      }
      get_coach_chat_threads: {
        Args: { p_coach_id: string }
        Returns: {
          attachment_type: string
          body: string
          created_at: string
          player_id: string
          sender_id: string
        }[]
      }
      get_progress_options: { Args: { p_player_id: string }; Returns: Json }
      get_progress_page: {
        Args: {
          p_end?: string
          p_exercise?: string
          p_limit?: number
          p_offset?: number
          p_player_id: string
          p_start?: string
          p_workout?: string
        }
        Returns: Json
      }
      has_active_subscription: { Args: { p_player: string }; Returns: boolean }
      is_my_player: { Args: { p_player: string }; Returns: boolean }
      mark_player_video_viewed: { Args: { p_log_id: string }; Returns: string }
      begin_account_deletion: { Args: { p_actor_hash: string }; Returns: { provider: string; object_key: string }[] }
      block_user: { Args: { p_user: string; p_scope?: string; p_reason?: string | null }; Returns: undefined }
      copy_public_catalog_item: { Args: { p_table: string; p_id: string }; Returns: string }
      moderate_catalog_item: { Args: { p_table: string; p_id: string; p_status: Database["public"]["Enums"]["catalog_moderation_status"]; p_reason: string }; Returns: undefined }
      moderate_user_account: { Args: { p_user: string; p_suspend: boolean; p_reason: string }; Returns: undefined }
      publish_catalog_item_compliant: { Args: { p_table: string; p_id: string; p_visibility: Database["public"]["Enums"]["catalog_visibility"]; p_display_name?: string | null; p_public_attribution?: string | null; p_accept_standards?: boolean; p_ownership?: string | null; p_source_url?: string | null; p_source_license?: string | null; p_source_attribution?: string | null }; Returns: number }
      report_catalog_item_compliant: { Args: { p_table: string; p_id: string; p_reason_code: string; p_details?: string | null }; Returns: string }
      report_ugc: { Args: { p_type: string; p_id: string; p_reason: string; p_details?: string | null }; Returns: string }
      publish_library_item: {
        Args: { p_id: string; p_table: string }
        Returns: number
      }
      register_private_upload: {
        Args: {
          p_attachment_type: string
          p_byte_size: number
          p_coach_id: string
          p_content_type: string
          p_id: string
          p_object_key: string
          p_original_name: string
          p_owner_id: string
          p_player_id: string
          p_purpose: string
        }
        Returns: {
          attachment_type: string | null
          byte_size: number
          coach_id: string | null
          content_type: string
          created_at: string
          deleted_at: string | null
          id: string
          object_key: string
          original_name: string
          owner_id: string
          player_id: string | null
          purpose: string
          status: string
          verified_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "private_files"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      replace_diet_import: {
        Args: { p_days: Json; p_foods: Json; p_player_id: string }
        Returns: Json
      }
      replace_program_import: {
        Args: { p_days: Json; p_player_id: string }
        Returns: Json
      }
      resync_exercise_log_summary: {
        Args: { p_log_id: string }
        Returns: undefined
      }
      save_diet_as_template: {
        Args: { p_diet_day_id: string; p_name: string }
        Returns: string
      }
      save_workout_as_template: {
        Args: { p_workout_id: string }
        Returns: string
      }
      save_workout_blueprint: {
        Args: {
          p_description: string
          p_difficulty: string
          p_items: Json
          p_name: string
          p_notes: string
          p_template_id: string
        }
        Returns: string
      }
      soft_delete_library_item: {
        Args: { p_id: string; p_table: string }
        Returns: undefined
      }
      submit_assignment_progress_photos: {
        Args: { p_assignment_id: string; p_paths: string[] }
        Returns: undefined
      }
      team_can_chat_player: {
        Args: { p_owner: string; p_player: string }
        Returns: boolean
      }
      team_can_manage_player: {
        Args: { p_owner: string; p_player: string }
        Returns: boolean
      }
      team_can_sell_for_owner: { Args: { p_owner: string }; Returns: boolean }
      team_can_sell_player: {
        Args: { p_owner: string; p_player: string }
        Returns: boolean
      }
      team_can_view_player: {
        Args: { p_owner: string; p_player: string }
        Returns: boolean
      }
      team_has_assignment: {
        Args: {
          p_owner: string
          p_player: string
          p_roles: Database["public"]["Enums"]["team_role"][]
        }
        Returns: boolean
      }
      team_owner_for_member: { Args: { p_member?: string }; Returns: string }
      team_role_for_member: {
        Args: { p_member?: string }
        Returns: Database["public"]["Enums"]["team_role"]
      }
      valid_checkup_weekdays: { Args: { p_days: number[] }; Returns: boolean }
    }
    Enums: {
      catalog_lifecycle: "draft" | "published" | "archived"
      catalog_visibility: "private" | "public"
      catalog_moderation_status: "visible" | "hidden" | "removed"
      catalog_report_status: "open" | "reviewing" | "resolved" | "dismissed"
      catalog_sync_status: "never" | "running" | "ok" | "failed" | "quarantined" | "disabled"
      catalog_share_mode: "private" | "workspace"
      day_type: "training" | "rest"
      delivery_status: "scheduled" | "active" | "complete" | "cancelled"
      delivery_sync_mode: "snapshot" | "follow"
      link_status: "active" | "expired" | "revoked"
      team_role: "viewer" | "chat" | "head_coach" | "sales"
      user_role: "admin" | "coach" | "player"
      workout_section_format:
        | "standard"
        | "interval"
        | "amrap"
        | "timed"
        | "freestyle"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      catalog_lifecycle: ["draft", "published", "archived"],
      catalog_share_mode: ["private", "workspace"],
      day_type: ["training", "rest"],
      delivery_status: ["scheduled", "active", "complete", "cancelled"],
      delivery_sync_mode: ["snapshot", "follow"],
      link_status: ["active", "expired", "revoked"],
      team_role: ["viewer", "chat", "head_coach", "sales"],
      user_role: ["admin", "coach", "player"],
      workout_section_format: [
        "standard",
        "interval",
        "amrap",
        "timed",
        "freestyle",
      ],
    },
  },
} as const
