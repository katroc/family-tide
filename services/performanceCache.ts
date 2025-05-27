// Performance Cache Service
// Implements intelligent caching for frequently accessed data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
}

export class PerformanceCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
  private maxSize: number = 100; // Maximum number of cached items
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default TTL

  // Cache TTL configurations for different data types
  private ttlConfig = {
    'family_details': 10 * 60 * 1000,    // 10 minutes - changes rarely
    'family_members': 5 * 60 * 1000,     // 5 minutes - moderate changes
    'chores': 2 * 60 * 1000,             // 2 minutes - changes frequently  
    'events': 3 * 60 * 1000,             // 3 minutes - moderate changes
    'rewards': 10 * 60 * 1000,           // 10 minutes - changes rarely
    'routines': 5 * 60 * 1000,           // 5 minutes - moderate changes
    'chore_types': 15 * 60 * 1000,       // 15 minutes - changes very rarely
    'routine_progress': 1 * 60 * 1000    // 1 minute - changes frequently
  };

  // Generate cache key
  private getCacheKey(familyId: string, dataType: string, params?: string): string {
    const baseKey = `${familyId}:${dataType}`;
    return params ? `${baseKey}:${params}` : baseKey;
  }

  // Check if cache entry is still valid
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Evict oldest entries when cache is full
  private evictIfNeeded(): void {
    if (this.cache.size >= this.maxSize) {
      // Find and remove oldest entry
      let oldestKey = '';
      let oldestTime = Date.now();
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
        console.log(`🗑️ [Cache] Evicted oldest entry: ${oldestKey}`);
      }
    }
  }

  // Get data from cache
  get<T>(familyId: string, dataType: string, params?: string): T | null {
    const key = this.getCacheKey(familyId, dataType, params);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (!this.isValid(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`⏰ [Cache] Expired entry removed: ${key}`);
      return null;
    }
    
    this.stats.hits++;
    console.log(`✅ [Cache] Hit: ${key}`);
    return entry.data;
  }

  // Set data in cache
  set<T>(familyId: string, dataType: string, data: T, params?: string): void {
    const key = this.getCacheKey(familyId, dataType, params);
    const ttl = this.ttlConfig[dataType as keyof typeof this.ttlConfig] || this.defaultTTL;
    
    this.evictIfNeeded();
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    this.stats.sets++;
    console.log(`💾 [Cache] Set: ${key} (TTL: ${ttl / 1000}s)`);
  }

  // Invalidate specific cache entries
  invalidate(familyId: string, dataType?: string): void {
    const pattern = dataType ? `${familyId}:${dataType}` : familyId;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        console.log(`🚫 [Cache] Invalidated: ${key}`);
      }
    }
  }

  // Invalidate all cache entries for a family
  invalidateFamily(familyId: string): void {
    this.invalidate(familyId);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
    console.log('🧹 [Cache] Cleared all entries');
  }

  // Get cache statistics
  getStats(): CacheStats & { size: number; hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '0.0';
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`
    };
  }

  // Get cache contents for debugging
  debug(): { key: string; age: number; ttl: number; size: number }[] {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Math.round((now - entry.timestamp) / 1000),
      ttl: Math.round(entry.ttl / 1000),
      size: JSON.stringify(entry.data).length
    }));
  }

  // Preload commonly accessed data
  async preload(familyId: string, dataService: any): Promise<void> {
    console.log(`🚀 [Cache] Preloading data for family ${familyId}`);
    
    try {
      // Preload family details (rarely changes)
      const familyDetails = await dataService.getFamilyDetails();
      this.set(familyId, 'family_details', familyDetails);
      
      // Preload family members (moderate frequency)
      const familyMembers = await dataService.getFamilyMembers();
      this.set(familyId, 'family_members', familyMembers);
      
      // Preload chore types (rarely changes)
      const choreTypes = await dataService.getChoreTypes();
      this.set(familyId, 'chore_types', choreTypes);
      
      console.log(`✅ [Cache] Preloaded core data for family ${familyId}`);
    } catch (error) {
      console.error('❌ [Cache] Error preloading data:', error);
    }
  }
}

// Global cache instance
export const performanceCache = new PerformanceCache();

// Utility to bind all methods of a class instance to itself
function bindAllMethods(obj) {
  const bound = {};
  for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(obj))) {
    const val = obj[key];
    if (typeof val === 'function' && key !== 'constructor') {
      bound[key] = val.bind(obj);
    }
  }
  return bound;
}

export const createCachedDataService = (originalDataService: any, familyId: string) => {
  return {
    // Cached family details
    async getFamilyDetails() {
      const cached = performanceCache.get(familyId, 'family_details');
      if (cached) return cached;
      
      const data = await originalDataService.getFamilyDetails();
      performanceCache.set(familyId, 'family_details', data);
      return data;
    },

    // Cached family members
    async getFamilyMembers() {
      const cached = performanceCache.get(familyId, 'family_members');
      if (cached) return cached;
      
      const data = await originalDataService.getFamilyMembers();
      performanceCache.set(familyId, 'family_members', data);
      return data;
    },

    // Cached chore types
    async getChoreTypes() {
      const cached = performanceCache.get(familyId, 'chore_types');
      if (cached) return cached;
      
      const data = await originalDataService.getChoreTypes();
      performanceCache.set(familyId, 'chore_types', data);
      return data;
    },

    // Cached rewards
    async getRewards() {
      const cached = performanceCache.get(familyId, 'rewards');
      if (cached) return cached;
      
      const data = await originalDataService.getRewards();
      performanceCache.set(familyId, 'rewards', data);
      return data;
    },

    // Pass-through methods that invalidate cache on writes
    async addFamilyMember(member: any) {
      const result = await originalDataService.addFamilyMember(member);
      performanceCache.invalidate(familyId, 'family_members');
      return result;
    },

    async updateFamilyMember(member: any) {
      const result = await originalDataService.updateFamilyMember(member);
      performanceCache.invalidate(familyId, 'family_members');
      return result;
    },

    async addChore(chore: any) {
      const result = await originalDataService.addChore(chore);
      performanceCache.invalidate(familyId, 'chores');
      return result;
    },

    async updateChore(chore: any) {
      const result = await originalDataService.updateChore(chore);
      performanceCache.invalidate(familyId, 'chores');
      return result;
    },

    // Forward all other methods, properly bound
    ...bindAllMethods(originalDataService)
  };
};

export default PerformanceCache;