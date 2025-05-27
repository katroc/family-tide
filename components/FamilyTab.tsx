import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FamilyMember, FamilyDetails } from '../types';
import { Users, Plus, Edit3, Trash2, UserPlus, Home, Cake, Search, Loader2, X, Expand, Shrink, QrCode } from 'lucide-react'; // Added QrCode
import { getAbbreviatedState } from '../utils';
import { convertToHexColor } from '../utils/colorUtils';
import QRCodeShareModal from './QRCodeShareModal';

// Interface for the structured address details from Nominatim
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

const calculateAge = (dobString?: string): number | null => {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

interface FamilyTabProps {
  familyMembers: FamilyMember[];
  familyDetails: FamilyDetails;
  setFamilyDetails: React.Dispatch<React.SetStateAction<FamilyDetails>>;
  familyPhoto: string | null;
  isEditingFamily: boolean;
  setIsEditingFamily: React.Dispatch<React.SetStateAction<boolean>>;
  onNewPhotoSelected: (photoDataUrl: string) => void;
  saveFamilyDetails: () => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (memberId: number) => void;
  onAddMember: () => void;
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
    const inputMatch = userInputForStreetNumber.match(/^(\d+[a-zA-Z]?)\s+/);
    if (inputMatch) streetNumber = inputMatch[1];
  }
  const roadName = addressDetails.road || '';
  if (streetNumber && roadName) streetPart = `${streetNumber} ${roadName}`;
  else if (roadName) streetPart = roadName;
  else if (streetNumber) streetPart = streetNumber;
  streetPart = streetPart.trim();

  townSuburbPart = addressDetails.suburb || addressDetails.town || addressDetails.village || addressDetails.hamlet || addressDetails.city || addressDetails.county || '';
  
  if (addressDetails.state && addressDetails.country_code) statePart = getAbbreviatedState(addressDetails.state, addressDetails.country_code);
  else if (addressDetails.state) statePart = addressDetails.state;

  postcodePart = addressDetails.postcode || '';
  countryPart = addressDetails.country || '';
  const formattedAddressParts = [streetPart, townSuburbPart, statePart, postcodePart, countryPart].filter(part => part && part.trim() !== '');
  return formattedAddressParts.join(', ');
};

// Utility to get an offset Tailwind color class for the avatar
function getOffsetColorClass(colorClass: string | undefined): string {
  if (!colorClass) return 'bg-slate-200';
  // Try to match bg-<color>-<shade>
  const match = colorClass.match(/^(bg-)?([a-z]+)-(\d{3})$/);
  if (!match) return colorClass;
  const [, , base, shadeStr] = match;
  const shade = parseInt(shadeStr, 10);
  // Always go lighter
  let newShade = shade - 100;
  if (newShade < 50) newShade = 50;
  return `bg-${base}-${newShade}`;
}

