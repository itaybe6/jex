export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          price: number
          image_url: string
          user_id: string
          category: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          price: number
          image_url: string
          user_id: string
          category: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          price?: number
          image_url?: string
          user_id?: string
          category?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          full_name: string
          avatar_url: string | null
          title: string | null
          bio: string | null
        }
        Insert: {
          id: string
          created_at?: string
          full_name: string
          avatar_url?: string | null
          title?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string
          avatar_url?: string | null
          title?: string | null
          bio?: string | null
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
      [_ in never]: never
    }
  }
}