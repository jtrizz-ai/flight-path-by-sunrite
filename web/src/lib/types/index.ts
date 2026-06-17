import { Database } from './database'

export type { Database }

// User types
export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'basic' | 'premium'
  created_at: string
  updated_at: string
  last_active_at: string
}

// Notion page types
export interface NotionPage {
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

export interface NotionPageInput {
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
}

// Page version types
export interface PageVersion {
  id: string
  page_id: string
  content: any
  version_number: number
  change_summary: string | null
  created_at: string
}

// Crawl log types
export interface CrawlLog {
  id: string
  status: 'running' | 'completed' | 'failed'
  pages_processed: number
  pages_created: number
  pages_updated: number
  error_message: string | null
  started_at: string
  completed_at: string | null
}

// Admin settings types
export interface AdminSettings {
  key: string
  value: any
  updated_at: string
}

// Content block types (from Notion)
export interface ContentBlock {
  type: 'paragraph' | 'heading_1' | 'heading_2' | 'heading_3' | 'bulleted_list' | 'numbered_list' | 'to_do' | 'toggle' | 'callout' | 'quote' | 'divider' | 'code'
  content: any
  text?: string
  level?: number
  checked?: boolean
  children?: ContentBlock[]
}
