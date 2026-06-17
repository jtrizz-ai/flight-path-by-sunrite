import { Client } from '@notionhq/client';
import { Module, ContentBlock, Tag, NotionPage, NotionBlock, NotionDatabaseResponse, NotionBlocksResponse } from '../types/module.types';

export class NotionService {
  private client: Client;
  private databaseId: string;

  constructor() {
    const apiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!apiKey || !databaseId) {
      throw new Error('NOTION_API_KEY and NOTION_DATABASE_ID must be set in environment variables');
    }

    this.client = new Client({ auth: apiKey });
    this.databaseId = databaseId;
  }

  /**
   * Fetch all modules from the Notion database
   * Returns basic module info without content blocks
   */
  async getAllModules(): Promise<Module[]> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databaseId,
      }) as NotionDatabaseResponse;

      const modules: Module[] = response.results.map((page: NotionPage) =>
        this.parseModulePage(page)
      );

      return modules;
    } catch (error) {
      console.error('Error fetching modules from Notion:', error);
      throw new Error('Failed to fetch modules from Notion');
    }
  }

  /**
   * Fetch a single module by ID with full content blocks
   */
  async getModuleById(moduleId: string): Promise<Module> {
    try {
      // First, get the page properties
      const page = await this.client.pages.retrieve({ page_id: moduleId }) as NotionPage;
      const module = this.parseModulePage(page);

      // Then, get all content blocks
      const contentBlocks = await this.getModuleContentBlocks(moduleId);
      module.contentBlocks = contentBlocks;

      return module;
    } catch (error) {
      console.error(`Error fetching module ${moduleId} from Notion:`, error);
      throw new Error('Failed to fetch module from Notion');
    }
  }

  /**
   * Get all content blocks for a module page
   */
  private async getModuleContentBlocks(pageId: string): Promise<ContentBlock[]> {
    const blocks: ContentBlock[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      try {
        const response = await this.client.blocks.children.list({
          block_id: pageId,
          start_cursor: startCursor,
        }) as NotionBlocksResponse;

        const pageBlocks = response.results.map((block: NotionBlock) =>
          this.parseNotionBlock(block)
        ).filter((block): block is ContentBlock => block !== null);

        blocks.push(...pageBlocks);

        hasMore = response.has_more;
        startCursor = response.next_cursor || undefined;
      } catch (error) {
        console.error('Error fetching content blocks:', error);
        break;
      }
    }

    return blocks;
  }

  /**
   * Parse a Notion page into a Module object
   */
  private parseModulePage(page: NotionPage): Module {
    const properties = page.properties;

    // Extract title from the first title-type property
    let title = 'Untitled';
    for (const key in properties) {
      if (properties[key].type === 'title' && properties[key].title?.length > 0) {
        title = properties[key].title[0].plain_text;
        break;
      }
    }

    // Extract tags from multi_select properties
    const tags: Tag[] = [];
    for (const key in properties) {
      if (properties[key].type === 'multi_select' && Array.isArray(properties[key].multi_select)) {
        properties[key].multi_select.forEach((tag: any) => {
          tags.push({
            id: tag.id,
            name: tag.name,
            color: tag.color,
          });
        });
        break; // Use first multi_select property found
      }
    }

    // Extract verified status from checkbox properties
    let verified = false;
    for (const key in properties) {
      if (properties[key].type === 'checkbox') {
        verified = properties[key].checkbox;
        break;
      }
    }

    return {
      id: page.id,
      title,
      tags,
      lastEditedTime: page.last_edited_time,
      verified,
    };
  }

  /**
   * Parse a Notion block into a ContentBlock object
   * Returns null for unsupported block types
   */
  private parseNotionBlock(block: NotionBlock): ContentBlock | null {
    const blockType = block.type;

    // Helper to extract text from rich_text array
    const extractText = (richText: any[]): string => {
      if (!richText || richText.length === 0) return '';
      return richText.map(rt => rt.text?.content || '').join('');
    };

    switch (blockType) {
      case 'paragraph':
        return {
          type: 'paragraph',
          text: extractText(block.paragraph?.rich_text || []),
        };

      case 'heading_1':
        return {
          type: 'heading_1',
          text: extractText(block.heading_1?.rich_text || []),
          level: 1,
        };

      case 'heading_2':
        return {
          type: 'heading_2',
          text: extractText(block.heading_2?.rich_text || []),
          level: 2,
        };

      case 'heading_3':
        return {
          type: 'heading_3',
          text: extractText(block.heading_3?.rich_text || []),
          level: 3,
        };

      case 'bulleted_list_item':
        return {
          type: 'bullet_list',
          text: extractText(block.bulleted_list_item?.rich_text || []),
        };

      case 'numbered_list_item':
        return {
          type: 'numbered_list',
          text: extractText(block.numbered_list_item?.rich_text || []),
        };

      case 'to_do':
        return {
          type: 'todo',
          text: extractText(block.to_do?.rich_text || []),
          checked: block.to_do?.checked || false,
        };

      default:
        // Skip unsupported block types
        return null;
    }
  }
}
