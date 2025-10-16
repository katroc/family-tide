
import React, { useState, useEffect, useCallback } from 'react';
import { FamilyMember } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import FormField from './ui/FormField';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit: FamilyMember | null;
  onSaveMember: (memberData: Omit<FamilyMember, 'id'> | FamilyMember) => void;
  availableColors: string[];
  defaultNewMemberState: Omit<FamilyMember, 'id'>;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  memberToEdit,
  onSaveMember,
  availableColors,
  defaultNewMemberState,
}) => {
  const [currentMember, setCurrentMember] = useState<Omit<FamilyMember, 'id'> | FamilyMember>(
    memberToEdit || defaultNewMemberState
  );

  useEffect(() => {
    setCurrentMember(memberToEdit || defaultNewMemberState);
  }, [memberToEdit, defaultNewMemberState, isOpen]);

  const handleChange = useCallback(<K extends keyof Omit<FamilyMember, 'id'>>(field: K, value: (Omit<FamilyMember, 'id'>)[K]) => {
    setCurrentMember(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && typeof value === 'string') {
        (updated as FamilyMember).initial = value.charAt(0).toUpperCase() || '?';
      }
      return updated;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (currentMember.name.trim() === '' || currentMember.role.trim() === '') {
        alert("Name and role cannot be empty.");
        return;
    }
    onSaveMember(currentMember);
  }, [currentMember, onSaveMember]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={memberToEdit ? 'Edit Family Member' : 'Add Family Member'}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {memberToEdit ? 'Save Changes' : 'Add Member'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FormField label="Name" htmlFor="memberName" required>
          <input
            id="memberName"
            type="text"
            value={currentMember.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
            placeholder="Enter name"
          />
        </FormField>

        <FormField label="Role" htmlFor="memberRole" required>
          <select
            id="memberRole"
            value={currentMember.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 pr-8 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
          >
            <option value="">Select role</option>
            <option value="Mum">Mum</option>
            <option value="Dad">Dad</option>
            <option value="Child">Child</option>
            <option value="Teen">Teen</option>
            <option value="Grandma">Grandma</option>
            <option value="Grandad">Grandad</option>
            <option value="Pet">Pet</option>
            <option value="Other">Other</option>
          </select>
        </FormField>

        <FormField label="Nickname (Optional)" htmlFor="memberNickname">
          <input
            id="memberNickname"
            type="text"
            value={currentMember.nickname || ''}
            onChange={(e) => handleChange('nickname', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
          />
        </FormField>

        <FormField label="Date of Birth (Optional)" htmlFor="memberDob">
          <input
            id="memberDob"
            type="date"
            value={currentMember.dob || ''}
            onChange={(e) => handleChange('dob', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
            style={{ colorScheme: 'light' }}
          />
        </FormField>

        <FormField label="Color" htmlFor="memberColor">
          <div
            id="memberColor"
            className="grid grid-cols-6 gap-2 rounded-lg border border-transparent p-1 sm:grid-cols-8"
          >
            {availableColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleChange('color', color)}
                className={`h-9 w-9 rounded-full border transition-all ${color} ${
                  currentMember.color === color
                    ? 'border-slate-700 ring-1 ring-offset-1 ring-slate-500'
                    : 'border-slate-100 hover:scale-105 hover:border-slate-300'
                }`}
                aria-label={`Select color ${color.replace('bg-', '')}`}
                aria-pressed={currentMember.color === color}
              />
            ))}
          </div>
        </FormField>
      </div>
    </Modal>
  );
};

export default EditMemberModal;
