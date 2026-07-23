// Hand-authored to match supabase/migrations, structured to satisfy
// @supabase/supabase-js type inference (each table needs Row/Insert/Update +
// Relationships). Regenerate from the live DB once you have a CLI access token:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts

export type UserRole = 'admin' | 'coach' | 'player';
export type DayType = 'training' | 'rest';
export type LinkStatus = 'active' | 'expired' | 'revoked';

// ---- Row shapes (also exported for app use) ----

export type Profile = {
  id: string;
  role: UserRole;
  email: string;
  name: string | null;
  created_at: string;
}

export type CoachPlayerLink = {
  id: string;
  coach_id: string;
  player_id: string | null;   // null = unclaimed (no player yet)
  subscription_key: string;
  subscription_end_date: string;
  status: LinkStatus;
  is_vip: boolean;
  checkup_days_per_week: number;
  checkup_weekdays: number[];
  key_generated_by: string | null;
  key_generated_at: string | null;
  created_at: string;
}

export type ProgramDay = {
  id: string;
  player_id: string;
  coach_id: string;
  week_number: number;
  day_of_week: number;
  day_type: DayType;
  title: string | null;
  diet_plan: string | null;
  created_at: string;
  updated_at: string;
}

export type Workout = {
  id: string;
  program_day_id: string;
  position: number;
  name: string;
  template_id: string | null;
  created_at: string;
}

export type Exercise = {
  id: string;
  workout_id: string;
  program_day_id: string | null; // legacy; new rows use workout_id
  position: number;
  name: string;
  template_exercise_id: string | null;
  is_template_override: boolean;
  target_sets: number | null;
  target_reps: string | null;
  target_weight: string | null;
  target_seconds: number | null;
  tempo: string | null;
  coach_video_url: string | null;
  coach_video_is_external: boolean;
  coach_comment: string | null;
  created_at: string;
}

