
import React, { useState, useCallback } from 'react';
import { ChoreType } from '../types';
import { PlusCircle, Tag, Star, ListChecks, CheckCircle2 } from 'lucide-react';
import { AVAILABLE_CHORE_ICONS } from '../constants';
import { getIcon } from '../utils/iconUtils';

interface ManageChoreTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  choreTypes: ChoreType[];
  onSaveChoreType: (newTypeData: Omit<ChoreType, 'id'>) => void;
}

const ManageChoreTypesModal: React.FC<ManageChoreTypesModalProps> = ({
  isOpen,
  onClose,
  choreTypes,
  onSaveChoreType,
}) => {
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypePoints, setNewTypePoints] = useState<number>(10);
  const [newTypeIcon, setNewTypeIcon] = useState<string>('');

  const handleAddType = useCallback(() => {
    if (newTypeName.trim() === '') {
      alert('Chore type name cannot be empty.');
      return;
    }
    if (newTypeIcon.trim() === '') {
      alert('Please select a chore type icon.');
      return;
    }
    if (newTypePoints < 0) {
        alert('Points cannot be negative.');
        return;
    }
    onSaveChoreType({
      name: newTypeName.trim(),
      defaultPoints: newTypePoints,
      icon: newTypeIcon.trim(),
    });
    setNewTypeName('');
    setNewTypePoints(10);
    setNewTypeIcon('');
  }, [newTypeName, newTypePoints, newTypeIcon, onSaveChoreType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-50 rounded-2xl p-6 w-full max-w-lg sm:max-w-xl border border-slate-200 max-h-[90vh] flex flex-col">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <ListChecks size={20} className="mr-2 text-sky-600"/> Manage Chore Types
        </h3>

        {/* Add New Chore Type Form */}
        <div className="mb-4 p-4 border border-slate-200 rounded-xl bg-white">
          <h4 className="text-md font-medium text-slate-600 mb-3 flex items-center">
            <PlusCircle size={18} className="mr-2 text-teal-500" /> Add New Type
          </h4>
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4 items-end">
                <div className="sm:col-span-3">
                <label htmlFor="typeName" className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Type Name</label>
                <input
                    id="typeName"
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g., Clean Room"
                    className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
                />
                </div>
                <div className="sm:col-span-1">
                <label htmlFor="typePoints" className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Points</label>
                <input
                    id="typePoints"
                    type="number"
                    value={newTypePoints}
                    onChange={(e) => setNewTypePoints(parseInt(e.target.value, 10) || 0)}
                    min="0"
                    className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg focus:border-teal-400 focus:outline-none bg-slate-100/50 text-sm sm:text-base text-slate-600"
                />
                </div>
                <div className="sm:col-span-1">
                <button
                    onClick={handleAddType}
                    className="w-full bg-teal-500 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-teal-600 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px] flex items-center justify-center"
                >
                    Add
                </button>
                </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Select Icon</label>
              <div className="flex flex-wrap gap-2 p-2 sm:p-3 border border-slate-200 rounded-lg bg-slate-100/50 max-h-32 overflow-y-auto">
                {AVAILABLE_CHORE_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewTypeIcon(icon)}
                    className={`
                      p-2 rounded-lg text-xl sm:text-2xl transition-all
                      ${newTypeIcon === icon 
                        ? 'bg-teal-500 text-white scale-110 ring-2 ring-teal-300' 
                        : 'bg-white hover:bg-teal-100 text-slate-600 border border-slate-300'
                      }
                    `}
                    aria-label={`Select icon ${icon}`}
                    title={icon}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Existing Chore Types List */}
        <div className="flex-1 overflow-y-auto pr-1 mt-4">
          <h4 className="text-md font-medium text-slate-600 mb-3 flex items-center">
            <Tag size={18} className="mr-2 text-slate-500" /> Existing Types
          </h4>
          {choreTypes.length === 0 ? (
            <p className="text-slate-500 text-sm">No chore types defined yet.</p>
          ) : (
            <ul className="space-y-2">
              {choreTypes.map(type => (
                <li key={type.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">{getIcon(type.icon)}</span>
                    <span className="text-slate-600 font-medium">{type.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="text-yellow-400 mr-1" size={14} /> 
                    <span className="text-slate-600 text-sm mr-3">{type.defaultPoints} pts</span>
                    {/* Future: Edit/Delete buttons could go here
                    <button className="text-slate-400 hover:text-slate-600 p-1"><Edit3 size={16}/></button>
                    */}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full bg-slate-300 text-slate-600 py-3 px-4 sm:py-4 sm:px-6 rounded-xl hover:bg-slate-400 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageChoreTypesModal;