import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { Module } from '../types/module.types';
import { chunkService } from './chunk.service';

const CACHE_FILE_PATH = join(process.cwd(), 'data', 'modules.json');
const TIMESTAMP_FILE_PATH = join(process.cwd(), 'data', 'lastSync.txt');

export class CacheService {
  private cache: Module[] = [];
  private lastSyncTime: Date | null = null;

  /**
   * Save modules to cache file
   */
  async saveToCache(modules: Module[]): Promise<void> {
    try {
      // Ensure data directory exists
      if (!existsSync(dirname(CACHE_FILE_PATH))) {
        await mkdir(dirname(CACHE_FILE_PATH), { recursive: true });
      }

      // Write modules to cache file
      await writeFile(CACHE_FILE_PATH, JSON.stringify(modules, null, 2), 'utf-8');

      // Update last sync time
      this.lastSyncTime = new Date();
      await writeFile(TIMESTAMP_FILE_PATH, this.lastSyncTime.toISOString(), 'utf-8');

      // Update in-memory cache
      this.cache = modules;

      // Auto-generate chunks for chat retrieval
      chunkService.chunkModules(modules);

      console.log(`✅ Cached ${modules.length} modules with ${chunkService.getChunkCount()} chunks`);
    } catch (error) {
      console.error('Error saving to cache:', error);
      throw new Error('Failed to save cache');
    }
  }

  /**
   * Load modules from cache file
   */
  async loadFromCache(): Promise<Module[] | null> {
    try {
      if (!existsSync(CACHE_FILE_PATH)) {
        console.log('No cache file found');
        return null;
      }

      const data = await readFile(CACHE_FILE_PATH, 'utf-8');
      this.cache = JSON.parse(data) as Module[];

      // Load last sync time
      if (existsSync(TIMESTAMP_FILE_PATH)) {
        const timestamp = await readFile(TIMESTAMP_FILE_PATH, 'utf-8');
        this.lastSyncTime = new Date(timestamp);
      }

      // Auto-generate chunks for chat retrieval
      chunkService.chunkModules(this.cache);

      console.log(`✅ Loaded ${this.cache.length} modules from cache with ${chunkService.getChunkCount()} chunks`);
      return this.cache;
    } catch (error) {
      console.error('Error loading from cache:', error);
      return null;
    }
  }

  /**
   * Get all modules from in-memory cache
   */
  getModulesFromMemory(): Module[] {
    return this.cache;
  }

  /**
   * Get a single module by ID from in-memory cache
   */
  getModuleByIdFromMemory(id: string): Module | undefined {
    return this.cache.find(m => m.id === id);
  }

  /**
   * Get the last sync timestamp
   */
  getLastSyncTimestamp(): string | null {
    return this.lastSyncTime ? this.lastSyncTime.toISOString() : null;
  }

  /**
   * Check if cache exists and is not empty
   */
  hasValidCache(): boolean {
    return this.cache.length > 0;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
