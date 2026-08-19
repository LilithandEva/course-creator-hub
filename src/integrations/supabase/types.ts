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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_chunks: {
        Row: {
          content: string
          course_id: string
          created_at: string
          document_id: string
          id: string
          position: number
          tsv: unknown
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          document_id: string
          id?: string
          position?: number
          tsv?: unknown
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          document_id?: string
          id?: string
          position?: number
          tsv?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "course_chunks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "course_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      course_documents: {
        Row: {
          chunk_count: number
          course_id: string
          created_at: string
          id: string
          name: string
          storage_path: string
        }
        Insert: {
          chunk_count?: number
          course_id: string
          created_at?: string
          id?: string
          name: string
          storage_path: string
        }
        Update: {
          chunk_count?: number
          course_id?: string
          created_at?: string
          id?: string
          name?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_documents_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          currency: string
          description: string
          id: string
          is_published: boolean
          monthly_price_cents: number
          price_cents: number
          slug: string
          subscription_enabled: boolean
          subtitle: string
          title: string
          updated_at: string
          yearly_price_cents: number
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string
          id?: string
          is_published?: boolean
          monthly_price_cents?: number
          price_cents?: number
          slug: string
          subscription_enabled?: boolean
          subtitle?: string
          title: string
          updated_at?: string
          yearly_price_cents?: number
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string
          id?: string
          is_published?: boolean
          monthly_price_cents?: number
          price_cents?: number
          slug?: string
          subscription_enabled?: boolean
          subtitle?: string
          title?: string
          updated_at?: string
          yearly_price_cents?: number
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completion_email_sent_at: string | null
          course_id: string
          created_at: string
          id: string
          source: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          completion_email_sent_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          source?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          completion_email_sent_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          source?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_settings: {
        Row: {
          about_body: string
          about_title: string
          accent_color: string
          benefits: Json
          certificate_body: string
          certificate_title: string
          course_id: string | null
          curriculum_description: string
          curriculum_title: string
          faq: Json
          featured_logos: Json
          font_family: string
          free_lesson_subtitle: string
          free_lesson_title: string
          free_lesson_video_url: string | null
          gallery: Json
          guarantee_body: string
          guarantee_title: string
          hero_cta: string
          hero_subtitle: string
          hero_title: string
          id: string
          og_image_url: string | null
          primary_color: string
          rating_average: number
          reviews_count: number
          social_proof_note: string
          students_count: number
          syllabus_description: string
          syllabus_pdf_path: string | null
          syllabus_title: string
          updated_at: string
        }
        Insert: {
          about_body?: string
          about_title?: string
          accent_color?: string
          benefits?: Json
          certificate_body?: string
          certificate_title?: string
          course_id?: string | null
          curriculum_description?: string
          curriculum_title?: string
          faq?: Json
          featured_logos?: Json
          font_family?: string
          free_lesson_subtitle?: string
          free_lesson_title?: string
          free_lesson_video_url?: string | null
          gallery?: Json
          guarantee_body?: string
          guarantee_title?: string
          hero_cta?: string
          hero_subtitle?: string
          hero_title?: string
          id?: string
          og_image_url?: string | null
          primary_color?: string
          rating_average?: number
          reviews_count?: number
          social_proof_note?: string
          students_count?: number
          syllabus_description?: string
          syllabus_pdf_path?: string | null
          syllabus_title?: string
          updated_at?: string
        }
        Update: {
          about_body?: string
          about_title?: string
          accent_color?: string
          benefits?: Json
          certificate_body?: string
          certificate_title?: string
          course_id?: string | null
          curriculum_description?: string
          curriculum_title?: string
          faq?: Json
          featured_logos?: Json
          font_family?: string
          free_lesson_subtitle?: string
          free_lesson_title?: string
          free_lesson_video_url?: string | null
          gallery?: Json
          guarantee_body?: string
          guarantee_title?: string
          hero_cta?: string
          hero_subtitle?: string
          hero_title?: string
          id?: string
          og_image_url?: string | null
          primary_color?: string
          rating_average?: number
          reviews_count?: number
          social_proof_note?: string
          students_count?: number
          syllabus_description?: string
          syllabus_pdf_path?: string | null
          syllabus_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_settings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          name: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          name: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          name?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string
          created_at: string
          duration_minutes: number | null
          id: string
          module_id: string
          position: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id: string
          position?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id?: string
          position?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string
          has_quiz: boolean
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string
          has_quiz?: boolean
          id?: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string
          has_quiz?: boolean
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          course_id: string
          created_at: string
          currency: string
          email: string | null
          id: string
          provider: string
          provider_payment_intent: string | null
          provider_session_id: string | null
          receipt_url: string | null
          refunded_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number
          course_id: string
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          provider?: string
          provider_payment_intent?: string | null
          provider_session_id?: string | null
          receipt_url?: string | null
          refunded_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          course_id?: string
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          provider?: string
          provider_payment_intent?: string | null
          provider_session_id?: string | null
          receipt_url?: string | null
          refunded_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_access: {
        Row: {
          claimed_at: string | null
          course_id: string
          created_at: string
          email: string
          id: string
          stripe_session_id: string | null
        }
        Insert: {
          claimed_at?: string | null
          course_id: string
          created_at?: string
          email: string
          id?: string
          stripe_session_id?: string | null
        }
        Update: {
          claimed_at?: string | null
          course_id?: string
          created_at?: string
          email?: string
          id?: string
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          correct_count: number
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          correct_count: number
          created_at?: string
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          id: string
          is_correct: boolean
          label: string
          position: number
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          label: string
          position?: number
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          label?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: string
          position: number
          prompt: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          prompt: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          prompt?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          module_id: string
          pass_score: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          pass_score?: number
          title?: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          pass_score?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: true
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          course_id: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          course_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          course_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          name: string
          photo_url: string | null
          position: number
          quote: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          name: string
          photo_url?: string | null
          position?: number
          quote: string
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          name?: string
          photo_url?: string | null
          position?: number
          quote?: string
          role?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          environment: string
          id: string
          payload: Json | null
          processed_at: string
          type: string
        }
        Insert: {
          created_at?: string
          environment?: string
          id: string
          payload?: Json | null
          processed_at?: string
          type: string
        }
        Update: {
          created_at?: string
          environment?: string
          id?: string
          payload?: Json | null
          processed_at?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_lesson: { Args: { _lesson_id: string }; Returns: boolean }
      can_access_module: { Args: { _module_id: string }; Returns: boolean }
      can_read_course_file: { Args: { _path: string }; Returns: boolean }
      can_read_syllabus: { Args: never; Returns: boolean }
      get_quiz_for_student: { Args: { _quiz_id: string }; Returns: Json }
      has_active_subscription: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_course_access: { Args: { _course_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_restricted_asset: { Args: { _name: string }; Returns: boolean }
      public_curriculum: { Args: { _course_id: string }; Returns: Json }
      search_course_chunks: {
        Args: { _course_id: string; _limit?: number; _query: string }
        Returns: {
          content: string
          rank: number
        }[]
      }
      submit_quiz: { Args: { _answers: Json; _quiz_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