export type ExerciseLog = {
  id: string;
  exercise_id: string;
  player_id: string;
  log_date: string;
  actual_sets: number | null;
  actual_reps: string | null;
  actual_weight: string | null;
  player_video_url: string | null;
  player_video_is_external: boolean;
  player_video_viewed_at: string | null;
  player_video_delete_after: string | null;
  player_comment: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type SetLog = {
  id: string;
  exercise_log_id: string;
  set_number: number;
  reps: string | null;
  weight: string | null;
  created_at: string;
}

export type Message = {
  id: string;
  coach_id: string;
  player_id: string;
  exercise_id: string | null;
  body: string;
  created_at: string;
}

export type Checkup = {
  id: string;
  coach_id: string;
  player_id: string;
  check_date: string;
  is_checked: boolean;
  created_at: string;
}

export type CoachKey = {
  id: string;
  key: string;
  status: LinkStatus;
  claimed_by: string | null;
  created_by: string | null;
  created_at: string;
}

export type DietFoodItem = {
  food: string;   // food type name (from coach's food library)
  grams: string;  // amount, e.g. "150"
  unit?: 'grams' | 'quantity'; // old rows without a unit are treated as grams
  quantity?: string; // count for whole foods, e.g. "2" eggs
  quantityUnit?: string; // recipe units such as tbsp, cup, or item
}

export type DietRecipeSnapshot = { id:string; title:string; servings:number; instructions:string|null; videoUrl?:string|null; preparationSteps?:Array<{text:string;imageUrl:string}>; cookingSteps?:Array<{text:string;imageUrl:string}>; nutrition?:{calories:number|null;protein:number|null;carbs:number|null;fat:number|null}; dietaryLabels?:string[]; ingredients:Array<{food:string;quantity:string;unit:string}> }

export type DietMeal = {
  type: 'meal' | 'snack';
  label: string;
  content: string;        // legacy free text (kept for old rows)
  items?: DietFoodItem[]; // structured food items
  recipe?: DietRecipeSnapshot | null;
  recipes?: DietRecipeSnapshot[]; // additive recipes; recipe remains for old saved days
}

export type CoachFood = {
  id: string;
  coach_id: string;
  name: string;
  measure: 'grams' | 'quantity';
  amount: string;
  created_at: string;
}

export type DietDay = {
  id: string;
  player_id: string;
  coach_id: string;
  week_number: number;
  day_of_week: number;
  meals: DietMeal[];
  comment: string | null;
  template_id: string | null;
  is_template_override: boolean;
  created_at: string;
  updated_at: string;
}

export type DietLog = {
  id: string;
  diet_day_id: string;
  player_id: string;
  coach_id: string;
  log_date: string;
  completed_meals: number;
  total_meals: number;
  player_comment: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminMessage = {
  id: string;
  coach_id: string;
  sender_id: string;
  body: string;
  attachment_path: string | null;
  attachment_type: string | null;
  created_at: string;
}

export type ChatMessage = {
  id: string;
  coach_id: string;
  player_id: string;
  sender_id: string;
  body: string;
  attachment_path: string | null;
  attachment_type: 'image' | 'video' | 'audio' | null;
  created_at: string;
}

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          role?: UserRole;
          email: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          email?: string;
          name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      coach_player_links: {
        Row: CoachPlayerLink;
        Insert: {
          id?: string;
          coach_id: string;
          player_id: string;
          subscription_key: string;
          subscription_end_date: string;
          status?: LinkStatus;
          is_vip?: boolean;
          checkup_days_per_week?: number;
          checkup_weekdays?: number[];
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          player_id?: string;
          subscription_key?: string;
          subscription_end_date?: string;
          status?: LinkStatus;
          is_vip?: boolean;
          checkup_days_per_week?: number;
          checkup_weekdays?: number[];
          created_at?: string;
        };
        Relationships: [];
      };
      program_days: {
        Row: ProgramDay;
        Insert: {
          id?: string;
          player_id: string;
          coach_id: string;
          week_number: number;
          day_of_week: number;
          day_type?: DayType;
          title?: string | null;
          diet_plan?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          coach_id?: string;
          week_number?: number;
          day_of_week?: number;
          day_type?: DayType;
          title?: string | null;
          diet_plan?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: Workout;
        Insert: {
          id?: string;
          program_day_id: string;
          position?: number;
          name?: string | null;
          template_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          program_day_id?: string;
          position?: number;
          name?: string;
          template_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workout_templates: {
        Row: { id: string; coach_id: string; name: string; created_at: string };
        Insert: { id?: string; coach_id: string; name: string; created_at?: string };
        Update: { id?: string; coach_id?: string; name?: string; created_at?: string };
        Relationships: [];
      };
      workout_template_exercises: {
        Row: { id: string; template_id: string; position: number; name: string; target_sets: number | null; target_reps: string | null; target_weight: string | null; target_seconds: number | null; tempo: string | null; coach_video_url: string | null; coach_video_is_external: boolean; coach_comment: string | null; created_at: string };
        Insert: { id?: string; template_id: string; position?: number; name: string; target_sets?: number | null; target_reps?: string | null; target_weight?: string | null; target_seconds?: number | null; tempo?: string | null; coach_video_url?: string | null; coach_video_is_external?: boolean; coach_comment?: string | null; created_at?: string };
        Update: { id?: string; template_id?: string; position?: number; name?: string; target_sets?: number | null; target_reps?: string | null; target_weight?: string | null; target_seconds?: number | null; tempo?: string | null; coach_video_url?: string | null; coach_video_is_external?: boolean; coach_comment?: string | null; created_at?: string };
        Relationships: [];
      };
      exercises: {
        Row: Exercise;
        Insert: {
          id?: string;
          workout_id: string;
          program_day_id?: string | null;
          position?: number;
          name?: string | null;
          template_exercise_id?: string | null;
          is_template_override?: boolean;
          target_sets?: number | null;
          target_reps?: string | null;
          target_weight?: string | null;
          target_seconds?: number | null;
          tempo?: string | null;
          coach_video_url?: string | null;
          coach_video_is_external?: boolean;
          coach_comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          program_day_id?: string | null;
          position?: number;
          name?: string;
          template_exercise_id?: string | null;
          is_template_override?: boolean;
          target_sets?: number | null;
          target_reps?: string | null;
          target_weight?: string | null;
          target_seconds?: number | null;
          tempo?: string | null;
          coach_video_url?: string | null;
          coach_video_is_external?: boolean;
          coach_comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      exercise_logs: {
        Row: ExerciseLog;
        Insert: {
          id?: string;
          exercise_id: string;
          player_id: string;
          log_date?: string;
          actual_sets?: number | null;
          actual_reps?: string | null;
          actual_weight?: string | null;
          player_video_url?: string | null;
          player_video_is_external?: boolean;
          player_video_viewed_at?: string | null;
          player_video_delete_after?: string | null;
          player_comment?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          player_id?: string;
          log_date?: string;
          actual_sets?: number | null;
          actual_reps?: string | null;
          actual_weight?: string | null;
          player_video_url?: string | null;
          player_video_is_external?: boolean;
          player_video_viewed_at?: string | null;
          player_video_delete_after?: string | null;
          player_comment?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      set_logs: {
        Row: SetLog;
        Insert: {
          id?: string;
          exercise_log_id: string;
          set_number: number;
          reps?: string | null;
          weight?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          exercise_log_id?: string;
          set_number?: number;
          reps?: string | null;
          weight?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: {
          id?: string;
          coach_id: string;
          player_id: string;
          exercise_id?: string | null;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          player_id?: string;
          exercise_id?: string | null;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      checkups: {
        Row: Checkup;
        Insert: {
          id?: string;
          coach_id: string;
          player_id: string;
          check_date?: string;
          is_checked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          player_id?: string;
          check_date?: string;
          is_checked?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      coach_keys: {
        Row: CoachKey;
        Insert: {
          id?: string;
          key: string;
          status?: LinkStatus;
          claimed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          status?: LinkStatus;
          claimed_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      coach_foods: {
        Row: CoachFood;
        Insert: {
          id?: string;
          coach_id: string;
          name: string;
          measure?: 'grams' | 'quantity';
          amount?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          name?: string;
          measure?: 'grams' | 'quantity';
          amount?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      diet_days: {
        Row: DietDay;
        Insert: {
          id?: string;
          player_id: string;
          coach_id: string;
          week_number: number;
          day_of_week: number;
          meals?: DietMeal[];
          comment?: string | null;
          template_id?: string | null;
          is_template_override?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          coach_id?: string;
          week_number?: number;
          day_of_week?: number;
          meals?: DietMeal[];
          comment?: string | null;
          template_id?: string | null;
          is_template_override?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      diet_templates: {
        Row: { id: string; coach_id: string; name: string; meals: DietMeal[]; comment: string | null; created_at: string };
        Insert: { id?: string; coach_id: string; name: string; meals?: DietMeal[]; comment?: string | null; created_at?: string };
        Update: { id?: string; coach_id?: string; name?: string; meals?: DietMeal[]; comment?: string | null; created_at?: string };
        Relationships: [];
      };
      diet_logs: {
        Row: DietLog;
        Insert: {
          id?: string;
          diet_day_id: string;
          player_id: string;
          coach_id: string;
          log_date: string;
          completed_meals: number;
          total_meals: number;
          player_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          diet_day_id?: string;
          player_id?: string;
          coach_id?: string;
          log_date?: string;
          completed_meals?: number;
          total_meals?: number;
          player_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: {
          id?: string;
          coach_id: string;
          player_id: string;
          sender_id: string;
          body: string;
          attachment_path?: string | null;
          attachment_type?: 'image' | 'video' | 'audio' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          player_id?: string;
          sender_id?: string;
          body?: string;
          attachment_path?: string | null;
          attachment_type?: 'image' | 'video' | 'audio' | null;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_messages: {
        Row: AdminMessage;
        Insert: {
          id?: string;
          coach_id: string;
          sender_id: string;
          body?: string;
          attachment_path?: string | null;
          attachment_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          sender_id?: string;
          body?: string;
          attachment_path?: string | null;
          attachment_type?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      check_coach_key: {
        Args: { p_key: string };
        Returns: boolean;
      };
      check_subscription_key: {
        Args: { p_key: string };
        Returns: boolean;
      };
      claim_coach_key: {
        Args: { p_key: string };
        Returns: undefined;
      };
      claim_subscription_key: {
        Args: { p_key: string };
        Returns: CoachPlayerLink;
      };
      admin_create_key: {
        Args: { p_coach_id: string; p_key: string; p_end_date: string };
        Returns: CoachPlayerLink;
      };
      admin_update_key: {
        Args: { p_key_id: string; p_end_date: string; p_status: LinkStatus };
        Returns: CoachPlayerLink;
      };
      admin_create_coach_key: {
        Args: { p_key: string };
        Returns: CoachKey;
      };
      coach_create_player_key: {
        Args: { p_player_id: string; p_end_date: string };
        Returns: CoachPlayerLink;
      };
      coach_create_unclaimed_key: {
        Args: { p_end_date: string };
        Returns: CoachPlayerLink;
      };
      admin_revoke_coach_key: {
        Args: { p_key_id: string };
        Returns: CoachKey;
      };
      mark_player_video_viewed: {
        Args: { p_log_id: string };
        Returns: string;
      };
      get_progress_options: {
        Args: { p_player_id: string };
        Returns: unknown;
      };
      get_progress_page: {
        Args: { p_player_id: string; p_workout?: string | null; p_exercise?: string | null; p_start?: string | null; p_end?: string | null; p_limit?: number; p_offset?: number };
        Returns: unknown;
      };
      get_coach_chat_threads: {
        Args: { p_coach_id: string };
        Returns: Array<{
          player_id: string;
          sender_id: string;
          body: string;
          attachment_type: string | null;
          created_at: string;
        }>;
      };
      save_workout_as_template: { Args: { p_workout_id: string }; Returns: string };
      assign_workout_template: { Args: { p_program_day_id: string; p_template_id: string; p_position?: number }; Returns: string };
      save_diet_as_template: { Args: { p_diet_day_id: string; p_name: string }; Returns: string };
      assign_diet_template: { Args: { p_player_id: string; p_week: number; p_day_of_week: number; p_template_id: string }; Returns: string };
      replace_program_import: {
        Args: { p_player_id: string; p_days: unknown };
        Returns: { daysCreated: number; workoutsCreated: number; exercisesCreated: number };
      };
      replace_diet_import: {
        Args: { p_player_id: string; p_days: unknown; p_foods: unknown };
        Returns: { daysCreated: number; mealsCreated: number; foodsCreated: number };
      };
    };
    Enums: {
      user_role: UserRole;
      day_type: DayType;
      link_status: LinkStatus;
    };
    CompositeTypes: Record<never, never>;
  };
}
