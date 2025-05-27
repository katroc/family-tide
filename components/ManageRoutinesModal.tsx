
import React, { useState, useEffect, useCallback } from 'react';
import { Routine, RoutineStep, FamilyMember } from '../types';
import { AVAILABLE_ROUTINE_STEP_ICONS, DEFAULT_NEW_ROUTINE_STATE, DEFAULT_NEW_ROUTINE_STEP_STATE } from '../constants';
import { PlusCircle, Edit3, Trash2, Settings, Save, XCircle, Plus } from 'lucide-react';
import { getIcon } from '../utils/iconUtils';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 w-full max-w-xl lg:max-w-3xl border border-slate-200 max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <Settings size={20} className="mr-2 text-sky-600"/> Manage Routines
            </h3>
            <button onClick={handleCloseModal} className="text-slate-500 hover:text-slate-600">
                <XCircle size={24} />
            </button>
        </div>

        {!showRoutineForm ? (
          <>
            <button
              onClick={handleOpenAddNewRoutine}
              className="mb-4 w-full bg-teal-500 text-white py-2 sm:py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <PlusCircle size={18} /> Add New Routine
            </button>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {routines.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No routines defined yet. Click "Add New Routine" to start.</p>
              ) : (
                routines.map(routine => (
                  <div key={routine.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-600">{routine.name}</p>
                        <p className="text-xs text-slate-500">
                          {routine.completionPoints} pts • 
                          Assigned to: {routine.appliesToMemberIds.map(id => getMemberNameById(id)).join(', ') || 'None'} • 
                          {routine.steps.length} steps
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditRoutine(routine)} className="p-2 text-slate-600 hover:text-teal-600"><Edit3 size={18}/></button>
                        <button onClick={() => handleDeleteFullRoutine(routine.id)} className="p-2 text-slate-600 hover:text-red-600"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : editingRoutine && ( // Routine form view
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Routine Name</label>
              <input
                type="text"
                value={editingRoutine.name}
                onChange={(e) => handleRoutineChange('name', e.target.value)}
                placeholder="e.g., Morning Checklist"
                className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg bg-slate-100/50 text-slate-600 focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Completion Points</label>
              <input
                type="number"
                value={editingRoutine.completionPoints}
                onChange={(e) => handleRoutineChange('completionPoints', parseInt(e.target.value, 10) || 0)}
                min="0"
                className="w-full p-2 sm:p-3 border border-slate-200 rounded-lg bg-slate-100/50 text-slate-600 focus:outline-none focus:border-teal-400"
                style={{ colorScheme: 'light' }}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Applies To Members</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border border-slate-200 rounded-lg bg-slate-100/50 max-h-48 overflow-y-auto">
                {familyMembers.map(member => {
                  const isSelected = editingRoutine.appliesToMemberIds.includes(member.id);
                  return (
                    <button
                      type="button"
                      key={member.id}
                      onClick={() => handleMemberToggle(member.id)}
                      aria-pressed={isSelected}
                      className={`
                        flex items-center p-2 rounded-lg transition-all w-full text-left border
                        ${isSelected
                          ? 'bg-teal-50 border-teal-500 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }
                      `}
                    >
                      <div className={`w-5 h-5 rounded-full ${member.color} flex items-center justify-center mr-2 text-[10px] text-white font-semibold`}>
                        {member.initial}
                      </div>
                      <span className={`text-xs ${isSelected ? 'text-teal-700 font-medium' : 'text-slate-600'}`}>
                        {member.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Steps Management */}
            <div className="p-3 border border-slate-200 rounded-xl bg-white">
              <h4 className="text-sm font-medium text-slate-600 mb-2">Routine Steps</h4>
              {/* Add/Edit Step Form */}
              <div className="space-y-2 mb-3 p-2 border border-dashed border-slate-300 rounded-lg">
                <input
                  type="text"
                  value={currentStep.title}
                  onChange={(e) => handleStepChange('title', e.target.value)}
                  placeholder="Step title (e.g., Brush Teeth)"
                  className="w-full p-2 sm:p-3 border border-slate-200 rounded-md bg-slate-100/50 text-sm text-slate-600 focus:outline-none focus:border-teal-400"
                />
                <label className="block text-xs font-medium text-slate-600 mt-1">Step Icon</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-100/50 rounded-md border border-slate-200">
                  {AVAILABLE_ROUTINE_STEP_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => handleStepChange('icon', icon)}
                      className={`p-1 rounded text-lg transition-all ${currentStep.icon === icon ? 'bg-teal-500 text-white scale-110' : 'bg-white hover:bg-teal-100 text-slate-600'}`}
                      aria-label={`Select icon ${icon}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAddOrUpdateStep}
                  className="w-full mt-1 bg-slate-300 hover:bg-slate-400 text-slate-600 py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <Plus size={16}/> {editingStepId ? 'Update Step' : 'Add Step'}
                </button>
                {editingStepId && <button onClick={() => { setCurrentStep(DEFAULT_NEW_ROUTINE_STEP_STATE); setEditingStepId(null);}} className="w-full mt-1 text-xs text-slate-600 hover:text-slate-600">Cancel Edit</button>}
              </div>

              {/* List of Steps */}
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {editingRoutine.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center justify-between p-1.5 bg-slate-100 rounded-md text-sm">
                    <span className="text-slate-600">{index + 1}. {getIcon(step.icon)} {step.title}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditStep(step)} className="p-1 text-slate-600 hover:text-teal-600"><Edit3 size={14}/></button>
                      <button onClick={() => handleDeleteStep(step.id)} className="p-1 text-slate-600 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
                {editingRoutine.steps.length === 0 && <p className="text-xs text-slate-400 text-center">No steps added yet.</p>}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                onClick={handleSaveFullRoutine}
                className="flex-1 bg-teal-500 text-white py-2 sm:py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                <Save size={18}/> Save Routine
                </button>
                <button
                onClick={() => setShowRoutineForm(false)}
                className="flex-1 bg-slate-300 text-slate-600 py-2 sm:py-3 px-4 rounded-lg hover:bg-slate-400 transition-colors font-medium text-sm"
                >
                Back to List
                </button>
            </div>
          </div>
        )}
        
        {!showRoutineForm && (
            <div className="mt-auto pt-4 border-t border-slate-200">
             <button
                onClick={handleCloseModal}
                className="w-full bg-slate-300 text-slate-600 py-2 sm:py-3 px-4 rounded-xl hover:bg-slate-400 transition-colors font-medium text-sm sm:text-base"
            >
                Close
            </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ManageRoutinesModal;