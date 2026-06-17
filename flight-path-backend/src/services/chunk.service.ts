import { Module, ContentBlock } from '../types/module.types';

export interface TextChunk {
  id: string;
  moduleId: string;
  title: string;
  content: string;
}

export class ChunkService {
  private chunks: TextChunk[] = [];
  private readonly chunkSize = 800;
  private readonly overlapSize = 100;

  /**
   * Split modules into text chunks for retrieval
   */
  chunkModules(modules: Module[]): TextChunk[] {
    this.chunks = [];

    for (const module of modules) {
      if (module.contentBlocks && module.contentBlocks.length > 0) {
        const moduleChunks = this.chunkModule(module);
        this.chunks.push(...moduleChunks);
      }
    }

    console.log(`✅ Created ${this.chunks.length} text chunks from ${modules.length} modules`);
    return this.chunks;
  }

  /**
   * Chunk a single module's content
   */
  private chunkModule(module: Module): TextChunk[] {
    const chunks: TextChunk[] = [];
    const fullText = this.extractTextFromBlocks(module.contentBlocks || []);

    let startPos = 0;
    let chunkIndex = 0;

    while (startPos < fullText.length) {
      const endPos = Math.min(startPos + this.chunkSize, fullText.length);
      const chunkText = fullText.substring(startPos, endPos);

      // Only add non-empty chunks
      if (chunkText.trim().length > 50) {
        chunks.push({
          id: `chunk_${module.id}_${chunkIndex}`,
          moduleId: module.id,
          title: module.title,
          content: chunkText.trim(),
        });
        chunkIndex++;
      }

      // Move forward with overlap
      startPos = endPos - this.overlapSize;
      if (startPos < 0) startPos = 0;
    }

    return chunks;
  }

  /**
   * Extract plain text from content blocks
   */
  private extractTextFromBlocks(blocks: ContentBlock[]): string {
    return blocks
      .map(block => {
        // Skip dividers and empty blocks
        if (block.type === 'divider' || !block.text.trim()) {
          return '';
        }
        return block.text + '\n\n';
      })
      .join('')
      .trim();
  }

  /**
   * Get all chunks
   */
  getAllChunks(): TextChunk[] {
    return this.chunks;
  }

  /**
   * Get chunk count
   */
  getChunkCount(): number {
    return this.chunks.length;
  }
}

// Export singleton instance
export const chunkService = new ChunkService();
