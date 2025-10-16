import React, { useState, useEffect } from 'react';
import { Chore, FamilyMember, ChoreType } from '../types';
import { Calendar, User, Star, AlertTriangle, Trash2 } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import FormField from './ui/FormField';

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
  // assignedTo is an array, but we only use the first member for single assignment
  const assignedMemberName = Array.isArray(editedChore.assignedTo)
    ? editedChore.assignedTo[0] || ''
    : editedChore.assignedTo || '';
  const assignedMember = familyMembers.find(m => m.name === assignedMemberName);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Chore"
        size="lg"
        footer={
          <div className="flex justify-between gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="text-red-600" type="button">
              <span className="flex items-center gap-2">
                <Trash2 size={16} />
                Delete
              </span>
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-3">
            {choreIsOverdue && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle size={18} className="text-red-500" />
                This chore is overdue!
              </div>
            )}

            {editedChore.completed && (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                <span className="text-lg">✅</span>
                Completed
              </div>
            )}
          </div>

          <FormField label="Title" htmlFor="choreTitle" required>
            <input
              id="choreTitle"
              type="text"
              value={editedChore.title}
              onChange={(e) => setEditedChore(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
              placeholder="Chore title..."
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Assigned To" htmlFor="choreAssigned">
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-500" />
                <select
                  id="choreAssigned"
                  value={assignedMemberName}
                  onChange={(e) => setEditedChore(prev => ({ ...prev, assignedTo: [e.target.value] }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                >
                  {familyMembers.map(member => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            <FormField label="Due Date" htmlFor="choreDueDate">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-500" />
                <input
                  id="choreDueDate"
                  type="date"
                  value={editedChore.dueDate}
                  onChange={(e) => setEditedChore(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                />
              </div>
            </FormField>
          </div>

          <FormField label="Points" htmlFor="chorePoints" required>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-yellow-500" />
              <input
                id="chorePoints"
                type="number"
                min={1}
                max={100}
                value={editedChore.points}
                onChange={(e) => setEditedChore(prev => ({ ...prev, points: parseInt(e.target.value, 10) || 0 }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
              />
            </div>
          </FormField>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Chore"
        size="sm"
        dismissible={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 focus-visible:ring-red-500">
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete "{editedChore.title}"? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
};

export default EditChoreModal;
