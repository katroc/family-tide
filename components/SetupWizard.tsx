import React, { useState } from 'react';
import { supabaseService } from '../supabaseService';
import { AuthComponent } from './AuthComponent';
import QRScannerModal from './QRScannerModal';

interface SetupWizardProps {
  onComplete: (familyId: string) => void;
}

// Address autocomplete dependencies from FamilyTab
interface NominatimAddressDetails {
  house_number?: string;
  road?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  city_district?: string;
}
interface ParsedNominatimSuggestion {
  place_id: number;
  display_name: string;
  address: NominatimAddressDetails;
}
const formatNominatimAddress = (
  addressDetails: NominatimAddressDetails,
  userInputForStreetNumber: string
): string => {
  if (!addressDetails) return '';
  let streetPart = '';
  let townSuburbPart = '';
  let statePart = '';
  let postcodePart = '';
  let countryPart = '';
  let streetNumber = addressDetails.house_number || '';
  if (!streetNumber && userInputForStreetNumber) {
    const inputMatch = userInputForStreetNumber.match(/^\d+[a-zA-Z]?/);
    if (inputMatch) streetNumber = inputMatch[0];
  }
  const roadName = addressDetails.road || '';
  if (streetNumber && roadName) streetPart = `${streetNumber} ${roadName}`;
  else if (roadName) streetPart = roadName;
  else if (streetNumber) streetPart = streetNumber;
  streetPart = streetPart.trim();
  townSuburbPart = addressDetails.suburb || addressDetails.town || addressDetails.village || addressDetails.hamlet || addressDetails.city || addressDetails.county || '';
  statePart = addressDetails.state || '';
  postcodePart = addressDetails.postcode || '';
  countryPart = addressDetails.country || '';
  const formattedAddressParts = [streetPart, townSuburbPart, statePart, postcodePart, countryPart].filter(part => part && part.trim() !== '');
  return formattedAddressParts.join(', ');
};

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // Start with step 0 for authentication
  const [familyName, setFamilyName] = useState('');
  // Replace deviceName with address
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [familyPhoto, setFamilyPhoto] = useState<string | null>(null);

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<ParsedNominatimSuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentAddressInput, setCurrentAddressInput] = useState('');
  const debounceTimeoutRef = React.useRef<number | null>(null);
  const suggestionsContainerRef = React.useRef<HTMLDivElement>(null);
  const addressInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setCurrentAddressInput(address);
  }, [address]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsContainerRef.current && !suggestionsContainerRef.current.contains(event.target as Node) && addressInputRef.current && !addressInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAddressSuggestions = React.useCallback(async (query: string) => {
    if (query.length < 3) { setAddressSuggestions([]); setShowSuggestions(false); return; }
    setIsSuggestionsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data: ParsedNominatimSuggestion[] = await response.json();
      const validSuggestions = data.filter(s => s.address);
      setAddressSuggestions(validSuggestions); setShowSuggestions(true);
    } catch (error) { console.error('Failed to fetch address suggestions:', error); setAddressSuggestions([]); } 
    finally { setIsSuggestionsLoading(false); }
  }, []);

  const handleAddressInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = event.target.value;
    setCurrentAddressInput(newAddress);
    setAddress(newAddress);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (newAddress.trim() === '') { 
      setAddressSuggestions([]); 
      setShowSuggestions(false); 
      return; 
    }
    debounceTimeoutRef.current = window.setTimeout(() => fetchAddressSuggestions(newAddress), 750);
  };

  const handleSuggestionClick = (suggestion: ParsedNominatimSuggestion) => {
    const finalAddress = formatNominatimAddress(suggestion.address, currentAddressInput);
    setAddress(finalAddress);
    setCurrentAddressInput(finalAddress); setAddressSuggestions([]); setShowSuggestions(false);
  };

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
      onComplete(familyData.familyId);
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFamilyPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      setError('Please enter a family name');
      return;
    }
    if (!address.trim()) {
      setError('Please enter a home address');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log('🚀 Starting family creation process...');
      const result = await supabaseService.createFamily(familyName.trim(), address.trim());
      if (!result.success) {
        throw new Error(result.error || 'Family creation failed');
      }
      const familyContext = result.family;
      console.log('✅ Family created successfully:', familyContext);
      // Add a short delay to ensure DB commit
      await new Promise(res => setTimeout(res, 300));
      onComplete(familyContext.id); // Pass new family ID up
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
          <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Welcome to Family Tide</h2>
            <p className="text-slate-600 mb-6">
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
                className="w-full bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Join Existing Family
              </button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden text-slate-600">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Create Your Family</h2>
            {/* Family Photo Upload */}
            <div className="mb-4 flex flex-col items-center">
              <div className="relative bg-slate-200 rounded-2xl mb-2 h-32 w-32 overflow-hidden group flex-shrink-0">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" aria-label="Upload family photo" />
                {familyPhoto ? (
                  <img src={familyPhoto} alt="Family Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <span className="text-xs">Click to add photo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                  <div className="bg-white/90 rounded-full p-1"><span className="text-slate-600 text-xs">Edit</span></div>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="familyName">
                Family Name
              </label>
              <input
                id="familyName"
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="e.g., The Smiths"
              />
            </div>
            <div className="mb-6 relative">
              <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="address">
                Home Address
              </label>
              <input
                id="address"
                ref={addressInputRef}
                type="text"
                value={currentAddressInput}
                onChange={handleAddressInputChange}
                onFocus={() => {if (currentAddressInput.length > 2) setShowSuggestions(true);}}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="e.g., 123 Main St, Springfield"
                autoComplete="off"
              />
              {showSuggestions && addressSuggestions.length > 0 && (
                <div ref={suggestionsContainerRef} className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {addressSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="p-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-600"
                    >
                      {suggestion.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleCreateFamily}
                disabled={isLoading || !familyName.trim() || !address.trim()}
                className={`
                  ${isLoading || !familyName.trim() || !address.trim()
                    ? 'bg-teal-400 cursor-not-allowed'
                    : 'bg-teal-500 hover:bg-teal-600'}
                  text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
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
        <div className="min-h-screen bg-[#A8D8D8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src="/familytide.png" 
                alt="Family Tide" 
                className="w-52 h-52 object-contain"
              />
            </div>
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