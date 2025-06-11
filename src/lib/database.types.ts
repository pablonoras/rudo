export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'coach' | 'athlete'
          full_name: string
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'coach' | 'athlete'
          full_name: string
          email: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'coach' | 'athlete'
          full_name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      coach_athletes: {
        Row: {
          id: string
          coach_id: string
          athlete_id: string
          joined_at: string
          status: string
        }
        Insert: {
          id?: string
          coach_id: string
          athlete_id: string
          joined_at?: string
          status?: string
        }
        Update: {
          id?: string
          coach_id?: string
          athlete_id?: string
          joined_at?: string
          status?: string
        }
      }
      programs: {
        Row: {
          id: string
          coach_id: string
          name: string
          description: string | null
          duration_weeks: number
          start_date: string
          end_date: string
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          description?: string | null
          duration_weeks: number
          start_date?: string
          end_date?: string
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          name?: string
          description?: string | null
          duration_weeks?: number
          start_date?: string
          end_date?: string
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
      },
      workouts: {
        Row: {
          workout_id: string
          coach_id: string
          description: string
          color: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          workout_id?: string
          coach_id: string
          description: string
          color?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          workout_id?: string
          coach_id?: string
          description?: string
          color?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      workout_assignments: {
        Row: {
          id: string
          workout_id: string
          athlete_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          athlete_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          athlete_id?: string
          created_at?: string
          updated_at?: string
        }
      },
      program_workouts: {
        Row: {
          id: string
          program_id: string
          workout_id: string
          workout_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          program_id: string
          workout_id: string
          workout_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          program_id?: string
          workout_id?: string
          workout_date?: string
          created_at?: string
          updated_at?: string
        }
      },
      program_assignments: {
        Row: {
          id: string
          program_id: string
          athlete_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          program_id: string
          athlete_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          program_id?: string
          athlete_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'coach' | 'athlete'
    }
  }
}