
import React, { useState, useEffect, useCallback } from 'react';
import { FamilyMember } from '../types';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {memberToEdit ? 'Edit Family Member' : 'Add Family Member'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
            <input
              type="text"
              value={currentMember.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-slate-600"
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
            <div className="relative">
              <select
                value={currentMember.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full p-3 pr-8 border border-slate-200 rounded-lg focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none bg-white text-slate-600 appearance-none"
              >
                <option value="">Select role</option>
                <option value="Mum" className="p-2 hover:bg-slate-100">Mum</option>
                <option value="Dad" className="p-2 hover:bg-slate-100">Dad</option>
                <option value="Child" className="p-2 hover:bg-slate-100">Child</option>
                <option value="Teen" className="p-2 hover:bg-slate-100">Teen</option>
                <option value="Grandma" className="p-2 hover:bg-slate-100">Grandma</option>
                <option value="Grandad" className="p-2 hover:bg-slate-100">Grandad</option>
                <option value="Pet" className="p-2 hover:bg-slate-100">Pet</option>
                <option value="Other" className="p-2 hover:bg-slate-100">Other</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nickname (Optional)</label>
            <input
              type="text"
              value={currentMember.nickname || ''}
              onChange={(e) => handleChange('nickname', e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-slate-600"
              placeholder="Enter nickname"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Date of Birth (Optional)</label>
            <input
              type="date"
              value={currentMember.dob || ''}
              onChange={(e) => handleChange('dob', e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-slate-600"
              style={{ colorScheme: 'light' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Color</label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 sm:gap-2 p-1">
              {availableColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition-all ${color} ${
                    currentMember.color === color 
                      ? 'border-slate-700 scale-110 ring-1 ring-offset-1 ring-slate-500' 
                      : 'border-slate-100 hover:scale-105 hover:border-slate-300'
                  }`}
                  aria-label={`Select color ${color.replace('bg-', '')}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-teal-500 text-white py-3 px-4 sm:py-4 sm:px-6 rounded-xl hover:bg-teal-600 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
          >
            {memberToEdit ? 'Save Changes' : 'Add Member'}
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

export default EditMemberModal;