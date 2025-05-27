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
      console.log('🔍 Checking setup completion...');
      
      // Try Supabase family membership check first
      const hasSupabaseFamilies = await this.hasSupabaseFamilyMemberships();
      
      // If user has Supabase families, they're definitely set up
      if (hasSupabaseFamilies === true) {
        console.log('✅ User has Supabase families - setup complete');
        return true;
      }
      
      // If Supabase check failed (null) or user has no Supabase families (false),
      // check SQLite data as fallback
      console.log('⬇️ Checking SQLite data (fallback or no Supabase families)...');
      const { dataService } = await import('../dataService');
      await dataService.initialize();
      const familyMembers = await dataService.getFamilyMembers();
      const familyDetails = await dataService.getFamilyDetails();
      
      // Setup is complete if we have at least one family member or a custom family name
      const hasMembers = familyMembers.length > 0;
      const hasCustomName = familyDetails.name !== 'My Family';
      const hasSQLiteData = hasMembers || hasCustomName;
      
      console.log('🔍 SQLite setup check:', { 
        hasMembers, 
        hasCustomName, 
        familyName: familyDetails.name,
        hasSQLiteData 
      });
      
      if (hasSQLiteData) {
        console.log('✅ User has SQLite family data - setup complete');
        return true;
      }
      
      // User has neither Supabase nor SQLite family data
      console.log('❌ User has no family data - setup required');
      return false;
      
    } catch (error) {
      console.error('Error checking setup completion:', error);
      // On error, default to requiring setup to be safe
      return false;
    }
  }

  private async hasSupabaseFamilyMemberships(): Promise<boolean | null> {
    try {
      console.log('🏠 Checking Supabase family memberships...');
      
      // Import supabaseService dynamically to avoid circular dependencies
      const { supabaseService } = await import('../supabaseService');
      
      // Check if user is authenticated with Supabase
      const authUser = await supabaseService.getCurrentUser();
      if (!authUser) {
        console.log('👤 No Supabase auth user found - will check SQLite fallback');
        return null; // Not authenticated with Supabase
      }
      
      console.log('👤 Supabase user found:', authUser.email);
      
      // Get user's families
      const result = await supabaseService.getUserFamilies();
      if (!result.success) {
        console.log('❌ Failed to get user families:', result.error, '- will check SQLite fallback');
        return null; // Error getting families
      }
      
      const familyCount = result.families?.length || 0;
      const hasFamilies = familyCount > 0;
      
      console.log(`🏠 Supabase family check: ${familyCount} families found`);
      
      if (hasFamilies) {
        console.log('✅ User has Supabase families:', result.families.map(f => f.family.name));
        return true;
      } else {
        console.log('📝 User has no Supabase families - will check SQLite data');
        return false;
      }
      
    } catch (error) {
      console.log('⚠️ Supabase family check failed:', error.message, '- will check SQLite fallback');
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
}

export const authService = new MockAuthService();
