// Database types matching Supabase schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'basic' | 'premium'
          created_at: string
          updated_at: string
          last_active_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'basic' | 'premium'
          created_at?: string
          updated_at?: string
          last_active_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'basic' | 'premium'
          created_at?: string
          updated_at?: string
          last_active_at?: string
        }
      }
      notion_pages: {
        Row: {
          id: string
          notion_page_id: string
          parent_page_id: string | null
          title: string
          content: any
          url: string | null
          icon: string | null
          cover: string | null
          is_hidden: boolean
          subscription_required: 'free' | 'basic' | 'premium' | null
          slug: string
          order_index: number | null
          last_synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          notion_page_id: string
          parent_page_id?: string | null
          title: string
          content?: any
          url?: string | null
          icon?: string | null
          cover?: string | null
          is_hidden?: boolean
          subscription_required?: 'free' | 'basic' | 'premium' | null
          slug?: string
          order_index?: number | null
          last_synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          notion_page_id?: string
          parent_page_id?: string | null
          title?: string
          content?: any
          url?: string | null
          icon?: string | null
          cover?: string | null
          is_hidden?: boolean
          subscription_required?: 'free' | 'basic' | 'premium' | null
          slug?: string
          order_index?: number | null
          last_synced_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      page_versions: {
        Row: {
          id: string
          page_id: string
          content: any
          version_number: number
          change_summary: string | null
          created_at: string
        }
        Insert: {
          id?: string
          page_id: string
          content: any
          version_number: number
          change_summary?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          content?: any
          version_number?: number
          change_summary?: string | null
          created_at?: string
        }
      }
      crawl_logs: {
        Row: {
          id: string
          status: 'running' | 'completed' | 'failed'
          pages_processed: number
          pages_created: number
          pages_updated: number
          error_message: string | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          status?: 'running' | 'completed' | 'failed'
          pages_processed?: number
          pages_created?: number
          pages_updated?: number
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          status?: 'running' | 'completed' | 'failed'
          pages_processed?: number
          pages_created?: number
          pages_updated?: number
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
      }
      admin_settings: {
        Row: {
          key: string
          value: any
          updated_at: string
        }
        Insert: {
          key: string
          value: any
          updated_at?: string
        }
        Update: {
          key?: string
          value?: any
          updated_at?: string
        }
      }
    }
  }
}
