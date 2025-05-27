import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Timeout configurations to prevent hanging
const QUERY_TIMEOUT = 5000; // 5 seconds
const AUTH_TIMEOUT = 3000;   // 3 seconds
const HEALTH_CHECK_TIMEOUT = 2000; // 2 seconds

console.log('🚀 SupabaseService: Initializing with clean configuration');
console.log('📡 Project URL:', SUPABASE_URL);

// Create Supabase client with optimized configuration
const supabase: SupabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'family-planner-auth-token',
  },
  realtime: {
    params: {
      eventsPerSecond: 1,
    },
  },
  global: {
    headers: {
      'x-client-info': 'family-planner@1.0.0',
    },
  },
});

/**
 * Utility function to add timeout to any promise
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation "${operation}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Clean, minimal Supabase service focused on reliability
 */
class SupabaseService {
  private connectionHealthy = false;
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor() {
    console.log('✅ SupabaseService: Instance created');
    this.setupAuthStateListener();
  }

  private setupAuthStateListener(): void {
    console.log('🔐 SupabaseService: Setting up auth state listener');
    
    supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔐 Auth state changed: ${event}`, {
        hasSession: !!session,
        userEmail: session?.user?.email,
        timestamp: new Date().toISOString(),
      });

      this.connectionHealthy = false;
    });
  }

  /**
   * Stage 1.1: Basic connection health check
   */
  async checkConnectionHealth(): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();
    console.log('🏥 SupabaseService: Starting connection health check');

    try {
      const healthCheckPromise = supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      await withTimeout(healthCheckPromise, HEALTH_CHECK_TIMEOUT, 'health-check');
      
      const responseTime = Date.now() - startTime;
      this.connectionHealthy = true;
      this.lastHealthCheck = Date.now();

      console.log(`✅ SupabaseService: Connection healthy (${responseTime}ms)`);
      return { healthy: true, responseTime };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      this.connectionHealthy = false;
      
      console.error(`❌ SupabaseService: Connection health check failed (${responseTime}ms):`, error.message);
      return { 
        healthy: false, 
        responseTime, 
        error: error.message 
      };
    }
  }

  isConnectionHealthy(): boolean {
    const timeSinceLastCheck = Date.now() - this.lastHealthCheck;
    return this.connectionHealthy && timeSinceLastCheck < this.HEALTH_CHECK_INTERVAL;
  }

  /**
   * Stage 1.2: Basic authentication without family context
   */
  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    console.log('📝 SupabaseService: Attempting sign up for:', email);

    try {
      const signUpPromise = supabase.auth.signUp({ email, password });
      const { data, error } = await withTimeout(signUpPromise, AUTH_TIMEOUT, 'sign-up');

      if (error) {
        console.error('❌ Sign up error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Sign up successful:', { hasUser: !!data.user, hasSession: !!data.session });
      return { success: true };

    } catch (error: any) {
      console.error('❌ Sign up timeout or error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    console.log('🔑 SupabaseService: Attempting sign in for:', email);

    try {
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const { data, error } = await withTimeout(signInPromise, AUTH_TIMEOUT, 'sign-in');

      if (error) {
        console.error('❌ Sign in error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Sign in successful:', { hasUser: !!data.user, hasSession: !!data.session });
      return { success: true };

    } catch (error: any) {
      console.error('❌ Sign in timeout or error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    console.log('🚪 SupabaseService: Signing out');

    try {
      const signOutPromise = supabase.auth.signOut();
      const { error } = await withTimeout(signOutPromise, AUTH_TIMEOUT, 'sign-out');

      if (error) {
        console.error('❌ Sign out error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Sign out successful');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Sign out timeout or error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser(): Promise<{ user: any; error?: string }> {
    console.log('👤 SupabaseService: Getting current user');

    try {
      const getUserPromise = supabase.auth.getUser();
      const { data, error } = await withTimeout(getUserPromise, AUTH_TIMEOUT, 'get-user');

      if (error) {
        console.error('❌ Get user error:', error.message);
        return { user: null, error: error.message };
      }

      console.log('✅ Get user successful:', { hasUser: !!data.user, userEmail: data.user?.email });
      return { user: data.user };

    } catch (error: any) {
      console.error('❌ Get user timeout or error:', error.message);
      return { user: null, error: error.message };
    }
  }

  async getSession(): Promise<{ session: any; error?: string }> {
    console.log('🎫 SupabaseService: Getting current session');

    try {
      const getSessionPromise = supabase.auth.getSession();
      const { data, error } = await withTimeout(getSessionPromise, AUTH_TIMEOUT, 'get-session');

      if (error) {
        console.error('❌ Get session error:', error.message);
        return { session: null, error: error.message };
      }

      console.log('✅ Get session successful:', { hasSession: !!data.session });
      return { session: data.session };

    } catch (error: any) {
      console.error('❌ Get session timeout or error:', error.message);
      return { session: null, error: error.message };
    }
  }

  getClient(): SupabaseClient {
    return supabase;
  }

  /**
   * Test method: Verify the service works after page refresh
   */
  async testPostRefreshFunctionality(): Promise<{ success: boolean; details: any; error?: string }> {
    console.log('🔄 SupabaseService: Testing post-refresh functionality');

    try {
      const tests = {
        healthCheck: await this.checkConnectionHealth(),
        session: await this.getSession(),
        user: await this.getCurrentUser(),
      };

      const allTestsPassed = tests.healthCheck.healthy && 
                           !tests.session.error && 
                           !tests.user.error;

      if (allTestsPassed) {
        console.log('✅ Post-refresh functionality test: PASSED');
        return { success: true, details: tests };
      } else {
        console.log('❌ Post-refresh functionality test: FAILED');
        return { success: false, details: tests, error: 'Some tests failed' };
      }

    } catch (error: any) {
      console.error('❌ Post-refresh test error:', error.message);
      return { success: false, details: {}, error: error.message };
    }
  }

  /**
   * Stage 3: Family Management Methods
   */
  async createFamily(familyName: string = 'My Family', familyAddress: string = ''): Promise<{ success: boolean; family?: any; error?: string }> {
    console.log('👨‍👩‍👧‍👦 SupabaseService: Creating family:', familyName);

    try {
      const createFamilyPromise = supabase.rpc('create_family', {
        family_name: familyName,
        family_address: familyAddress
      });

      const { data, error } = await withTimeout(createFamilyPromise, QUERY_TIMEOUT, 'create-family');

      if (error) {
        console.error('❌ Create family error:', error.message);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('❌ Create family failed:', data.error);
        return { success: false, error: data.error };
      }

      console.log('✅ Family created successfully:', data.family.name);
      return { success: true, family: data.family };

    } catch (error: any) {
      console.error('❌ Create family timeout or error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async joinFamilyByInvite(inviteCode: string, userRole: string = 'child'): Promise<{ success: boolean; family?: any; error?: string }> {
    console.log('🎫 SupabaseService: Joining family with invite code:', inviteCode);

    try {
      const joinFamilyPromise = supabase.rpc('join_family_by_invite', {
        invite_code: inviteCode,
        user_role: userRole
      });

      const { data, error } = await withTimeout(joinFamilyPromise, QUERY_TIMEOUT, 'join-family');

      if (error) {
        console.error('❌ Join family error:', error.message);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('❌ Join family failed:', data.error);
        return { success: false, error: data.error };
      }

      console.log('✅ Successfully joined family:', data.family.name);
      return { success: true, family: data.family };

    } catch (error: any) {
      console.error('❌ Join family timeout or error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 4: General Database Query Method
   */
  async query(sql: string, params: any[] = []): Promise<{ data: any[] | null; error: any }> {
    console.log('🔍 SupabaseService: Executing query:', sql.substring(0, 100) + '...');

    try {
      // For now, we'll use rpc functions, but this could be extended for direct SQL
      console.log('⚠️ Direct SQL queries not yet implemented - this is a placeholder');
      return { data: null, error: 'Direct SQL queries not implemented yet' };
      
    } catch (error: any) {
      console.error('❌ Query error:', error.message);
      return { data: null, error: error.message };
    }
  }

  async getUserFamilies(): Promise<{ success: boolean; families?: any[]; error?: string }> {
    console.log('👨‍👩‍👧‍👦 SupabaseService: Getting user families');

    try {
      const getUserFamiliesPromise = supabase.rpc('get_user_families');
      const { data, error } = await withTimeout(getUserFamiliesPromise, QUERY_TIMEOUT, 'get-user-families');

      if (error) {
        console.error('❌ Get user families error:', error.message);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('❌ Get user families failed:', data.error);
        return { success: false, error: data.error };
      }

      console.log('✅ Retrieved user families:', data.families?.length || 0);
      return { success: true, families: data.families || [] };

    } catch (error: any) {
      console.error('❌ Get user families timeout or error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export const supabaseService = new SupabaseService();
export { supabase };
console.log('📦 SupabaseService: Module loaded successfully');
