import React, { useState } from 'react';
import { supabaseService } from '../supabaseService';
import { AuthComponent } from './AuthComponent';
import QRScannerModal from './QRScannerModal';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // Start with step 0 for authentication
  const [familyName, setFamilyName] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Auto-detect device name
  React.useEffect(() => {
    const detectDeviceName = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) return 'iPhone/iPad';
      else if (/android/.test(userAgent)) return 'Android Device';
      else return 'Web Browser';
    };
    setDeviceName(detectDeviceName());
  }, []);

  const handleJoinFamily = async () => {
    setIsQRScannerOpen(true);
  };

  const handleJoinFamilySuccess = async (familyData: any) => {
    console.log('🎉 Joining family:', familyData);
    setError(null);
    setIsLoading(true);

    try {
      // Import the data service to use the join method
      const { dataService } = await import('../dataService');
      const { supabase } = await import('../supabaseService');
      // Check for authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to join a family. Please log in and try again.');
      }

      // Use the actual invite code from the scanned data
      const inviteCode = familyData.inviteCode;
      if (!inviteCode) {
        throw new Error('No invite code provided');
      }

      // Call the join family method
      await (dataService as any).joinFamilyWithInviteCode(inviteCode);
      
      console.log('✅ Successfully joined family, completing setup');
      onComplete();
    } catch (error: any) {
      console.error('❌ Error joining family:', error);
      setError(error.message || 'Failed to join family. Please check the invite code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    console.log('✅ Authentication successful, proceeding to setup');
    setIsAuthenticated(true);
    setStep(1); // Move to welcome step
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      setError('Please enter a family name');
      return;
    }
    if (!deviceName.trim()) {
      setError('Please enter a device name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting family creation process...');
      const result = await supabaseService.createFamily(familyName.trim(), deviceName.trim());
      if (!result.success) {
        throw new Error(result.error || 'Family creation failed');
      }
      const familyContext = result.family;
      console.log('✅ Family created successfully:', familyContext);
      onComplete();
    } catch (err: any) {
      console.error('❌ Error during setup:', err);
      setError(err.message || 'An error occurred during setup');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        // Authentication step
        return <AuthComponent onAuthSuccess={handleAuthSuccess} />;
      
      case 1:
        return (
          <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Welcome to Family Planner</h2>
            <p className="text-gray-600 mb-6">
              Great! You're all set up. Now let's create your family. You can either create a new family or join an existing one.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setStep(2)}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Create New Family
              </button>
              <button
                onClick={handleJoinFamily}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Join Existing Family
              </button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Your Family</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="familyName">
                Family Name
              </label>
              <input
                id="familyName"
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="e.g., The Smiths"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deviceName">
                Device Name
              </label>
              <input
                id="deviceName"
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="e.g., Dad's Phone"
              />
              <p className="text-gray-600 text-xs italic mt-1">
                This helps identify this device in your family
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleCreateFamily}
                disabled={isLoading || !familyName.trim() || !deviceName.trim()}
                className={`${
                  isLoading || !familyName.trim() || !deviceName.trim()
                    ? 'bg-teal-400 cursor-not-allowed' 
                    : 'bg-teal-500 hover:bg-teal-600'
                } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
              >
                {isLoading ? 'Creating...' : 'Create Family'}
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {step === 0 ? (
        // Authentication step - AuthComponent handles its own layout
        renderStep()
      ) : (
        // Other steps - use the existing layout wrapper
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
              Family Planner
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Organize your family life in one place
            </p>
          </div>
          {renderStep()}
        </div>
      )}
      
      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onJoinFamily={handleJoinFamilySuccess}
      />
    </>
  );
};

export default SetupWizard;
