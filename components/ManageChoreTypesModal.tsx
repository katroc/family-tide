
import React, { useState, useCallback } from 'react';
import { ChoreType } from '../types';
import { PlusCircle, Tag, Star, ListChecks } from 'lucide-react';
import { AVAILABLE_CHORE_ICONS } from '../constants';
import { getIcon } from '../utils/iconUtils';
import Modal from './ui/Modal';
import Button from './ui/Button';
import FormField from './ui/FormField';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <ListChecks size={20} className="text-sky-600" />
          Manage Chore Types
        </span>
      }
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose} fullWidth>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 flex items-center text-sm font-semibold text-slate-600">
            <PlusCircle size={18} className="mr-2 text-teal-500" />
            Add New Type
          </h4>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-5 sm:items-end">
              <div className="sm:col-span-3">
                <FormField label="Type Name" htmlFor="typeName" required>
                  <input
                    id="typeName"
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g., Clean Room"
                    className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                  />
                </FormField>
              </div>
              <div className="sm:col-span-1">
                <FormField label="Points" htmlFor="typePoints" required>
                  <input
                    id="typePoints"
                    type="number"
                    min={0}
                    value={newTypePoints}
                    onChange={(e) => setNewTypePoints(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                  />
                </FormField>
              </div>
              <div className="sm:col-span-1">
                <Button onClick={handleAddType} fullWidth>
                  Add
                </Button>
              </div>
            </div>

            <FormField label="Select Icon" htmlFor="typeIcon">
              <div
                id="typeIcon"
                className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-100/50 p-2"
              >
                {AVAILABLE_CHORE_ICONS.map(icon => {
                  const isSelected = newTypeIcon === icon;
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewTypeIcon(icon)}
                      className={`rounded-lg border p-2 text-2xl transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500 text-white ring-2 ring-teal-300'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-teal-100'
                      }`}
                      aria-pressed={isSelected}
                      aria-label={`Select icon ${icon}`}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>
            </FormField>
          </div>
        </div>

        <div>
          <h4 className="mb-3 flex items-center text-sm font-semibold text-slate-600">
            <Tag size={18} className="mr-2 text-slate-500" />
            Existing Types
          </h4>
          {choreTypes.length === 0 ? (
            <p className="text-sm text-slate-500">No chore types defined yet.</p>
          ) : (
            <ul className="space-y-2">
              {choreTypes.map(type => (
                <li
                  key={type.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 text-slate-600">
                    <span className="text-xl">{getIcon(type.icon)}</span>
                    <span className="font-medium">{type.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Star className="text-yellow-400" size={14} />
                    {type.defaultPoints} pts
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ManageChoreTypesModal;
