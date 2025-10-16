import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { authLogger } from './utils/logger';

// Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Timeout configurations to prevent hanging
const QUERY_TIMEOUT = 5000; // 5 seconds
const AUTH_TIMEOUT = 3000;   // 3 seconds
const HEALTH_CHECK_TIMEOUT = 2000; // 2 seconds

authLogger.info('Initializing SupabaseService');
authLogger.debug('Project URL', { url: SUPABASE_URL });

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
    authLogger.info('SupabaseService instance created');
    this.setupAuthStateListener();
  }

  private setupAuthStateListener(): void {
    authLogger.debug('Setting up auth state listener');
    
    supabase.auth.onAuthStateChange((event, session) => {
      authLogger.info('Auth state changed', {
        event,
        hasSession: !!session,
        userEmail: session?.user?.email
      });

      this.connectionHealthy = false;
    });
  }

  /**
   * Stage 1.1: Basic connection health check
   */
  async checkConnectionHealth(): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();
    authLogger.debug('Starting connection health check');

    try {
      const healthCheckPromise = supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      await withTimeout(healthCheckPromise, HEALTH_CHECK_TIMEOUT, 'health-check');
      
      const responseTime = Date.now() - startTime;
      this.connectionHealthy = true;
      this.lastHealthCheck = Date.now();

      authLogger.debug('Connection healthy', { responseTimeMs: responseTime });
      return { healthy: true, responseTime };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      this.connectionHealthy = false;
      
      authLogger.error('Connection health check failed', error, { responseTimeMs: responseTime });
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
    authLogger.info('Attempting sign up', { email });

    try {
      const signUpPromise = supabase.auth.signUp({ email, password });
      const { data, error } = await withTimeout(signUpPromise, AUTH_TIMEOUT, 'sign-up');

      if (error) {
        authLogger.error('Sign up error', error);
        return { success: false, error: error.message };
      }

      authLogger.info('Sign up successful', { hasUser: !!data.user, hasSession: !!data.session });
      return { success: true };

    } catch (error: any) {
      authLogger.error('Sign up timeout or error', error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    authLogger.info('Attempting sign in', { email });

    try {
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const { data, error } = await withTimeout(signInPromise, AUTH_TIMEOUT, 'sign-in');

      if (error) {
        authLogger.error('Sign in error', error);
        return { success: false, error: error.message };
      }

      authLogger.info('Sign in successful', { hasUser: !!data.user, hasSession: !!data.session });
      return { success: true };

    } catch (error: any) {
      authLogger.error('Sign in timeout or error', error);
      return { success: false, error: error.message };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    authLogger.info('Signing out');

    try {
      const signOutPromise = supabase.auth.signOut();
      const { error } = await withTimeout(signOutPromise, AUTH_TIMEOUT, 'sign-out');

      if (error) {
        authLogger.error('Sign out error', error);
        return { success: false, error: error.message };
      }

      authLogger.info('Sign out successful');
      return { success: true };

    } catch (error: any) {
      authLogger.error('Sign out timeout or error', error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser(): Promise<{ user: any; error?: string }> {
    authLogger.debug('Getting current user');

    try {
      const getUserPromise = supabase.auth.getUser();
      const { data, error } = await withTimeout(getUserPromise, AUTH_TIMEOUT, 'get-user');

      if (error) {
        authLogger.error('Get user error', error);
        return { user: null, error: error.message };
      }

      authLogger.debug('Get user successful', { hasUser: !!data.user, userEmail: data.user?.email });
      return { user: data.user };

    } catch (error: any) {
      authLogger.error('Get user timeout or error', error);
      return { user: null, error: error.message };
    }
  }

  async getSession(): Promise<{ session: any; error?: string }> {
    authLogger.debug('Getting current session');

    try {
      const getSessionPromise = supabase.auth.getSession();
      const { data, error } = await withTimeout(getSessionPromise, AUTH_TIMEOUT, 'get-session');

      if (error) {
        authLogger.error('Get session error', error);
        return { session: null, error: error.message };
      }

      authLogger.debug('Get session successful', { hasSession: !!data.session });
      return { session: data.session };

    } catch (error: any) {
      authLogger.error('Get session timeout or error', error);
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
    authLogger.debug('Testing post-refresh functionality');

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
        authLogger.info('Post-refresh functionality test passed');
        return { success: true, details: tests };
      } else {
        authLogger.warn('Post-refresh functionality test failed');
        return { success: false, details: tests, error: 'Some tests failed' };
      }

    } catch (error: any) {
      authLogger.error('Post-refresh test error', error);
      return { success: false, details: {}, error: error.message };
    }
  }

  /**
   * Stage 3: Family Management Methods
   */
  async createFamily(familyName: string = 'My Family', familyAddress: string = ''): Promise<{ success: boolean; family?: any; error?: string }> {
    authLogger.info('Creating family', { familyName });

    try {
      const createFamilyPromise = supabase.rpc('create_family', {
        family_name: familyName,
        family_address: familyAddress
      });

      const { data, error } = await withTimeout(createFamilyPromise, QUERY_TIMEOUT, 'create-family');

      if (error) {
        authLogger.error('Create family error', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        authLogger.error('Create family failed', undefined, { error: data.error });
        return { success: false, error: data.error };
      }

      authLogger.info('Family created successfully', { familyName: data.family.name });
      return { success: true, family: data.family };

    } catch (error: any) {
      authLogger.error('Create family timeout or error', error);
      return { success: false, error: error.message };
    }
  }

  async joinFamilyByInvite(inviteCode: string, userRole: string = 'child'): Promise<{ success: boolean; family?: any; error?: string }> {
    authLogger.info('Joining family with invite code', { inviteCode });

    try {
      const joinFamilyPromise = supabase.rpc('join_family_by_invite', {
        invite_code: inviteCode,
        user_role: userRole
      });

      const { data, error } = await withTimeout(joinFamilyPromise, QUERY_TIMEOUT, 'join-family');

      if (error) {
        authLogger.error('Join family error', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        authLogger.error('Join family failed', undefined, { error: data.error });
        return { success: false, error: data.error };
      }

      authLogger.info('Successfully joined family', { familyName: data.family.name });
      return { success: true, family: data.family };

    } catch (error: any) {
      authLogger.error('Join family timeout or error', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 4: General Database Query Method
   */
  async query(sql: string, params: any[] = []): Promise<{ data: any[] | null; error: any }> {
    authLogger.debug('Executing query', { queryPreview: sql.substring(0, 100) });

    try {
      // For now, we'll use rpc functions, but this could be extended for direct SQL
      authLogger.warn('Direct SQL queries not yet implemented');
      return { data: null, error: 'Direct SQL queries not implemented yet' };
      
    } catch (error: any) {
      authLogger.error('Query error', error);
      return { data: null, error: error.message };
    }
  }

  async getUserFamilies(): Promise<{ success: boolean; families?: any[]; error?: string }> {
    authLogger.debug('Getting user families');

    try {
      const getUserFamiliesPromise = supabase.rpc('get_user_families');
      const { data, error } = await withTimeout(getUserFamiliesPromise, QUERY_TIMEOUT, 'get-user-families');

      if (error) {
        authLogger.error('Get user families error', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        authLogger.error('Get user families failed', undefined, { error: data.error });
        return { success: false, error: data.error };
      }

      authLogger.debug('Retrieved user families', { count: data.families?.length || 0 });
      return { success: true, families: data.families || [] };

    } catch (error: any) {
      authLogger.error('Get user families timeout or error', error);
      return { success: false, error: error.message };
    }
  }
}

export const supabaseService = new SupabaseService();
export { supabase };
authLogger.info('SupabaseService module loaded');
