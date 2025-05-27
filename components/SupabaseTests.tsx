import React, { useState, useEffect } from 'react';
import { supabaseService } from '../supabaseService';

interface TestResult {
  success: boolean;
  responseTime?: number;
  error?: string;
  details?: any;
}

export const SupabaseConnectionTest: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<TestResult | null>(null);
  const [authTest, setAuthTest] = useState<TestResult | null>(null);
  const [refreshTest, setRefreshTest] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    setIsLoading(true);
    console.log('🧪 Running Supabase connection health check...');
    
    try {
      const result = await supabaseService.checkConnectionHealth();
      setHealthStatus(result);
      console.log('🧪 Health check result:', result);
    } catch (error: any) {
      setHealthStatus({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testAuth = async () => {
    setIsLoading(true);
    console.log('🧪 Testing authentication flow...');

    try {
      const userResult = await supabaseService.getCurrentUser();
      const sessionResult = await supabaseService.getSession();

      const success = !userResult.error && !sessionResult.error;
      setAuthTest({
        success,
        details: { userResult, sessionResult },
        error: userResult.error || sessionResult.error,
      });

      console.log('🧪 Auth test result:', { success, userResult, sessionResult });
    } catch (error: any) {
      setAuthTest({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testPostRefresh = async () => {
    setIsLoading(true);
    console.log('🧪 Testing post-refresh functionality...');

    try {
      const result = await supabaseService.testPostRefreshFunctionality();
      setRefreshTest(result);
      console.log('🧪 Post-refresh test result:', result);
    } catch (error: any) {
      setRefreshTest({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const forceRefresh = () => {
    console.log('🔄 Forcing page refresh...');
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        🧪 Supabase Connection Test - Stage 1.1
      </h1>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Connection Health Check</h2>
            <button
              onClick={runHealthCheck}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
          
          {healthStatus && (
            <div className={`p-3 rounded ${healthStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">
                {healthStatus.success ? '✅ Connection Healthy' : '❌ Connection Failed'}
              </div>
              {healthStatus.responseTime && (
                <div className="text-sm">Response time: {healthStatus.responseTime}ms</div>
              )}
              {healthStatus.error && (
                <div className="text-sm mt-1">Error: {healthStatus.error}</div>
              )}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Authentication Test</h2>
            <button
              onClick={testAuth}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Auth'}
            </button>
          </div>
          
          {authTest && (
            <div className={`p-3 rounded ${authTest.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">
                {authTest.success ? '✅ Auth System Working' : '❌ Auth System Failed'}
              </div>
              {authTest.error && (
                <div className="text-sm mt-1">Error: {authTest.error}</div>
              )}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Post-Refresh Test</h2>
            <div className="space-x-2">
              <button
                onClick={testPostRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isLoading ? 'Testing...' : 'Test Now'}
              </button>
              <button
                onClick={forceRefresh}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                🔄 Force Refresh
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            This tests if Supabase connection works reliably after page refresh (your main issue).
          </div>
          
          {refreshTest && (
            <div className={`p-3 rounded ${refreshTest.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">
                {refreshTest.success ? '✅ Post-Refresh Working' : '❌ Post-Refresh Failed'}
              </div>
              {refreshTest.error && (
                <div className="text-sm mt-1">Error: {refreshTest.error}</div>
              )}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>First, run the "Connection Health Check" to verify basic connectivity</li>
            <li>Run the "Authentication Test" to check auth state handling</li>
            <li>Run the "Post-Refresh Test" to verify current functionality</li>
            <li>Click "Force Refresh" to reload the page</li>
            <li>After refresh, run all tests again to verify they still work</li>
            <li>If any test fails after refresh, we've identified the issue</li>
          </ol>
        </div>

        <div className="bg-gray-50 border rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Current Status:</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Health: </span>
              <span className={healthStatus?.success ? 'text-green-600' : 'text-red-600'}>
                {healthStatus ? (healthStatus.success ? 'Good' : 'Failed') : 'Untested'}
              </span>
            </div>
            <div>
              <span className="font-medium">Auth: </span>
              <span className={authTest?.success ? 'text-green-600' : 'text-red-600'}>
                {authTest ? (authTest.success ? 'Good' : 'Failed') : 'Untested'}
              </span>
            </div>
            <div>
              <span className="font-medium">Refresh: </span>
              <span className={refreshTest?.success ? 'text-green-600' : 'text-red-600'}>
                {refreshTest ? (refreshTest.success ? 'Good' : 'Failed') : 'Untested'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// Placeholder for future debug tests
export const SupabaseDebugTest: React.FC = () => {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Supabase Debug Test</h2>
      <p className="text-gray-600 mb-4">Advanced debugging tests will be implemented in Stage 2.</p>
      <a href="/?test=supabase" className="block mt-4 p-2 bg-blue-500 text-white rounded">
        Go to Basic Connection Test
      </a>
      <a href="/" className="block mt-2 p-2 bg-gray-500 text-white rounded">
        Return to App
      </a>
    </div>
  );
};

// Placeholder for future RLS tests
export const SupabaseRLSTest: React.FC = () => {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Supabase RLS Test</h2>
      <p className="text-gray-600 mb-4">Row Level Security tests will be implemented in Stage 2.</p>
      <a href="/?test=supabase" className="block mt-4 p-2 bg-blue-500 text-white rounded">
        Go to Basic Connection Test
      </a>
      <a href="/" className="block mt-2 p-2 bg-gray-500 text-white rounded">
        Return to App
      </a>
    </div>
  );
};

const SupabaseTest: React.FC = () => {
  return <SupabaseConnectionTest />;
};

export default SupabaseTest;

// Stage 3: Family Creation Test Component
export const FamilyCreationTest: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<TestResult | null>(null);
  const [familyStatus, setFamilyStatus] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAuthFlow = async () => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      // Import authService dynamically
      const { authService } = await import('../services/authService');
      
      // Check if setup is complete (should check Supabase family memberships)
      const isComplete = await authService.isSetupComplete();
      const responseTime = Date.now() - startTime;
      
      setAuthStatus({
        success: true,
        responseTime,
        details: `Setup Complete: ${isComplete ? 'YES - User has family memberships' : 'NO - User needs to create/join family'}`,
        error: undefined
      });
      
    } catch (error: any) {
      setAuthStatus({
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testFamilyCreation = async () => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const result = await supabaseService.createFamily('Test Family', '123 Test Street');
      const responseTime = Date.now() - startTime;
      
      setFamilyStatus({
        success: result.success,
        responseTime,
        error: result.error,
        details: result.family || result.error
      });
      
    } catch (error: any) {
      setFamilyStatus({
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const forceRefresh = () => {
    console.log('🔄 Forcing page refresh to test family creation persistence...');
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        🏠 Family Creation Test - Stage 3
      </h1>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Authentication Flow Test</h2>
            <button
              onClick={testAuthFlow}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Auth Flow'}
            </button>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            Tests the enhanced authentication flow that checks for existing family memberships.
          </div>
          
          {authStatus && (
            <div className={`p-3 rounded ${authStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">
                {authStatus.success ? '✅ Authentication Success' : '❌ Authentication Failed'}
              </div>
              {authStatus.responseTime && (
                <div className="text-sm">Response time: {authStatus.responseTime}ms</div>
              )}
              {authStatus.error && (
                <div className="text-sm mt-1">Error: {authStatus.error}</div>
              )}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Family Creation Test</h2>
            <button
              onClick={testFamilyCreation}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Family'}
            </button>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            This tests family creation RPC function and database write operations.
          </div>
          
          {familyStatus && (
            <div className={`p-3 rounded ${familyStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">
                {familyStatus.success ? '✅ Family Created Successfully' : '❌ Family Creation Failed'}
              </div>
              {familyStatus.responseTime && (
                <div className="text-sm">Response time: {familyStatus.responseTime}ms</div>
              )}
              {familyStatus.error && (
                <div className="text-sm mt-1">Error: {familyStatus.error}</div>
              )}
              {familyStatus.details && (
                <div className="text-xs mt-2 font-mono bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                  {JSON.stringify(familyStatus.details, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Page Refresh Test</h2>
            <button
              onClick={forceRefresh}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              🔄 Force Refresh
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            After creating a family, click refresh to verify the critical refresh scenario works.
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Stage 3 Test Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>First, run "Test Auth Flow" to check if user has existing family memberships</li>
            <li>If setup is complete, user should skip Setup Wizard and go to main app</li>
            <li>Then run "Create Family" to test family creation RPC (if needed)</li>
            <li>Check the response times and data returned</li>
            <li>Click "Force Refresh" to test the critical refresh scenario</li>
            <li>Verify all operations still work after refresh</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
