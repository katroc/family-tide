import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { supabaseService } from '../supabaseService';
import { dataService } from '../dataService';
import { authLogger } from '../utils/logger';

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
        authLogger.debug('Checking if setup is complete', { attempt: retryCount + 1 });
        await new Promise(resolve => setTimeout(resolve, 100)); // Ensure auth state propagates

        const setupStatus = await authService.isSetupComplete();
        authLogger.debug('Setup completion result', { setupStatus });

        if (mounted) {
          if (setupStatus === true) {
            authLogger.info('Setup complete - loading family ID');
            try {
              const userResult = await supabaseService.getCurrentUser();

              if (userResult && userResult.user) {
                setUser(userResult.user);
                const familiesResult = await supabaseService.getUserFamilies();

                if (familiesResult.success && familiesResult.families && familiesResult.families.length > 0) {
                  const primaryFamilyId = familiesResult.families[0].family?.id;

                  if (primaryFamilyId) {
                    authLogger.info('Found primary family', { familyId: primaryFamilyId });
                    dataService.setCurrentFamilyId(primaryFamilyId);
                    await dataService.initialize();
                    setCurrentFamilyId(primaryFamilyId);
                    setShowSetupWizard(false);
                  } else {
                    authLogger.warn('Setup complete but no primary family ID found - showing wizard');
                    setShowSetupWizard(true);
                  }
                } else {
                  authLogger.warn('Setup complete but no families found for user - showing wizard');
                  setShowSetupWizard(true);
                }
              } else {
                authLogger.info('No authenticated user found - showing wizard');
                setShowSetupWizard(true);
              }
            } catch (e) {
              authLogger.error('Error fetching family ID during setup check', e as Error);
              setShowSetupWizard(true);
            }
          } else {
            authLogger.info('Setup not complete - showing wizard');
            setShowSetupWizard(true);
          }
          setIsCheckingAuth(false);
        }
      } catch (error) {
        authLogger.error('Error checking setup completion', error as Error, { retryCount });

        // Retry once if this is the first attempt
        if (retryCount === 0 && mounted) {
          authLogger.debug('Retrying setup check in 1 second');
          setTimeout(() => {
            if (mounted) {
              checkSetup(1);
            }
          }, 1000);
          return;
        }

        if (mounted) {
          authLogger.warn('Defaulting to setup wizard due to persistent error');
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
      authLogger.error('Error during setup completion', error as Error, { familyId: newFamilyId });
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
