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
          updated_at: string
          title: string
          description: string
          price: number
          currency: string
          image_url: string
          thumbnail_url: string | null
          user_id: string
          category: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          price: number
          currency?: string
          image_url: string
          thumbnail_url?: string | null
          user_id: string
          category: string
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          price?: number
          currency?: string
          image_url?: string
          thumbnail_url?: string | null
          user_id?: string
          category?: string
          status?: string
        }
      }
      watch_specs: {
        Row: {
          product_id: string
          brand: string | null
          model: string | null
          diameter: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          product_id: string
          brand?: string | null
          model?: string | null
          diameter?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          product_id?: string
          brand?: string | null
          model?: string | null
          diameter?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      diamond_specs: {
        Row: {
          product_id: string
          shape: string | null
          weight: number | null
          color: string | null
          clarity: string | null
          cut_grade: string | null
          certificate: string | null
          origin: string | null
          lab_grown_type: string | null
          treatment_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          product_id: string
          shape?: string | null
          weight?: number | null
          color?: string | null
          clarity?: string | null
          cut_grade?: string | null
          certificate?: string | null
          origin?: string | null
          lab_grown_type?: string | null
          treatment_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          product_id?: string
          shape?: string | null
          weight?: number | null
          color?: string | null
          clarity?: string | null
          cut_grade?: string | null
          certificate?: string | null
          origin?: string | null
          lab_grown_type?: string | null
          treatment_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      gem_specs: {
        Row: {
          product_id: string
          type: string | null
          origin: string | null
          certification: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          product_id: string
          type?: string | null
          origin?: string | null
          certification?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          product_id?: string
          type?: string | null
          origin?: string | null
          certification?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jewelry_specs: {
        Row: {
          product_id: string
          diamond_size_from: number | null
          diamond_size_to: number | null
          color: string | null
          clarity: string | null
          gold_color: string | null
          material: string | null
          gold_karat: string | null
          side_stones: boolean | null
          cut_grade: string | null
          certification: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          product_id: string
          diamond_size_from?: number | null
          diamond_size_to?: number | null
          color?: string | null
          clarity?: string | null
          gold_color?: string | null
          material?: string | null
          gold_karat?: string | null
          side_stones?: boolean | null
          cut_grade?: string | null
          certification?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          product_id?: string
          diamond_size_from?: number | null
          diamond_size_to?: number | null
          color?: string | null
          clarity?: string | null
          gold_color?: string | null
          material?: string | null
          gold_karat?: string | null
          side_stones?: boolean | null
          cut_grade?: string | null
          certification?: string | null
          created_at?: string
          updated_at?: string
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