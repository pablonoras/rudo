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