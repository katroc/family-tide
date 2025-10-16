
import React, { useState, useEffect, useCallback } from 'react';
import { Routine, RoutineStep, FamilyMember } from '../types';
import { AVAILABLE_ROUTINE_STEP_ICONS, DEFAULT_NEW_ROUTINE_STATE, DEFAULT_NEW_ROUTINE_STEP_STATE } from '../constants';
import { PlusCircle, Edit3, Trash2, Settings, Save, Plus } from 'lucide-react';
import { getIcon } from '../utils/iconUtils';
import Modal from './ui/Modal';
import Button from './ui/Button';
import FormField from './ui/FormField';

interface ManageRoutinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  routines: Routine[];
  onSaveRoutine: (routineData: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  familyMembers: FamilyMember[]; // Added prop
}

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const ManageRoutinesModal: React.FC<ManageRoutinesModalProps> = ({
  isOpen,
  onClose,
  routines: initialRoutines,
  onSaveRoutine,
  onDeleteRoutine,
  familyMembers, // Destructure prop
}) => {
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [currentStep, setCurrentStep] = useState<Omit<RoutineStep, 'id'>>(DEFAULT_NEW_ROUTINE_STEP_STATE);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [showRoutineForm, setShowRoutineForm] = useState(false);

  useEffect(() => {
    setRoutines(initialRoutines);
  }, [initialRoutines, isOpen]);

  const resetForm = () => {
    setEditingRoutine(null);
    setCurrentStep(DEFAULT_NEW_ROUTINE_STEP_STATE);
    setEditingStepId(null);
    setShowRoutineForm(false);
  };

  const handleOpenAddNewRoutine = () => {
    // Ensure DEFAULT_NEW_ROUTINE_STATE matches the updated Routine type (uses appliesToMemberIds)
    setEditingRoutine({ ...(DEFAULT_NEW_ROUTINE_STATE as Omit<Routine, 'id'>), id: generateId(), steps: [] });
    setShowRoutineForm(true);
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine({ ...routine, steps: [...routine.steps], appliesToMemberIds: [...(routine.appliesToMemberIds || [])] }); // Deep copy steps and member IDs
    setShowRoutineForm(true);
  };
  
  const handleRoutineChange = <K extends keyof Routine>(field: K, value: Routine[K]) => {
    if (editingRoutine) {
      setEditingRoutine(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleMemberToggle = (memberId: number) => {
    if (editingRoutine) {
      const newMemberIds = editingRoutine.appliesToMemberIds.includes(memberId)
        ? editingRoutine.appliesToMemberIds.filter(id => id !== memberId)
        : [...editingRoutine.appliesToMemberIds, memberId];
      handleRoutineChange('appliesToMemberIds', newMemberIds);
    }
  };

  const handleStepChange = <K extends keyof RoutineStep>(field: K, value: RoutineStep[K]) => {
    setCurrentStep(prev => ({ ...prev, [field]: value }));
  };

  const handleAddOrUpdateStep = () => {
    if (!editingRoutine || currentStep.title.trim() === '' || currentStep.icon.trim() === '') {
      alert("Step title and icon cannot be empty.");
      return;
    }
    const newSteps = [...editingRoutine.steps];
    if (editingStepId) { // Update existing step
      const stepIndex = newSteps.findIndex(s => s.id === editingStepId);
      if (stepIndex > -1) {
        newSteps[stepIndex] = { ...currentStep, id: editingStepId };
      }
    } else { // Add new step
      newSteps.push({ ...currentStep, id: generateId() });
    }
    setEditingRoutine({ ...editingRoutine, steps: newSteps });
    setCurrentStep(DEFAULT_NEW_ROUTINE_STEP_STATE);
    setEditingStepId(null);
  };

  const handleEditStep = (step: RoutineStep) => {
    setCurrentStep({ title: step.title, icon: step.icon });
    setEditingStepId(step.id);
  };

  const handleDeleteStep = (stepId: string) => {
    if (editingRoutine) {
      const newSteps = editingRoutine.steps.filter(s => s.id !== stepId);
      setEditingRoutine({ ...editingRoutine, steps: newSteps });
    }
  };

  const handleSaveFullRoutine = () => {
    if (editingRoutine && editingRoutine.name.trim() !== '') {
      onSaveRoutine(editingRoutine);
      resetForm();
    } else {
      alert("Routine name cannot be empty.");
    }
  };

  const handleDeleteFullRoutine = (routineId: string) => {
    if (window.confirm("Are you sure you want to delete this routine? This cannot be undone.")) {
        onDeleteRoutine(routineId);
        if (editingRoutine?.id === routineId) {
            resetForm();
        }
    }
  };

  const handleCloseModal = () => {
    resetForm();
    onClose();
  }

  const getMemberNameById = (id: number) => familyMembers.find(m => m.id === id)?.name || 'Unknown';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={
        <span className="flex items-center gap-2">
          <Settings size={20} className="text-sky-600" />
          Manage Routines
        </span>
      }
      size="xl"
    >
      {!showRoutineForm ? (
        <div className="flex h-full flex-col gap-4">
          <Button onClick={handleOpenAddNewRoutine} fullWidth>
            <span className="flex items-center justify-center gap-2">
              <PlusCircle size={18} />
              Add New Routine
            </span>
          </Button>

          <div className="space-y-3 overflow-y-auto pr-1">
            {routines.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-6 text-center text-sm text-slate-500">
                No routines defined yet. Click "Add New Routine" to start.
              </p>
            ) : (
              routines.map(routine => (
                <div key={routine.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-700">{routine.name}</p>
                      <p className="text-xs text-slate-500">
                        {routine.completionPoints} pts • Assigned to: {routine.appliesToMemberIds.map(id => getMemberNameById(id)).join(', ') || 'None'} • {routine.steps.length} steps
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => handleEditRoutine(routine)}>
                        <Edit3 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteFullRoutine(routine.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <Button variant="ghost" onClick={handleCloseModal} fullWidth>
              Close
            </Button>
          </div>
        </div>
      ) : (
        editingRoutine && (
          <div className="space-y-5 overflow-y-auto pr-1">
            <FormField label="Routine Name" htmlFor="routineName" required>
              <input
                id="routineName"
                type="text"
                value={editingRoutine.name}
                onChange={(e) => handleRoutineChange('name', e.target.value)}
                placeholder="e.g., Morning Checklist"
                className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
              />
            </FormField>

            <FormField label="Completion Points" htmlFor="routinePoints" required>
              <input
                id="routinePoints"
                type="number"
                min={0}
                value={editingRoutine.completionPoints}
                onChange={(e) => handleRoutineChange('completionPoints', parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-lg border border-slate-200 bg-slate-100/50 p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                style={{ colorScheme: 'light' }}
              />
            </FormField>

            <FormField label="Applies To Members" htmlFor="routineMembers">
              <div
                id="routineMembers"
                className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-100/50 p-2 sm:grid-cols-3"
              >
                {familyMembers.map(member => {
                  const isSelected = editingRoutine.appliesToMemberIds.includes(member.id);
                  return (
                    <button
                      type="button"
                      key={member.id}
                      onClick={() => handleMemberToggle(member.id)}
                      aria-pressed={isSelected}
                      className={`flex items-center rounded-lg border p-2 text-left transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className={`${member.color} mr-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white`}>
                        {member.initial}
                      </div>
                      <span className="text-xs font-medium">{member.name}</span>
                    </button>
                  );
                })}
              </div>
            </FormField>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-600">Routine Steps</h4>

              <div className="space-y-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
                <FormField label="Step Title" htmlFor="stepTitle" required>
                  <input
                    id="stepTitle"
                    type="text"
                    value={currentStep.title}
                    onChange={(e) => handleStepChange('title', e.target.value)}
                    placeholder="Step title (e.g., Brush Teeth)"
                    className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
                  />
                </FormField>

                <FormField label="Step Icon" htmlFor="stepIcon" required>
                  <div
                    id="stepIcon"
                    className="flex max-h-24 flex-wrap gap-1 overflow-y-auto rounded-md border border-slate-200 bg-slate-100/50 p-1"
                  >
                    {AVAILABLE_ROUTINE_STEP_ICONS.map(icon => {
                      const isSelected = currentStep.icon === icon;
                      return (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => handleStepChange('icon', icon)}
                          className={`rounded p-1 text-lg transition-all ${
                            isSelected ? 'bg-teal-500 text-white ring-1 ring-teal-300' : 'bg-white text-slate-600 hover:bg-teal-100'
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

                <div className="flex items-center gap-2">
                  <Button onClick={handleAddOrUpdateStep} fullWidth>
                    <span className="flex items-center justify-center gap-2">
                      <Plus size={16} />
                      {editingStepId ? 'Update Step' : 'Add Step'}
                    </span>
                  </Button>
                  {editingStepId && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCurrentStep(DEFAULT_NEW_ROUTINE_STEP_STATE);
                        setEditingStepId(null);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1 overflow-y-auto">
                {editingRoutine.steps.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">No steps added yet.</p>
                ) : (
                  editingRoutine.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center justify-between rounded-md bg-slate-100 px-2 py-2 text-sm">
                      <span className="text-slate-600">{index + 1}. {getIcon(step.icon)} {step.title}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" onClick={() => handleEditStep(step)} className="px-2 py-1">
                          <Edit3 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDeleteStep(step.id)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleSaveFullRoutine} fullWidth>
                <span className="flex items-center justify-center gap-2">
                  <Save size={18} />
                  Save Routine
                </span>
              </Button>
              <Button variant="ghost" onClick={() => setShowRoutineForm(false)} fullWidth>
                Back to List
              </Button>
            </div>
          </div>
        )
      )}
    </Modal>
  );
};

export default ManageRoutinesModal;
