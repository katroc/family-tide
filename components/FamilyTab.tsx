import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FamilyMember, FamilyDetails } from '../types';
import { Users, Plus, Edit3, Trash2, UserPlus, Home, Loader2, QrCode } from 'lucide-react';
import { convertToHexColor } from '../utils/colorUtils';
import QRCodeShareModal from './QRCodeShareModal';
import { useAddressAutocomplete } from '../hooks/useAddressAutocomplete';
import { formatNominatimAddress, AddressSuggestion } from '../utils/addressUtils';

const calculateAge = (dobString?: string): number | null => {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const hexToRGBA = (hex: string, alpha: number): string => {
  if (!hex) return `rgba(148, 163, 184, ${alpha})`;
  let sanitized = hex.replace('#', '');
  if (sanitized.length === 3) {
    sanitized = sanitized.split('').map(char => char + char).join('');
  }
  if (sanitized.length !== 6) return `rgba(148, 163, 184, ${alpha})`;

  const numeric = Number.parseInt(sanitized, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface FamilyTabProps {
  familyMembers: FamilyMember[];
  familyDetails: FamilyDetails;
  setFamilyDetails: React.Dispatch<React.SetStateAction<FamilyDetails>>;
  familyPhoto: string | null;
  isEditingFamily: boolean;
  setIsEditingFamily: React.Dispatch<React.SetStateAction<boolean>>;
  onNewPhotoSelected: (photoDataUrl: string) => void;
  saveFamilyDetails: () => Promise<void> | void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (memberId: number) => void;
  onAddMember: () => void;
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
  onAddMember
}) => {
  const {
    suggestions: addressSuggestions,
    isLoading: isSuggestionsLoading,
    showSuggestions,
    currentAddressInput,
    suggestionsContainerRef,
    addressInputRef,
    handleAddressInputChange: autocompleteHandleInputChange,
    handleSuggestionClick: autocompleteHandleSuggestionClick,
    setShowSuggestions,
    setCurrentAddressInput: setAutocompleteAddress
  } = useAddressAutocomplete(familyDetails.address || '');

  const photoContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    setAutocompleteAddress(familyDetails.address || '');
  }, [familyDetails.address, setAutocompleteAddress]);

  const handleAddressInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFamilyDetails(prev => ({ ...prev, address: event.target.value }));
    autocompleteHandleInputChange(event);
  }, [setFamilyDetails, autocompleteHandleInputChange]);

  const handleSuggestionClick = useCallback((suggestion: AddressSuggestion) => {
    const finalAddress = autocompleteHandleSuggestionClick(
      suggestion,
      (selected, userInput) => formatNominatimAddress(selected.address, userInput)
    );
    setFamilyDetails(prev => ({ ...prev, address: finalAddress }));
  }, [autocompleteHandleSuggestionClick, setFamilyDetails]);

  const clamp = useCallback((value: number, min: number, max: number) => (
    Math.min(Math.max(value, min), max)
  ), []);

  const updatePhotoPosition = useCallback((clientX: number, clientY: number) => {
    const container = photoContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const xPercent = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const yPercent = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
    const newPosition = `${xPercent.toFixed(1)}% ${yPercent.toFixed(1)}%`;

    setFamilyDetails(prev => {
      if (prev.photoObjectPosition === newPosition) return prev;
      return { ...prev, photoObjectPosition: newPosition };
    });
  }, [clamp, setFamilyDetails]);

  const handlePhotoPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!familyPhoto) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingPhoto(true);
    updatePhotoPosition(event.clientX, event.clientY);
  }, [familyPhoto, updatePhotoPosition]);

  const handlePhotoPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPhoto) return;
    updatePhotoPosition(event.clientX, event.clientY);
  }, [isDraggingPhoto, updatePhotoPosition]);

  const endPhotoDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPhoto) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore if capture was already released
    }
    setIsDraggingPhoto(false);
  }, [isDraggingPhoto]);

  const cancelPhotoDrag = useCallback((event?: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPhoto) return;
    if (event) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Safe to ignore if pointer capture was not set
      }
    }
    setIsDraggingPhoto(false);
  }, [isDraggingPhoto]);

  const internalHandlePhotoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onNewPhotoSelected(reader.result);
        setFamilyDetails(prev => ({ ...prev, photoObjectPosition: '50% 50%' }));
        setIsDraggingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }, [onNewPhotoSelected, setFamilyDetails, setIsDraggingPhoto]);

  const triggerPhotoUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSaveDetails = useCallback(async () => {
    await Promise.resolve(saveFamilyDetails());
    setIsEditingFamily(false);
  }, [saveFamilyDetails, setIsEditingFamily]);

  const familyDisplayName = useMemo(() => {
    if (!familyDetails.name || !familyDetails.name.trim()) return null;
    const name = familyDetails.name.replace(/the\s+/i, '').replace(/\s+family/i, '').trim();
    return `The ${name} Family`;
  }, [familyDetails.name]);

  const totalMembers = familyMembers.length;
  const parents = familyMembers.filter(member =>
    /parent|mum|mom|dad|guardian/i.test(member.role)
  ).length;
  const kids = familyMembers.filter(member =>
    /child|kid|teen|son|daughter/i.test(member.role)
  ).length;
  const pets = familyMembers.filter(member =>
    /pet|dog|cat|hamster|fish|bird/i.test(member.role)
  ).length;

  const upcomingBirthdayMembers = useMemo(() => familyMembers.filter(member => {
    if (!member.dob) return false;
    const today = new Date();
    const thisYearBirthday = new Date(member.dob);
    thisYearBirthday.setFullYear(today.getFullYear());

    const diff = thisYearBirthday.getTime() - today.getTime();
    const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && daysUntil <= 30) return true;

    // Handle wrap around end of year
    if (daysUntil < 0) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
      const nextDiff = thisYearBirthday.getTime() - today.getTime();
      const nextDaysUntil = Math.ceil(nextDiff / (1000 * 60 * 60 * 24));
      return nextDaysUntil >= 0 && nextDaysUntil <= 30;
    }

    return false;
  }), [familyMembers]);

  const glanceStats = useMemo(() => [
    { label: 'Members', value: totalMembers },
    { label: 'Parents', value: parents },
    { label: 'Kids', value: kids },
    { label: 'Pets', value: pets },
    { label: 'Upcoming birthdays', value: upcomingBirthdayMembers.length }
  ], [totalMembers, parents, kids, pets, upcomingBirthdayMembers.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-4">
            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              {isEditingFamily ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Update family profile</p>
                    <h3 className="text-xl font-semibold text-slate-700">Family Details</h3>
                  </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={internalHandlePhotoUpload}
                  className="hidden"
                  aria-label="Upload family photo"
                />

                <div
                  ref={photoContainerRef}
                  className={`group relative mt-6 h-48 overflow-hidden rounded-2xl bg-slate-100 ${familyPhoto ? (isDraggingPhoto ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'}`}
                  onClick={!familyPhoto ? triggerPhotoUpload : undefined}
                  onPointerDown={familyPhoto ? handlePhotoPointerDown : undefined}
                  onPointerMove={familyPhoto ? handlePhotoPointerMove : undefined}
                  onPointerUp={familyPhoto ? endPhotoDrag : undefined}
                  onPointerLeave={familyPhoto ? (event) => cancelPhotoDrag(event) : undefined}
                  onPointerCancel={familyPhoto ? (event) => cancelPhotoDrag(event) : undefined}
                  role={!familyPhoto ? 'button' : undefined}
                  aria-label={!familyPhoto ? 'Upload family photo' : undefined}
                  tabIndex={!familyPhoto ? 0 : undefined}
                  onKeyDown={!familyPhoto ? ((event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      triggerPhotoUpload();
                    }
                  }) : undefined}
                >
                  {familyPhoto ? (
                    <>
                      <img
                        src={familyPhoto}
                        alt="Family"
                        className="h-full w-full object-cover"
                        style={{ objectPosition: familyDetails.photoObjectPosition || '50% 50%' }}
                      />
                      <div className={`pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition ${isDraggingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        Drag to reposition
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <Plus size={20} className="mr-2" />
                      Add family photo
                    </div>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={triggerPhotoUpload}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    {familyPhoto ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {familyPhoto && (
                    <button
                      type="button"
                      onClick={() => setFamilyDetails(prev => ({ ...prev, photoObjectPosition: '50% 50%' }))}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Reset Crop
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Family name</label>
                  <input
                    type="text"
                    value={familyDetails.name}
                    onChange={(e) => setFamilyDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., The Smiths"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Home address</label>
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={currentAddressInput}
                    onChange={handleAddressInputChange}
                    onFocus={() => { if (currentAddressInput.length > 2) setShowSuggestions(true); }}
                    placeholder="Search for address"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
                    autoComplete="off"
                  />
                  {(showSuggestions || isSuggestionsLoading) && (
                    <div ref={suggestionsContainerRef} className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                      {isSuggestionsLoading && (
                        <div className="flex items-center gap-2 p-3 text-sm text-slate-500">
                          <Loader2 size={16} className="animate-spin" />
                          Searching addresses…
                        </div>
                      )}
                      {addressSuggestions.map(suggestion => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
                        >
                          {suggestion.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <button
                    onClick={handleSaveDetails}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditingFamily(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Family profile</p>
                    <h3 className="text-xl font-semibold text-slate-700">{familyDisplayName || 'Our Family'}</h3>
                  </div>
                  <div className="flex gap-2 self-start">
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                    >
                      <QrCode size={16} />
                      Share
                    </button>
                    <button
                      onClick={() => setIsEditingFamily(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>
                  </div>
                </div>

                <div
                  ref={photoContainerRef}
                  className={`group relative mt-2 h-48 overflow-hidden rounded-2xl bg-slate-100 ${familyPhoto ? (isDraggingPhoto ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
                  onPointerDown={familyPhoto ? handlePhotoPointerDown : undefined}
                  onPointerMove={familyPhoto ? handlePhotoPointerMove : undefined}
                  onPointerUp={familyPhoto ? endPhotoDrag : undefined}
                  onPointerLeave={familyPhoto ? (event) => cancelPhotoDrag(event) : undefined}
                  onPointerCancel={familyPhoto ? (event) => cancelPhotoDrag(event) : undefined}
                >
                  {familyPhoto ? (
                    <>
                      <img
                        src={familyPhoto}
                        alt={familyDetails.name || 'Family'}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: familyDetails.photoObjectPosition || '50% 50%' }}
                      />
                      <div className={`pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition ${isDraggingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        Drag to reposition
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-400">
                      <Home size={28} className="mb-2" />
                      <span>Add a family photo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 text-sm text-slate-600">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Home base</p>
                    <p className="mt-1">
                      {familyDetails.address || 'No address saved yet.'}
                    </p>
                  </div>

                  {familyMembers.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Family members</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {familyMembers.slice(0, 4).map(member => {
                          const memberHex = convertToHexColor(member.color);
                          return (
                            <span
                              key={`chip-${member.id}`}
                              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-slate-600"
                              style={{
                                backgroundColor: hexToRGBA(memberHex, 0.12),
                                borderColor: hexToRGBA(memberHex, 0.35)
                              }}
                            >
                              <span
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-semibold text-white"
                                style={{ backgroundColor: memberHex }}
                              >
                                {member.initial}
                              </span>
                              {member.name}
                            </span>
                          );
                        })}
                        {familyMembers.length > 4 && (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                            +{familyMembers.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">At a glance</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {glanceStats.map(stat => (
                  <div key={stat.label}>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                    <p className="mt-1 text-xl font-semibold text-slate-700">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Upcoming birthdays</p>
              {upcomingBirthdayMembers.length > 0 ? (
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {upcomingBirthdayMembers.slice(0, 5).map(member => {
                    const birthday = new Date(member.dob!);
                    const formatted = birthday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    return (
                      <li key={`birthday-${member.id}`} className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{member.name}</span>
                        <span className="text-slate-500">{formatted}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No birthdays in the next 30 days.</p>
              )}
            </section>
          </div>

          <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm lg:col-span-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Family members</p>
                <h3 className="text-xl font-semibold text-slate-700">{totalMembers} member{totalMembers === 1 ? '' : 's'}</h3>
              </div>
              <button
                onClick={onAddMember}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600"
              >
                <UserPlus size={16} />
                Add Member
              </button>
            </div>

            {familyMembers.length > 0 ? (
              <div className="grid max-h-full grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                {familyMembers.map(member => {
                  const age = calculateAge(member.dob);
                  const avatarColour = convertToHexColor(member.color);

                  return (
                    <div
                      key={member.id}
                      className="group relative flex h-full flex-col gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                      style={{
                        backgroundColor: hexToRGBA(avatarColour, 0.12),
                        borderColor: hexToRGBA(avatarColour, 0.35)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white"
                            style={{ backgroundColor: avatarColour }}
                          >
                            {member.initial}
                          </span>
                          <div>
                            <h4 className="text-base font-semibold text-slate-700">{member.name}</h4>
                            <p className="text-sm text-slate-500 capitalize">{member.role || 'Family member'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => onEditMember(member)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:border-teal-400 hover:text-teal-500"
                            aria-label={`Edit ${member.name}`}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteMember(Number(member.id))}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:border-red-400 hover:text-red-500"
                            aria-label={`Delete ${member.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-auto space-y-2 text-sm text-slate-600">
                        {member.nickname && (
                          <p><span className="font-medium text-slate-500">Nickname:</span> {member.nickname}</p>
                        )}
                        {member.dob && (
                          <p>
                            <span className="font-medium text-slate-500">Birthday:</span> {member.dob}
                            {age !== null && <span className="ml-2 text-slate-400">({age})</span>}
                          </p>
                        )}
                        <p>
                          <span className="font-medium text-slate-500">Points:</span> {member.points}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center text-slate-500">
                <Users size={32} className="mb-3" />
                <p className="mb-2 text-sm">You haven’t added any family members yet.</p>
                <p className="mb-4 text-sm text-slate-400">Invite everyone to build chore schedules, routines, and rewards together.</p>
                <button
                  onClick={onAddMember}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600"
                >
                  <UserPlus size={16} />
                  Add your first member
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      <QRCodeShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        familyDetails={familyDetails}
      />
    </div>
  );
};

export default FamilyTab;
