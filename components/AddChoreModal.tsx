import React, { useState, useEffect, useCallback } from 'react';
import { Chore, FamilyMember, ChoreType } from '../types';
import { convertToHexColor } from '../utils/colorUtils';
import { getIcon } from '../utils/iconUtils';

interface AddChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveChore: (newChoreData: Omit<Chore, 'id' | 'completed'>) => void;
  familyMembers: FamilyMember[];
  defaultNewChoreState: Omit<Chore, 'id' | 'completed'>;
  choreTypes: ChoreType[];
}

const AddChoreModal: React.FC<AddChoreModalProps> = ({
  isOpen,
  onClose,
  onSaveChore,
  familyMembers,
  defaultNewChoreState,
  choreTypes,
}) => {
  const [newChore, setNewChore] = useState(defaultNewChoreState);
  const [selectedChoreTypeId, setSelectedChoreTypeId] = useState<string>('');

  const toggleAssignedTo = useCallback((memberName: string) => {
    setNewChore(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(memberName)
        ? prev.assignedTo.filter(name => name !== memberName)
        : [...prev.assignedTo, memberName]
    }));
  }, []);

  const getMemberColor = useCallback((memberName: string) => {
    const member = familyMembers.find(m => m.name === memberName);
    return convertToHexColor(member?.color);
  }, [familyMembers]);

  useEffect(() => {
    if (isOpen) {
      const initialAssignee = familyMembers.length > 0 ? familyMembers[0].name : 
        (Array.isArray(defaultNewChoreState.assignedTo) && defaultNewChoreState.assignedTo.length > 0 
          ? defaultNewChoreState.assignedTo[0] 
          : '');
      setNewChore({ 
        ...defaultNewChoreState, 
        assignedTo: initialAssignee ? [initialAssignee] : [] 
      });
      setSelectedChoreTypeId(''); // Reset selected type
    }
  }, [isOpen, defaultNewChoreState, familyMembers]);

  const handleChoreTypeChange = useCallback((typeId: string) => {
    setSelectedChoreTypeId(typeId);
    if (typeId) {
      const selectedType = choreTypes.find(ct => ct.id === typeId);
      if (selectedType) {
        setNewChore(prev => ({
          ...prev,
          title: selectedType.name,
          points: selectedType.defaultPoints,
          icon: selectedType.icon,
          choreTypeId: selectedType.id,
        }));
      }
    } else { // Custom chore
      setNewChore(prev => ({
        ...prev,
        // Keep current title/points if user was editing, or reset to defaults
        // For simplicity, let's allow current values to persist if user switches from a type to custom
        // Alternatively, could reset title/points to ''/defaultNewChoreState.points
        icon: undefined, 
        choreTypeId: undefined,
      }));
    }
  }, [choreTypes]);

  const handleChange = useCallback(<K extends keyof Omit<Chore, 'id' | 'completed'>>(
    field: K, 
    value: Omit<Chore, 'id' | 'completed'>[K]
  ) => {
    setNewChore(prev => ({ ...prev, [field]: value }));
    // If user manually changes title or points after selecting a type, it becomes "custom" implicitly
    // or we could clear selectedChoreTypeId here if strict adherence to type is desired.
    // For now, allow modification, typeId remains for reference or potential future features.
  }, []);

  const handleSave = useCallback(() => {
    if (newChore.assignedTo.length === 0) {
      alert("Please assign the chore to at least one family member.");
      return;
    }
    onSaveChore(newChore);
  }, [newChore, onSaveChore]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-50 rounded-2xl p-6 w-full max-w-md sm:max-w-lg border border-slate-200 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Chore</h3>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="choreType" className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Chore Type</label>
            <select
              id="choreType"
              value={selectedChoreTypeId}
              onChange={(e) => handleChoreTypeChange(e.target.value)}
              className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
              required
            >
              {choreTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {getIcon(type.icon)} {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Assign To</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border border-slate-200 rounded-lg bg-slate-100/50">
              {familyMembers.map(member => {
                const isSelected = newChore.assignedTo.includes(member.name);
                const memberColor = getMemberColor(member.name);
                
                return (
                  <button
                    key={`${member.id}-${member.name}`}
                    type="button"
                    onClick={() => toggleAssignedTo(member.name)}
                    className={`p-2 rounded-lg text-xs sm:text-sm w-full text-left transition-all
                      ${isSelected 
                        ? 'text-white font-semibold shadow-md transform scale-[1.02]' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-600 hover:scale-[1.02]'
                      }
                    `}
                    style={isSelected ? { 
                      backgroundColor: memberColor,
                      border: `2px solid ${memberColor}`,
                      boxShadow: `0 0 0 1px white, 0 0 0 3px ${memberColor}`,
                      color: '#ffffff' // Ensure text is white for better contrast
                    } : {}}
                    aria-label={`${isSelected ? 'Unassign' : 'Assign'} ${member.name}`}
                    aria-pressed={isSelected}
                  >
                    {member.name}
                  </button>
                );
              })}
            </div>
          </div>

          {newChore.icon && selectedChoreTypeId && (
            <div className="mt-2">
                <span className="text-xs sm:text-sm font-medium text-slate-600">Icon: </span>
                <span className="text-xl">{getIcon(newChore.icon)}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-5 sm:mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-teal-500 text-white py-3 px-4 sm:py-4 sm:px-6 rounded-xl hover:bg-teal-600 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
          >
            Add Chore
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-300 text-slate-600 py-3 px-4 sm:py-4 sm:px-6 rounded-xl hover:bg-slate-400 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddChoreModal;