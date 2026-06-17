import { TextChunk } from './chunk.service';
import { chunkService } from './chunk.service';

export interface SearchResult extends TextChunk {
  score: number;
}

export class RetrievalService {
  /**
   * Search for relevant chunks using keyword overlap scoring
   */
  search(query: string, topK: number = 4): SearchResult[] {
    const chunks = chunkService.getAllChunks();

    if (chunks.length === 0) {
      console.warn('⚠️  No chunks available for retrieval');
      return [];
    }

    const queryTerms = this.extractTerms(query);
    const results: SearchResult[] = [];

    for (const chunk of chunks) {
      const chunkTerms = this.extractTerms(chunk.content);
      const score = this.calculateScore(queryTerms, chunkTerms);

      if (score > 0) {
        results.push({
          ...chunk,
          score,
        });
      }
    }

    // Sort by score (highest first) and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Extract meaningful terms from text
   */
  private extractTerms(text: string): Set<string> {
    const terms = new Set<string>();

    // Split by word boundaries and filter
    const words = text
      .toLowerCase()
      .split(/[^\w\s]/)
      .flatMap(w => w.split(/\s+/))
      .filter(w => w.length >= 3); // Ignore short words

    for (const word of words) {
      if (word.length >= 3) {
        terms.add(word);
      }
    }

    return terms;
  }

  /**
   * Calculate keyword overlap score between query and chunk
   */
  private calculateScore(queryTerms: Set<string>, chunkTerms: Set<string>): number {
    let score = 0;

    for (const term of queryTerms) {
      if (chunkTerms.has(term)) {
        score += 1;
      }
    }

    return score;
  }
}

// Export singleton instance
export const retrievalService = new RetrievalService();
