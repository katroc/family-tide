import {
  FamilyMember,
  NewFamilyMember,
  Chore,
  NewChore,
  EventItem,
  Reward,
  NewReward,
  FamilyDetails,
  ChoreType,
  Routine,
  DailyRoutineProgress,
  TabId
} from './types';

// Import and export SupabaseDataService with performance caching
import { SupabaseDataService } from './supabaseDataService';
import { performanceCache, createCachedDataService } from './services/performanceCache';
import { dataLogger } from './utils/logger';

// Create the base Supabase service
const baseSupabaseService = new SupabaseDataService();

// Enhanced data service with intelligent caching
class EnhancedDataService {
  private cachedService: any = null;
  private currentFamilyId: string | null = null;

  async initialize(): Promise<void> {
    await baseSupabaseService.initialize();
    
    // Get family ID after initialization
    try {
      const familyDetails = await baseSupabaseService.getFamilyDetails();
      if (familyDetails.id) {
        this.currentFamilyId = familyDetails.id;
        
        // Create cached service wrapper
        this.cachedService = createCachedDataService(baseSupabaseService, familyDetails.id);
        
        // Preload commonly accessed data
        dataLogger.info('Initializing performance cache');
        await performanceCache.preload(familyDetails.id, baseSupabaseService);
      }
    } catch (error) {
      dataLogger.warn('Could not initialize cache - using direct service');
      this.cachedService = baseSupabaseService;
    }
  }

  // Use cached service if available, otherwise fall back to base service
  private get service() {
    return this.cachedService || baseSupabaseService;
  }

  // Cache invalidation on real-time updates
  invalidateCache(table: string) {
    if (this.currentFamilyId) {
      performanceCache.invalidate(this.currentFamilyId, table);
      dataLogger.debug('Cache invalidated', { table });
    }
  }

  // Family Details - heavily cached
  async getFamilyDetails(): Promise<FamilyDetails> {
    return this.service.getFamilyDetails();
  }

  async saveFamilyDetails(details: FamilyDetails): Promise<void> {
    const result = await this.service.saveFamilyDetails(details);
    this.invalidateCache('family_details');
    return result;
  }

  // Family Members - moderately cached
  async getFamilyMembers(): Promise<FamilyMember[]> {
    return this.service.getFamilyMembers();
  }

  async addFamilyMember(member: NewFamilyMember): Promise<FamilyMember> {
    const result = await this.service.addFamilyMember(member);
    this.invalidateCache('family_members');
    return result;
  }

  async updateFamilyMember(member: FamilyMember): Promise<void> {
    const result = await this.service.updateFamilyMember(member);
    this.invalidateCache('family_members');
    return result;
  }

  async deleteFamilyMember(id: number): Promise<void> {
    const result = await this.service.deleteFamilyMember(id);
    this.invalidateCache('family_members');
    return result;
  }

  // Chores - frequently changing, minimal caching
  async getChores(): Promise<Chore[]> {
    return this.service.getChores();
  }

  async addChore(chore: NewChore): Promise<Chore> {
    const result = await this.service.addChore(chore);
    this.invalidateCache('chores');
    return result;
  }

  async updateChore(chore: Chore): Promise<void> {
    const result = await this.service.updateChore(chore);
    this.invalidateCache('chores');
    return result;
  }

  async deleteChore(id: number): Promise<void> {
    const result = await this.service.deleteChore(id);
    this.invalidateCache('chores');
    return result;
  }

  // Events - moderately cached
  async getEvents(): Promise<EventItem[]> {
    return this.service.getEvents();
  }

  async addEvent(event: Omit<EventItem, 'id'>): Promise<EventItem> {
    const result = await this.service.addEvent(event);
    this.invalidateCache('events');
    return result;
  }

  async updateEvent(event: EventItem): Promise<void> {
    const result = await this.service.updateEvent(event);
    this.invalidateCache('events');
    return result;
  }

