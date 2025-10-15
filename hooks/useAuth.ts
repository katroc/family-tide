import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { supabaseService } from '../supabaseService';
import { dataService } from '../dataService';

export interface UseAuthReturn {
  isCheckingAuth: boolean;
  showSetupWizard: boolean;
  setShowSetupWizard: (show: boolean) => void;
  user: any | null;
  currentFamilyId: string | null;
  handleSetupComplete: (newFamilyId: string) => Promise<void>;
}

/**
 * Custom hook to handle authentication and setup wizard logic
 * Extracts complex auth state management from App component
 */
export function useAuth(): UseAuthReturn {
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [showSetupWizard, setShowSetupWizard] = useState<boolean>(true);
  const [user, setUser] = useState<any | null>(null);
  const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);

  // Check if we need to show setup wizard
  useEffect(() => {
    let mounted = true;

    const checkSetup = async (retryCount = 0) => {
      try {
        console.log('🔍 [useAuth] Checking if setup is complete... (attempt:', retryCount + 1, ')');
        await new Promise(resolve => setTimeout(resolve, 100)); // Ensure auth state propagates

        const setupStatus = await authService.isSetupComplete();
        console.log('🔍 [useAuth] Setup completion result (boolean):', setupStatus);

        if (mounted) {
          if (setupStatus === true) {
            console.log('✅ [useAuth] Setup reported as complete. Attempting to load current family ID.');
            try {
              const userResult = await supabaseService.getCurrentUser();

              if (userResult && userResult.user) {
                setUser(userResult.user);
                const familiesResult = await supabaseService.getUserFamilies();

                if (familiesResult.success && familiesResult.families && familiesResult.families.length > 0) {
                  const primaryFamilyId = familiesResult.families[0].family?.id;

                  if (primaryFamilyId) {
                    console.log('✅ [useAuth] Found primary family ID:', primaryFamilyId);
                    dataService.setCurrentFamilyId(primaryFamilyId);
                    await dataService.initialize();
                    setCurrentFamilyId(primaryFamilyId);
                    setShowSetupWizard(false);
                  } else {
                    console.warn('⚠️ [useAuth] Setup complete, but no primary family ID found. Showing wizard.');
                    setShowSetupWizard(true);
                  }
                } else {
                  console.warn('⚠️ [useAuth] Setup complete, but no families found for user. Showing wizard.');
                  setShowSetupWizard(true);
                }
              } else {
                console.log('👤 [useAuth] No authenticated user found. Showing wizard.');
                setShowSetupWizard(true);
              }
            } catch (e) {
              console.error('❌ [useAuth] Error fetching family ID during setup check:', e);
              setShowSetupWizard(true);
            }
          } else {
            console.log('⚠️ [useAuth] Setup reported as not complete. Showing setup wizard.');
            setShowSetupWizard(true);
          }
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error('❌ [useAuth] Error checking setup completion:', error);

        // Retry once if this is the first attempt
        if (retryCount === 0 && mounted) {
          console.log('🔄 [useAuth] Retrying setup check in 1 second...');
          setTimeout(() => {
            if (mounted) {
              checkSetup(1);
            }
          }, 1000);
          return;
        }

        if (mounted) {
          console.log('🔄 [useAuth] Defaulting to setup wizard due to persistent error');
          setShowSetupWizard(true);
          setIsCheckingAuth(false);
        }
      }
    };

    checkSetup();

    return () => {
      mounted = false;
    };
  }, []);

  // Handle setup completion
  const handleSetupComplete = useCallback(async (newFamilyId: string) => {
    setShowSetupWizard(false);
    try {
      dataService.setCurrentFamilyId(newFamilyId);
      await dataService.initialize();
      setCurrentFamilyId(newFamilyId);
    } catch (error) {
      console.error('❌ [useAuth] Error during setup completion:', error);
      throw error;
    }
  }, []);

  return {
    isCheckingAuth,
    showSetupWizard,
    setShowSetupWizard,
    user,
    currentFamilyId,
    handleSetupComplete
  };
}
