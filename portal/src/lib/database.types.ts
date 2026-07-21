export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          whatsapp: string | null;
          program_interest: string | null;
          city: string | null;
          role: "participant" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          whatsapp?: string | null;
          program_interest?: string | null;
          city?: string | null;
          role?: "participant" | "admin";
        };
        Update: {
          full_name?: string;
          whatsapp?: string | null;
          program_interest?: string | null;
          city?: string | null;
          role?: "participant" | "admin";
        };
        Relationships: [];
      };
      pimsleur_results: {
        Row: {
          id: string;
          user_id: string;
          answers: Json;
          score_section2: number;
          score_section3: number;
          score_section4: number;
          score_section5: number;
          score_section6: number;
          score_verbal: number;
          score_audio: number;
          score_total: number;
          grade: string;
          grade_label: string;
          status_label: string;
          recommendation: string;
          duration_seconds: number | null;
          started_at: string;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          answers?: Json;
          score_section2: number;
          score_section3: number;
          score_section4: number;
          score_section5: number;
          score_section6: number;
          score_verbal: number;
          score_audio: number;
          score_total: number;
          grade: string;
          grade_label: string;
          status_label: string;
          recommendation: string;
          duration_seconds?: number | null;
          started_at?: string;
          completed_at?: string;
        };
        Update: {
          answers?: Json;
          score_total?: number;
          grade?: string;
        };
        Relationships: [];
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          registration_status: string;
          payment_status: "pending" | "paid" | "verified";
          language_test_status: "locked" | "available" | "in_progress" | "completed";
          character_test_status: "locked" | "available" | "in_progress" | "completed";
          result_status: "locked" | "available" | "completed";
          consultation_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          registration_status?: string;
          payment_status?: string;
          language_test_status?: string;
          character_test_status?: string;
          result_status?: string;
          consultation_status?: string;
        };
        Update: {
          registration_status?: string;
          payment_status?: string;
          language_test_status?: string;
          character_test_status?: string;
          result_status?: string;
          consultation_status?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          order_id: string;
          amount: number;
          status: string;
          midtrans_transaction_id: string | null;
          payment_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          order_id: string;
          amount: number;
          status?: string;
          midtrans_transaction_id?: string | null;
          payment_type?: string;
        };
        Update: {
          status?: string;
          midtrans_transaction_id?: string | null;
        };
        Relationships: [];
      };
      test_questions: {
        Row: {
          id: string;
          test_type: "language" | "character";
          question_text: string;
          options: { label: string; value: string }[];
          correct_answer: string;
          order_index: number;
          active: boolean;
          created_at?: string;
        };
        Insert: {
          test_type: string;
          question_text: string;
          options?: Json;
          correct_answer: string;
          order_index?: number;
          active?: boolean;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      test_sessions: {
        Row: {
          id: string;
          user_id: string;
          test_type: string;
          started_at: string;
          completed_at: string | null;
          score: number | null;
          passed: boolean | null;
        };
        Insert: {
          user_id: string;
          test_type: string;
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
          passed?: boolean | null;
        };
        Update: {
          completed_at?: string | null;
          score?: number | null;
          passed?: boolean | null;
        };
        Relationships: [];
      };
      test_answers: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          answer: string | null;
          is_correct: boolean | null;
        };
        Insert: {
          session_id: string;
          question_id: string;
          answer?: string | null;
          is_correct?: boolean | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          certificate_code: string;
          score: number;
          recommendation: string;
          issued_at: string;
        };
        Insert: {
          user_id: string;
          certificate_code: string;
          score: number;
          recommendation: string;
          issued_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserProgress = Database["public"]["Tables"]["user_progress"]["Row"];
export type PimsleurResult = Database["public"]["Tables"]["pimsleur_results"]["Row"];

export const PROGRESS_STEPS = [
  { key: "registration", label: "Registrasi & akun peserta", field: "registration_status" as const },
  { key: "payment", label: "Verifikasi pembayaran", field: "payment_status" as const },
  { key: "language", label: "Tes Pimsleur (bahasa)", field: "language_test_status" as const },
  { key: "character", label: "Papikostik (menyusul)", field: "character_test_status" as const },
  { key: "result", label: "Hasil Pimsleur", field: "result_status" as const },
  { key: "consultation", label: "Konsultasi lanjutan", field: "consultation_status" as const },
] as const;
