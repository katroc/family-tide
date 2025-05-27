// Simple auth service for SQLite version - no real authentication
// This is a mock service that simulates the Supabase auth interface

interface MockUser {
  id: string;
  email: string;
  created_at: string;
}

interface MockSession {
  user: MockUser;
  access_token: string;
  expires_at: number;
}

class MockAuthService {
  private currentUser: MockUser | null = null;
  private currentSession: MockSession | null = null;

  constructor() {
    // Auto-login a default user for the SQLite version
    this.currentUser = {
      id: 'local-user-1',
      email: 'family@local.dev',
      created_at: new Date().toISOString()
    };

    this.currentSession = {
      user: this.currentUser,
      access_token: 'local-token',
      expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    console.log('🔐 Mock auth service initialized - auto-logged in as local user');
  }

  async getCurrentUser(): Promise<MockUser | null> {
    return this.currentUser;
  }

  async getSession(): Promise<MockSession | null> {
    return this.currentSession;
  }

  async isSetupComplete(session?: MockSession): Promise<boolean> {
    // Enhanced logic: Check both Supabase and SQLite data
    try {
      console.log('🔍 [AuthService] Checking setup completion...');
      
      // Try Supabase family membership check first
      const hasSupabaseFamilies = await this.hasSupabaseFamilyMemberships();
      console.log('🔍 [AuthService] Supabase family check result:', hasSupabaseFamilies);
      
      // If user has Supabase families, they're definitely set up
      if (hasSupabaseFamilies === true) {
        console.log('✅ [AuthService] User has Supabase families - setup complete');
        return true;
      }
      
      // If Supabase check failed (null), we can't rely on it, so check SQLite
      // If Supabase returned false, user has no Supabase families, so check SQLite
      console.log('⬇️ [AuthService] Checking SQLite data (fallback or no Supabase families)...');
      
      const { dataService } = await import('../dataService');
      
      // Ensure dataService is properly initialized
      try {
        await dataService.initialize();
        console.log('✅ [AuthService] DataService initialized successfully');
      } catch (initError) {
        console.error('❌ [AuthService] DataService initialization failed:', initError);
        // If we can't initialize dataService, we can't check SQLite data
        // Default to requiring setup
        return false;
      }
      
      const familyMembers = await dataService.getFamilyMembers();
      const familyDetails = await dataService.getFamilyDetails();
      
      // Setup is complete if we have at least one family member or a custom family name
      const hasMembers = familyMembers.length > 0;
      const hasCustomName = familyDetails.name !== 'My Family';
      const hasSQLiteData = hasMembers || hasCustomName;
      
      console.log('🔍 [AuthService] SQLite setup check:', { 
        hasMembers, 
        hasCustomName, 
        familyName: familyDetails.name,
        memberCount: familyMembers.length,
        hasSQLiteData 
      });
      
      if (hasSQLiteData) {
        console.log('✅ [AuthService] User has SQLite family data - setup complete');
        return true;
      }
      
      // User has neither Supabase nor SQLite family data
      console.log('❌ [AuthService] User has no family data - setup required');
      return false;
      
    } catch (error) {
      console.error('❌ [AuthService] Error checking setup completion:', error);
      // On error, default to requiring setup to be safe
      return false;
    }
  }

  private async hasSupabaseFamilyMemberships(): Promise<boolean | null> {
    try {
      console.log('🏠 [AuthService] Checking Supabase family memberships...');
      
      // Import supabaseService dynamically to avoid circular dependencies
      const { supabaseService } = await import('../supabaseService');
      
      // Check if user is authenticated with Supabase
      const authUser = await supabaseService.getCurrentUser();
      if (!authUser) {
        console.log('👤 [AuthService] No Supabase auth user found - will check SQLite fallback');
        return null; // Not authenticated with Supabase
      }
      
      console.log('👤 [AuthService] Supabase user found:', authUser.email);
      
      // Get user's families
      const result = await supabaseService.getUserFamilies();
      console.log('🏠 [AuthService] getUserFamilies result:', result);
      
      if (!result.success) {
        console.log('❌ [AuthService] Failed to get user families:', result.error, '- will check SQLite fallback');
        return null; // Error getting families
      }
      
      const familyCount = result.families?.length || 0;
      const hasFamilies = familyCount > 0;
      
      console.log(`🏠 [AuthService] Supabase family check: ${familyCount} families found`);
      
      if (hasFamilies) {
        console.log('✅ [AuthService] User has Supabase families:', result.families?.map(f => f.family?.name || 'Unknown'));
        return true;
      } else {
        console.log('📝 [AuthService] User has no Supabase families - will check SQLite data');
        return false;
      }
      
    } catch (error: any) {
      console.log('⚠️ [AuthService] Supabase family check failed:', error.message, '- will check SQLite fallback');
      return null; // Supabase not available
    }
  }

  async signIn(email: string, password: string): Promise<{ user: MockUser | null, session: MockSession | null, error: any }> {
    // Mock sign in - always succeeds
    console.log('🔐 Mock sign in:', email);
    return {
      user: this.currentUser,
      session: this.currentSession,
      error: null
    };
  }

  async signUp(email: string, password: string): Promise<{ user: MockUser | null, session: MockSession | null, error: any }> {
    // Mock sign up - always succeeds
    console.log('🔐 Mock sign up:', email);
    this.currentUser = {
      id: 'local-user-' + Date.now(),
      email,
      created_at: new Date().toISOString()
    };

    this.currentSession = {
      user: this.currentUser,
      access_token: 'local-token-' + Date.now(),
      expires_at: Date.now() + (24 * 60 * 60 * 1000)
    };

    return {
      user: this.currentUser,
      session: this.currentSession,
      error: null
    };
  }

  async signOut(): Promise<{ error: any }> {
    console.log('🔐 Mock sign out');
    // Don't actually sign out in SQLite version - keep user logged in
    return { error: null };
  }

  async createFamily(familyName: string, familyAddress?: string): Promise<any> {
    try {
      const { dataService } = await import('../dataService');
      await dataService.initialize();
      
      const familyDetails = await dataService.getFamilyDetails();
      const updatedDetails = {
        ...familyDetails,
        name: familyName,
        address: familyAddress || familyDetails.address
      };
      
      await dataService.saveFamilyDetails(updatedDetails);
      console.log('👨‍👩‍👧‍👦 Created family:', familyName);
      
      return { success: true, familyName };
    } catch (error) {
      console.error('Error creating family:', error);
      throw error;
    }
  }

  async createFamilyRoom(familyName: string, deviceName: string): Promise<any> {
    // This is what the SetupWizard expects - create family with device name as context
    console.log('🏠 Creating family room:', { familyName, deviceName });
    
    try {
      const { dataService } = await import('../dataService'); // Now SupabaseDataService
      await dataService.initialize();
      
      // Call the new method to create the family in Supabase
      const newFamily = await dataService.createNewFamily(familyName);

      if (!newFamily || !newFamily.id) {
        console.error('❌ Family creation failed or did not return an ID.');
        throw new Error('Family creation failed in SupabaseDataService.');
      }
      
      console.log('👨‍👩‍👧‍👦 Created family room:', newFamily.name, 'with ID:', newFamily.id, 'from device:', deviceName);
      
      return { 
        success: true, 
        familyName: newFamily.name, 
        deviceName,
        familyContext: {
          id: newFamily.id, // Use the new family ID from Supabase
          name: newFamily.name,
          deviceName
        }
      };
    } catch (error) {
      console.error('Error creating family room:', error);
      // Ensure the error is re-thrown so SetupWizard can catch it
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(String(error));
      }
    }
  }

