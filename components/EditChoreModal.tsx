import React, { useState, useEffect } from 'react';
import { Chore, FamilyMember, ChoreType } from '../types';
import { X, Calendar, User, Star, AlertTriangle, Trash2 } from 'lucide-react';

interface EditChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveChore: (chore: Chore) => void;
  onDeleteChore: (choreId: number) => void;
  chore: Chore;
  familyMembers: FamilyMember[];
  choreTypes: ChoreType[];
}

const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

const EditChoreModal: React.FC<EditChoreModalProps> = ({
  isOpen, onClose, onSaveChore, onDeleteChore, chore, familyMembers, choreTypes
}) => {
  const [editedChore, setEditedChore] = useState<Chore>(chore);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditedChore(chore);
    }
  }, [isOpen, chore]);

  const handleSave = () => {
    onSaveChore(editedChore);
    onClose();
  };

  const handleDelete = () => {
    onDeleteChore(chore.id);
    onClose();
    setShowDeleteConfirm(false);
  };

  const choreIsOverdue = isOverdue(editedChore.dueDate) && !editedChore.completed;
  const assignedMember = familyMembers.find(m => m.name === editedChore.assignedTo);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-semibold text-slate-800">Edit Chore</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Status Alerts */}
        <div className="mb-6 space-y-3">
          {choreIsOverdue && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              <span className="text-red-700 text-sm font-medium">This chore is overdue!</span>
            </div>
          )}
          
          {editedChore.completed && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <span className="text-green-600 text-lg">✅</span>
              <span className="text-green-700 text-sm font-medium">Completed</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={editedChore.title}
              onChange={(e) => setEditedChore(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border border-slate-200 rounded-xl focus:border-teal-400 focus:outline-none bg-slate-50"
              placeholder="Chore title..."
            />
          </div>

          {/* Assigned To & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <User size={16} />
                Assigned To
              </label>
              <select
                value={editedChore.assignedTo}
                onChange={(e) => setEditedChore(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full p-3 border border-slate-200 rounded-xl focus:border-teal-400 focus:outline-none bg-slate-50"
              >
                {familyMembers.map(member => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Due Date
              </label>
              <input
                type="date"
                value={editedChore.dueDate}
                onChange={(e) => setEditedChore(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full p-3 border border-slate-200 rounded-xl focus:border-teal-400 focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Star size={16} />
              Points
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={editedChore.points}
              onChange={(e) => setEditedChore(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
              className="w-full p-3 border border-slate-200 rounded-xl focus:border-teal-400 focus:outline-none bg-slate-50"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSave}
            className="flex-1 bg-teal-500 text-white py-3 px-4 rounded-xl hover:bg-teal-600 transition-colors font-medium"
          >
            Save Changes
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-100 text-red-600 py-3 px-4 rounded-xl hover:bg-red-200 transition-colors font-medium flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
          <button
            onClick={onClose}
            className="bg-slate-200 text-slate-600 py-3 px-4 rounded-xl hover:bg-slate-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full">
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Delete Chore</h4>
              <p className="text-slate-600 mb-6">Are you sure you want to delete "{editedChore.title}"? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-xl hover:bg-red-600 transition-colors font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-slate-200 text-slate-600 py-2 px-4 rounded-xl hover:bg-slate-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditChoreModal;