  async deleteEvent(id: number): Promise<void> {
    const result = await this.service.deleteEvent(id);
    this.invalidateCache('events');
    return result;
  }

  // Rewards - heavily cached
  async getRewards(): Promise<Reward[]> {
    return this.service.getRewards();
  }

  async addReward(reward: NewReward): Promise<Reward> {
    const result = await this.service.addReward(reward);
    this.invalidateCache('rewards');
    return result;
  }

  async updateReward(reward: Reward): Promise<void> {
    const result = await this.service.updateReward(reward);
    this.invalidateCache('rewards');
    return result;
  }

  async deleteReward(id: number): Promise<void> {
    const result = await this.service.deleteReward(id);
    this.invalidateCache('rewards');
    return result;
  }

  // Chore Types - heavily cached
  async getChoreTypes(): Promise<ChoreType[]> {
    return this.service.getChoreTypes();
  }

  async updateChoreTypes(choreTypes: ChoreType[]): Promise<ChoreType[]> {
    const result = await this.service.updateChoreTypes(choreTypes);
    this.invalidateCache('chore_types');
    return result;
  }

  // Routines - moderately cached
  async getRoutines(): Promise<Routine[]> {
    return this.service.getRoutines();
  }

  async addRoutine(routine: Omit<Routine, 'id'>): Promise<Routine> {
    const result = await this.service.addRoutine(routine);
    this.invalidateCache('routines');
    return result;
  }

  async updateRoutines(routines: Routine[]): Promise<Routine[]> {
    const result = await this.service.updateRoutines(routines);
    this.invalidateCache('routines');
    return result;
  }

  async deleteRoutine(id: string): Promise<void> {
    const result = await this.service.deleteRoutine(id);
    this.invalidateCache('routines');
    return result;
  }

  // Routine Progress - minimal caching (changes frequently)
  async getDailyRoutineProgress(date: string): Promise<DailyRoutineProgress[]> {
    return this.service.getDailyRoutineProgress(date);
  }

  async upsertDailyRoutineProgress(progress: DailyRoutineProgress): Promise<void> {
    const result = await this.service.upsertDailyRoutineProgress(progress);
    this.invalidateCache('routine_progress');
    return result;
  }

  // Family Photo
  async getFamilyPhoto(): Promise<string | null> {
    return this.service.getFamilyPhoto();
  }

  async saveFamilyPhoto(photoDataUrl: string): Promise<void> {
    const result = await this.service.saveFamilyPhoto(photoDataUrl);
    this.invalidateCache('family_details');
    return result;
  }

  // App Settings
  async getActiveTab(): Promise<TabId | null> {
    return this.service.getActiveTab();
  }

  async saveActiveTab(tabId: TabId): Promise<void> {
    return this.service.saveActiveTab(tabId);
  }

  // Service info
  async getServiceInfo(): Promise<{ type: 'supabase'; version: string; status: 'active' }> {
    return this.service.getServiceInfo();
  }

  // Cache management methods
  getCacheStats() {
    return performanceCache.getStats();
  }

  clearCache() {
    performanceCache.clear();
  }

  debugCache() {
    return performanceCache.debug();
  }

  // Family management methods
  async createNewFamily(familyName: string, familyAddress?: string) {
    return this.service.createNewFamily(familyName, familyAddress);
  }

  async joinFamilyWithInviteCode(inviteCode: string) {
    return this.service.joinFamilyWithInviteCode(inviteCode);
  }

  // Add this method to allow setting the current family context externally
  setCurrentFamilyId(familyId: string) {
    this.currentFamilyId = familyId;
    if (this.cachedService && this.cachedService.setCurrentFamilyId) {
      this.cachedService.setCurrentFamilyId(familyId);
    }
    if (baseSupabaseService.setCurrentFamilyId) {
      baseSupabaseService.setCurrentFamilyId(familyId);
    }
  }
}

export const dataService = new EnhancedDataService();

dataLogger.info('Data service enhanced with performance caching');