  // Mock the onAuthStateChange method that Supabase provides
  onAuthStateChange(callback: (event: string, session: MockSession | null) => void) {
    // Immediately call with SIGNED_IN event since we're always logged in
    setTimeout(() => {
      callback('SIGNED_IN', this.currentSession);
    }, 100);

    // Return a mock subscription object
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            console.log('🔐 Mock auth subscription unsubscribed');
          }
        }
      }
    };
  }

  // Debug method to help troubleshoot setup completion issues
  async debugSetupCompletion(): Promise<void> {
    console.log('🔧 [AuthService] === DEBUG SETUP COMPLETION ===');
    
    try {
      // Check current user
      const user = await this.getCurrentUser();
      console.log('👤 [Debug] Current user:', user);
      
      // Check session
      const session = await this.getSession();
      console.log('🔑 [Debug] Current session:', session);
      
      // Check Supabase families
      console.log('🏠 [Debug] Checking Supabase families...');
      const supabaseFamilies = await this.hasSupabaseFamilyMemberships();
      console.log('🏠 [Debug] Supabase families result:', supabaseFamilies);
      
      // Check SQLite data
      console.log('💾 [Debug] Checking SQLite data...');
      const { dataService } = await import('../dataService');
      await dataService.initialize();
      
      const familyMembers = await dataService.getFamilyMembers();
      const familyDetails = await dataService.getFamilyDetails();
      
      console.log('💾 [Debug] SQLite family members:', familyMembers.length);
      console.log('💾 [Debug] SQLite family details:', familyDetails);
      
      // Final setup completion check
      const isComplete = await this.isSetupComplete();
      console.log('✅ [Debug] Final setup completion result:', isComplete);
      
    } catch (error) {
      console.error('❌ [Debug] Error during debug:', error);
    }
    
    console.log('🔧 [AuthService] === END DEBUG ===');
  }
}

export const authService = new MockAuthService();

// Expose debug method globally for testing
if (typeof window !== 'undefined') {
  (window as any).debugSetupCompletion = () => authService.debugSetupCompletion();
  console.log('🔧 Debug method exposed: Run `debugSetupCompletion()` in console to troubleshoot setup issues');
}