const FamilyTab: React.FC<FamilyTabProps> = ({
  familyMembers,
  familyDetails,
  setFamilyDetails,
  familyPhoto,
  isEditingFamily,
  setIsEditingFamily,
  onNewPhotoSelected,
  saveFamilyDetails,
  onEditMember,
  onDeleteMember,
  onAddMember,
}) => {
  const [addressSuggestions, setAddressSuggestions] = useState<ParsedNominatimSuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentAddressInput, setCurrentAddressInput] = useState(familyDetails.address);
  const [photoObjectFit, setPhotoObjectFit] = useState<'cover' | 'contain'>('cover');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);


  const debounceTimeoutRef = useRef<number | null>(null);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<number | null>(null);

  // Keep currentAddressInput in sync with familyDetails.address
  useEffect(() => {
    setCurrentAddressInput(familyDetails.address || '');
  }, [familyDetails.address]);
  

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsContainerRef.current && !suggestionsContainerRef.current.contains(event.target as Node) && addressInputRef.current && !addressInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAddressSuggestions = useCallback(async (query: string) => {
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
    // Update family details with the new address
    setFamilyDetails(prev => ({ ...prev, address: newAddress }));
    
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
    setFamilyDetails(prev => ({ ...prev, address: finalAddress }));
    setCurrentAddressInput(finalAddress); setAddressSuggestions([]); setShowSuggestions(false);
  };

  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isEditingFamily) return;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => setIsEditingFamily(true), 700);
  }, [isEditingFamily, setIsEditingFamily]);

  const handlePressEnd = useCallback(() => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
  }, []);
  
  const familyDisplayName = useMemo(() => {
    if (familyDetails.name && familyDetails.name.trim() !== '') {
      const name = familyDetails.name.replace(/the\s+/i, '').replace(/\s+family/i, '').trim();
      return `The ${name} Family`;
    }
    return null;
  }, [familyDetails.name]);

  const togglePhotoObjectFit = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card long press from triggering
    setPhotoObjectFit(prev => prev === 'cover' ? 'contain' : 'cover');
  };

  const internalHandlePhotoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onNewPhotoSelected(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onNewPhotoSelected]);


  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col flex-1 mb-8 overflow-hidden"> 
        <div className="flex justify-between items-center mb-6 gap-2 sm:gap-4 flex-shrink-0">
          {familyDisplayName ? (
            <h2 className="text-xl sm:text-2xl font-light text-slate-600 truncate" title={familyDisplayName}>
              {familyDisplayName}
            </h2>
          ) : (
            <div></div> 
          )}
          <div className="flex gap-2">
            <button 
              onClick={() => setIsShareModalOpen(true)} 
              className="bg-slate-100/60 hover:bg-blue-600 text-slate-600 rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg transition-colors flex items-center gap-2 min-h-[40px] sm:min-h-[48px]"
            >
              <QrCode size={18} />
              <span className="text-xs sm:text-sm font-medium">Share</span>
            </button>
            <button onClick={onAddMember} className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg transition-colors flex items-center gap-2 min-h-[40px] sm:min-h-[48px]">
              <UserPlus size={18} />
              <span className="text-xs sm:text-sm font-medium">Add Member</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row flex-1 gap-6 sm:gap-8 overflow-hidden min-h-0">
          <div 
            className={`backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-lg flex flex-col lg:w-2/5 lg:flex-shrink-0 relative min-h-0 lg:max-h-full`}
            style={{backgroundColor: '#80B8BD'}}
          >
            {isEditingFamily ? (
              <div className="h-full flex flex-col min-h-0">
                <div 
                  className="relative bg-gray-200 rounded-2xl mb-3 sm:mb-4 h-40 sm:h-48 overflow-hidden group flex-shrink-0"
                >
                  <input type="file" accept="image/*" onChange={internalHandlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" aria-label="Upload family photo" />
                  {familyPhoto ? (
                    <img 
                      src={familyPhoto} 
                      alt="Family Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <div className="text-center"><Plus size={20} className="mx-auto mb-1 sm:mb-2" /><p className="text-xs sm:text-sm">Click to add photo</p></div>
                    </div>
                  )}
                   <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                       <div className="bg-white/90 rounded-full p-1 sm:p-2"><Edit3 size={14} className="text-slate-600" /></div>
                   </div>
                </div>
                <div className="mb-3 sm:mb-4 flex-shrink-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Family Name</label>
                  <input
                    type="text"
                    value={familyDetails.name}
                    onChange={(e) => setFamilyDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., The Smiths"
                    className="w-full p-2 sm:p-3 border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none bg-slate-50 text-slate-600 placeholder-slate-400 text-sm sm:text-base"
                  />
                </div>
                <div className="relative mb-3 sm:mb-4 flex-grow flex flex-col min-h-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 flex-shrink-0">Family Address</label>
                  <div className="relative flex-grow flex flex-col min-h-0">
                    <input
                      ref={addressInputRef}
                      type="text"
                      value={familyDetails.address}
                      onChange={handleAddressInputChange}
                      onFocus={() => {if (familyDetails.address?.length > 2) setShowSuggestions(true);}}
                      placeholder="Search for address"
                      className="w-full p-2 sm:p-3 border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none bg-slate-50 text-slate-600 placeholder-slate-400 text-sm sm:text-base min-h-[40px] sm:min-h-[44px] flex-shrink-0"
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
                </div>
                <div className="mt-auto pt-3 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                  <button onClick={saveFamilyDetails} className="flex-1 bg-teal-500 text-white py-2 px-3 sm:py-3 sm:px-4 rounded-lg hover:bg-teal-600 transition-colors font-medium text-xs sm:text-sm">Save Details</button>
                  <button onClick={() => setIsEditingFamily(false)} className="flex-1 bg-slate-300 text-slate-600 py-2 px-3 sm:py-3 sm:px-4 rounded-lg hover:bg-slate-400 transition-colors font-medium text-xs sm:text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col min-h-0 group">
                <button 
                  onClick={() => setIsEditingFamily(true)}
                  className="absolute top-2 right-2 bg-slate-100/90 hover:bg-teal-500 hover:text-white text-slate-600 rounded-lg p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Edit family details"
                >
                  <Edit3 size={18} />
                </button>
                <div className="relative bg-gray-200/50 rounded-2xl mb-3 sm:mb-4 h-40 sm:h-48 group flex-shrink-0 overflow-hidden">
                  {familyPhoto ? (
                    <img src={familyPhoto} alt={familyDetails.name || "Family"} 
                         className={`w-full h-full object-${photoObjectFit}`} 
                         style={{ objectPosition: familyDetails.photoObjectPosition || '50% 50%' }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500"><Home size={30} /></div>
                  )}
                </div>
                <div className="text-center flex-grow min-h-0 overflow-hidden">
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-600 mb-1 sm:mb-1.5 truncate" title={familyDetails.name}>{familyDetails.name || "Our Family"}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 truncate leading-snug" title={familyDetails.address}>
                    {familyDetails.address || "No address set"}
                  </p>
                </div>
                {familyMembers && familyMembers.length > 0 && (
                  <div className="my-2 flex justify-center items-center gap-1.5 sm:gap-2 px-1 overflow-x-auto flex-shrink-0 h-10">
                    {familyMembers.filter(Boolean).map(member => (
                      member && (
                        <div 
                          key={`card-member-${member.id}`} 
                          className="rounded-full w-6 h-6 sm:w-10 sm:h-10 flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0 overflow-hidden"
                          style={{ backgroundColor: convertToHexColor(member.color) }}
                          title={member.name}
                        >
                          <span className="text-slate-600 font-bold">{member.initial}</span>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 lg:w-3/5 flex flex-col overflow-hidden min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-2 sm:gap-x-3 sm:gap-y-3 lg:gap-x-4 lg:gap-y-4 flex-1 overflow-y-auto p-1">
              {familyMembers.map(member => {
                const age = calculateAge(member.dob);
                const cardBgColor = member.color || 'bg-slate-100';
                const isLightColor = cardBgColor.includes('50') || cardBgColor.includes('100') || cardBgColor.includes('200');
                const textColor = 'text-slate-600';
                const secondaryTextColor = 'text-slate-500';
                const buttonBg = isLightColor ? 'bg-slate-100/90' : 'bg-slate-800/80';
                const buttonHover = isLightColor ? 'hover:bg-slate-200/90' : 'hover:bg-slate-700/90';
                
                return (
                <div 
                  key={member.id} 
                  className={`${textColor} rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col items-center justify-between text-center h-40 sm:h-48 relative group transform transition-transform duration-150 ease-in-out hover:scale-105`}
                  style={{ backgroundColor: convertToHexColor(member.color) }}
                >
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 sm:gap-2 z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditMember(member);
                      }}
                      className={`${buttonBg} ${isLightColor ? 'text-slate-600 hover:text-teal-600' : 'text-white hover:text-teal-200'} rounded-lg p-1 sm:p-2 ${buttonHover} transition-colors shadow-md min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center`} 
                      aria-label={`Edit ${member.name}`}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete ${member.name}? This action cannot be undone.`)) {
                          onDeleteMember(Number(member.id));
                        }
                      }} 
                      className={`${buttonBg} ${isLightColor ? 'text-red-600' : 'text-red-300'} rounded-lg p-1 sm:p-2 ${buttonHover} transition-colors shadow-md min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center`} 
                      aria-label={`Delete ${member.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 ${getOffsetColorClass(member.color) || 'bg-slate-100'} rounded-full flex items-center justify-center mb-1 sm:mb-2 flex-shrink-0`}>
                    <span className="text-xl sm:text-2xl font-bold text-slate-600">{member.initial}</span>
                  </div>
                  <div className="flex-grow flex flex-col justify-center">
                    <h4 className={`text-sm sm:text-base font-semibold ${textColor}`}>{member.name}</h4>
                    {member.nickname && <p className={`text-xs ${secondaryTextColor} italic`}>({member.nickname})</p>}
                    <p className={`text-xs ${secondaryTextColor}`}>{member.role}</p>
                    {member.dob && (
                      <div className={`text-xs ${secondaryTextColor} mt-0.5 flex items-center justify-center`}>
                        <Cake size={12} className="mr-1 opacity-70"/> {member.dob} {age !== null && <span className="ml-1">(Age: {age})</span>}
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Share Modal */}
      <QRCodeShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        familyDetails={familyDetails}
      />
    </div>
  );
};

export default FamilyTab;
