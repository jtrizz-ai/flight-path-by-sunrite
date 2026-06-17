// Core data types for the Flight Path App

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface ContentBlock {
  type: 'paragraph' | 'heading_1' | 'heading_2' | 'heading_3' | 'bullet_list' | 'numbered_list' | 'todo' | 'callout' | 'quote' | 'divider' | 'code';
  text: string;
  checked?: boolean; // For todo items
  level?: number; // For headings (1, 2, or 3)
  emoji?: string; // For callout blocks
  language?: string; // For code blocks
}

export interface Module {
  id: string;
  title: string;
  tags: Tag[];
  lastEditedTime: string; // ISO 8601 timestamp
  verified: boolean;
  contentBlocks?: ContentBlock[]; // Only populated when fetching single module
}

// Notion API types (simplified for our use case)

export interface NotionProperty {
  type: string;
  [key: string]: any;
}

export interface NotionPageProperties {
  [key: string]: NotionProperty;
}

export interface NotionBlock {
  id: string;
  type: string;
  paragraph?: {
    rich_text: Array<{ type: string; text: { content: string } }>;
  };
  heading_1?: {
    rich_text: Array<{ type: string; text: { content: string } }>;
  };
  heading_2?: {
    rich_text: Array<{ type: string; text: { content: string } }>;
  };
  heading_3?: {
    rich_text: Array<{ type: string; text: { content: string } }>;
  };
  bulleted_list_item?: {
    rich_text: Array<{ type: string; text: { content: string } }>;
  };
  numbered_list_item?: {
    rich_text: Array<{ type: string; text: { content: string } }>;
  };
  to_do?: {
    rich_text: Array<{ type: string; text: { content: string } }>;
    checked: boolean;
  };
  callout?: {
    rich_text: Array<{ type: string; text: { content: string } }>;
    icon?: {
      emoji: string;
    };
  };
  quote?: {
    rich_text: Array<{ type: string; text: { content: string } }>;
  };
  divider?: Record<string, unknown>;
  code?: {
    rich_text: Array<{ type: string; text: { content: string } }>;
    language?: string;
  };
  has_children: boolean;
}

export interface NotionPage {
  id: string;
  properties: NotionPageProperties;
  last_edited_time: string;
}

export interface NotionDatabaseResponse {
  results: NotionPage[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface NotionBlocksResponse {
  results: NotionBlock[];
  next_cursor: string | null;
  has_more: boolean;
}
