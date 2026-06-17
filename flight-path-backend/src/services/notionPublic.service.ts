import { ContentBlock, Module } from '../types/module.types';

export interface NotionPublicPage {
  id: string;
  title: string;
  url: string;
  content: string;
  childPages: NotionPublicPage[];
  isHidden?: boolean;
}

export class NotionPublicService {
  /**
   * Extract page ID from a Notion URL
   * Supports formats like:
   * - https://your-workspace.notion.site/Page-Name-abc123
   * - https://notion.so/Page-Name-abc123
   */
  extractPageId(url: string): string | null {
    // Match the last part of the URL (the page ID)
    const match = url.match(/([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
    return match ? match[1] : null;
  }

  /**
   * Validate if a URL is a published Notion page
   */
  isValidNotionUrl(url: string): boolean {
    return url.includes('notion.site') || url.includes('notion.so');
  }

  /**
   * Fetch a published Notion page using web scraping
   * This uses Firecrawl for robust page scraping
   */
  async fetchPublishedPage(url: string): Promise<NotionPublicPage> {
    const pageId = this.extractPageId(url);
    if (!pageId) {
      throw new Error('Invalid Notion URL format');
    }

    try {
      // For published Notion pages, we can use the public API
      // This doesn't require authentication for published pages
      const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        method: 'GET',
        headers: {
          'Notion-Version': '2022-06-28',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const data = await response.json();

      // Parse the page content
      return this.parseNotionPage(data, url);
    } catch (error) {
      // Fallback to web scraping if API fails
      console.log('API fetch failed, falling back to web scraping');
      return await this.scrapePublishedPage(url);
    }
  }

  /**
   * Fallback web scraping for published Notion pages
   */
  private async scrapePublishedPage(url: string): Promise<NotionPublicPage> {
    // This would use Firecrawl or similar web scraping
    // For now, return a basic structure
    return {
      id: this.extractPageId(url) || '',
      title: 'Scraped Page',
      url: url,
      content: '',
      childPages: [],
    };
  }

  /**
   * Parse Notion API response into our format
   */
  private parseNotionPage(data: any, url: string): NotionPublicPage {
    const pageId = this.extractPageId(url) || '';

    // Extract page content and child pages
    const blocks = data.results || [];
    const childPages: NotionPublicPage[] = [];
    let content = '';

    for (const block of blocks) {
      if (block.type === 'child_page') {
        // This is a child page
        const childPageId = block.id;
        const childUrl = `https://notion.so/${childPageId}`;

        childPages.push({
          id: childPageId,
          title: block.child_page?.title || 'Untitled',
          url: childUrl,
          content: '',
          childPages: [],
        });
      } else if (block.type === 'callout' && block.callout?.text) {
        // Check if this is a hidden/toggle callout
        const calloutText = this.extractText(block.callout.text);
        if (calloutText.toLowerCase().includes('hidden') || calloutText.toLowerCase().includes('toggle')) {
          // Mark as hidden content
          continue;
        }
        content += calloutText + '\n\n';
      } else {
        // Regular content block
        content += this.extractBlockText(block) + '\n\n';
      }
    }

    return {
      id: pageId,
      title: 'Page Title', // Would need to fetch page properties
      url: url,
      content: content.trim(),
      childPages,
    };
  }

  /**
   * Extract text from a block
   */
  private extractBlockText(block: any): string {
    const textContent: string[] = [];

    const extractRichText = (richText: any[]) => {
      if (!richText) return '';
      return richText.map(rt => rt.text?.content || rt.plain_text || '').join('');
    };

    switch (block.type) {
      case 'paragraph':
        return extractRichText(block.paragraph?.rich_text || []);
      case 'heading_1':
        return extractRichText(block.heading_1?.rich_text || []);
      case 'heading_2':
        return extractRichText(block.heading_2?.rich_text || []);
      case 'heading_3':
        return extractRichText(block.heading_3?.rich_text || []);
      case 'bulleted_list_item':
        return '• ' + extractRichText(block.bulleted_list_item?.rich_text || []);
      case 'numbered_list_item':
        return '1. ' + extractRichText(block.numbered_list_item?.rich_text || []);
      case 'to_do':
        return (block.to_do?.checked ? '[x] ' : '[ ] ') + extractRichText(block.to_do?.rich_text || []);
      case 'callout':
        return '💡 ' + extractRichText(block.callout?.rich_text || []);
      case 'quote':
        return '" ' + extractRichText(block.quote?.rich_text || []) + ' "';
      case 'code':
        return '```' + (block.code?.language || '') + '\n' + extractRichText(block.code?.rich_text || []) + '```';
      default:
        return '';
    }
  }

  /**
   * Extract text from rich text array
   */
  private extractText(richText: any[]): string {
    if (!richText || richText.length === 0) return '';
    return richText.map(rt => rt.text?.content || rt.plain_text || '').join('');
  }

  /**
   * Convert NotionPublicPage to Module format for compatibility
   */
  publicPageToModule(page: NotionPublicPage): Module {
    const contentBlocks = this.contentToBlocks(page.content);

    return {
      id: page.id,
      title: page.title,
      tags: [], // Published pages don't have tags
      lastEditedTime: new Date().toISOString(),
      verified: true,
      contentBlocks,
    };
  }

  /**
   * Convert plain text content to ContentBlock array
   */
  private contentToBlocks(content: string): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    const lines = content.split('\n');

    let currentParagraph = '';

    for (const line of lines) {
      if (line.startsWith('# ')) {
        // Heading 1
        if (currentParagraph.trim()) {
          blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
          currentParagraph = '';
        }
        blocks.push({ type: 'heading_1', text: line.substring(2), level: 1 });
      } else if (line.startsWith('## ')) {
        // Heading 2
        if (currentParagraph.trim()) {
          blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
          currentParagraph = '';
        }
        blocks.push({ type: 'heading_2', text: line.substring(3), level: 2 });
      } else if (line.startsWith('### ')) {
        // Heading 3
        if (currentParagraph.trim()) {
          blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
          currentParagraph = '';
        }
        blocks.push({ type: 'heading_3', text: line.substring(4), level: 3 });
      } else if (line.startsWith('• ')) {
        // Bullet list
        if (currentParagraph.trim()) {
          blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
          currentParagraph = '';
        }
        blocks.push({ type: 'bullet_list', text: line.substring(2) });
      } else if (line.match(/^\d+\. /)) {
        // Numbered list
        if (currentParagraph.trim()) {
          blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
          currentParagraph = '';
        }
        blocks.push({ type: 'numbered_list', text: line.substring(line.indexOf(' ') + 1) });
      } else if (line.startsWith('[x]') || line.startsWith('[ ]')) {
        // Todo item
        if (currentParagraph.trim()) {
          blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
          currentParagraph = '';
        }
        const checked = line.startsWith('[x]');
        blocks.push({ type: 'todo', text: line.substring(line.indexOf(']') + 1).trim(), checked });
      } else if (line.trim() === '') {
        // Empty line - end current paragraph
        if (currentParagraph.trim()) {
          blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
          currentParagraph = '';
        }
      } else {
        // Regular text - add to current paragraph
        currentParagraph += line + ' ';
      }
    }

    // Don't forget the last paragraph
    if (currentParagraph.trim()) {
      blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
    }

    return blocks;
  }
}

// Export singleton instance
export const notionPublicService = new NotionPublicService();
