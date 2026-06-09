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
      users: {
        Row: {
          id: string
          first_name: string
          last_name: string | null
          mobile_number: string
          email: string
          state: string
          district: string
          village: string | null
          postal_code: string | null
          role: 'farmer' | 'buyer' | 'admin'
          username: string
          whatsapp_number: string | null
          profile_photo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name?: string | null
          mobile_number: string
          email: string
          state: string
          district: string
          village?: string | null
          postal_code?: string | null
          role: 'farmer' | 'buyer' | 'admin'
          username: string
          whatsapp_number?: string | null
          profile_photo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string | null
          mobile_number?: string
          email?: string
          state?: string
          district?: string
          village?: string | null
          postal_code?: string | null
          role?: 'farmer' | 'buyer' | 'admin'
          username?: string
          whatsapp_number?: string | null
          profile_photo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      crops: {
        Row: {
          id: string
          user_id: string
          crop_name: string
          crop_type: string | null
          quantity_quintal: number
          price_per_quintal: number
          photo_url: string | null
          photo_urls: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          crop_name: string
          crop_type?: string | null
          quantity_quintal: number
          price_per_quintal: number
          photo_url?: string | null
          photo_urls?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          crop_name?: string
          crop_type?: string | null
          quantity_quintal?: number
          price_per_quintal?: number
          photo_url?: string | null
          photo_urls?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      support: {
        Row: {
          id: string
          user_id: string | null
          username: string | null
          name: string | null
          email: string | null
          mobile_number: string | null
          role: string | null
          is_registered: boolean
          subject: string
          message: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          username?: string | null
          name?: string | null
          email?: string | null
          mobile_number?: string | null
          role?: string | null
          is_registered?: boolean
          subject: string
          message: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          username?: string | null
          name?: string | null
          email?: string | null
          mobile_number?: string | null
          role?: string | null
          is_registered?: boolean
          subject?: string
          message?: string
          status?: string
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
      user_role: 'farmer' | 'buyer' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type UserProfile = Database['public']['Tables']['users']['Row'];
export type Crop = Database['public']['Tables']['crops']['Row'];
export type SupportTicket = Database['public']['Tables']['support']['Row'];
