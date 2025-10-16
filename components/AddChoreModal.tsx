import React, { useState, useEffect, useCallback } from 'react';
import { Chore, FamilyMember, ChoreType } from '../types';
import { convertToHexColor } from '../utils/colorUtils';
import { getIcon } from '../utils/iconUtils';
import Modal from './ui/Modal';
import Button from './ui/Button';
import FormField from './ui/FormField';

interface AddChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveChore: (choreData: Omit<Chore, 'id' | 'completed'> | Chore) => void;
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Chore"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Add Chore
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FormField label="Chore Type" htmlFor="choreType" required>
          <select
            id="choreType"
            value={selectedChoreTypeId}
            onChange={(e) => handleChoreTypeChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
          >
            <option value="">Custom chore</option>
            {choreTypes.map(type => (
              <option key={type.id} value={type.id}>
                {getIcon(type.icon)} {type.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Chore Title" htmlFor="choreTitle" required>
          <input
            id="choreTitle"
            type="text"
            value={newChore.title}
            onChange={(event) => handleChange('title', event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Points" htmlFor="chorePoints" required>
            <input
              id="chorePoints"
              type="number"
              min={0}
              value={newChore.points}
              onChange={(event) => handleChange('points', Number(event.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
            />
          </FormField>

          <FormField label="Due Date" htmlFor="choreDueDate" required>
            <input
              id="choreDueDate"
              type="date"
              value={newChore.dueDate}
              onChange={(event) => handleChange('dueDate', event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
            />
          </FormField>
        </div>

        <FormField label="Assign To" htmlFor="assignTo">
          <div
            id="assignTo"
            className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-100/50 p-2 sm:grid-cols-3"
          >
            {familyMembers.map(member => {
              const isSelected = newChore.assignedTo.includes(member.name);
              const memberColor = getMemberColor(member.name);

              return (
                <button
                  key={`${member.id}-${member.name}`}
                  type="button"
                  onClick={() => toggleAssignedTo(member.name)}
                  className={`w-full rounded-lg p-2 text-left text-xs transition-all sm:text-sm ${
                    isSelected
                      ? 'font-semibold text-white shadow-md'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: memberColor,
                          border: `2px solid ${memberColor}`,
                          boxShadow: `0 0 0 1px #ffffff, 0 0 0 3px ${memberColor}`
                        }
                      : {}
                  }
                  aria-label={`${isSelected ? 'Unassign' : 'Assign'} ${member.name}`}
                  aria-pressed={isSelected}
                >
                  {member.name}
                </button>
              );
            })}
          </div>
        </FormField>

        {newChore.icon && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Icon:</span>
            <span className="text-xl">{getIcon(newChore.icon)}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddChoreModal;
