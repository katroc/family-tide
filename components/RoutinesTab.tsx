import React from 'react';
import { FamilyMember, Routine, DailyRoutineProgress } from '../types';
import { CheckCircle2, Circle, Award, Settings } from 'lucide-react';
import { getIcon } from '../utils/iconUtils'; 

interface RoutinesTabProps {
  familyMembers: FamilyMember[];
  routines: Routine[];
  dailyRoutineProgress: DailyRoutineProgress[];
  onToggleRoutineStep: (memberId: number, routineId: string, stepId: string, date: string) => void;
  currentDate: string; // YYYY-MM-DD
  onManageRoutines?: () => void; 
}

const RoutinesTab: React.FC<RoutinesTabProps> = ({
  familyMembers,
  routines,
  dailyRoutineProgress,
  onToggleRoutineStep,
  currentDate,
  onManageRoutines, 
}) => {
  const getProgressForMemberRoutine = (memberId: number, routineId: string) => {
    return dailyRoutineProgress.find(
      p => p.memberId === memberId && p.routineId === routineId && p.date === currentDate
    );
  };

  const getEligibleMembers = (routine: Routine): FamilyMember[] => {
    // Ensure appliesToMemberIds exists before filtering
    // appliesToMemberIds can contain either member IDs or names depending on source
    return familyMembers.filter(member =>
      routine.appliesToMemberIds &&
      (routine.appliesToMemberIds.includes(member.id) || routine.appliesToMemberIds.includes(member.name))
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-light text-slate-600">Daily Routines</h2>
          <p className="text-sm text-slate-500">Complete your routines to earn points!</p>
        </div>
        {onManageRoutines && (
          <button 
            onClick={onManageRoutines}
            className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg transition-colors flex items-center gap-2 min-h-[40px] sm:min-h-[48px] self-start sm:self-center"
            aria-label="Manage Routines"
          >
            <Settings size={18} />
            <span className="text-xs sm:text-sm font-medium">Manage Routines</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 sm:space-y-8 pr-1">
        {routines.length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-500 text-lg">No routines defined yet.</p>
            <p className="text-slate-400 text-sm">Click "Manage Routines" to add your first one!</p>
          </div>
        )}
        {routines.map(routine => (
          <div key={routine.id} className="bg-slate-50/70 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-teal-700 mb-3 sm:mb-4">{routine.name}</h3>
            
            {!getEligibleMembers(routine).length && routine.appliesToMemberIds && routine.appliesToMemberIds.length > 0 && (
                <p className="text-slate-500 text-sm">No family members currently match the selection for this routine.</p>
            )}
             {(!routine.appliesToMemberIds || routine.appliesToMemberIds.length === 0) && (
                <p className="text-slate-500 text-sm">This routine is not assigned to any members. Edit it in "Manage Routines".</p>
            )}

            {getEligibleMembers(routine).map(member => {
              const progress = getProgressForMemberRoutine(member.id, routine.id);
              const completedStepIds = progress?.completedStepIds || [];
              const isRoutineFullyCompleted = progress?.isFullyCompleted || false;
              const totalSteps = routine.steps.length;
              const completedStepsCount = completedStepIds.length;
              
              return (
                <div key={member.id} className="mb-4 sm:mb-6 last:mb-0 p-3 sm:p-4 bg-white/80 rounded-2xl shadow-md">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${member.color} flex items-center justify-center mr-2 sm:mr-3 shadow-sm`}>
                        <span className="text-white font-semibold text-sm sm:text-base">{member.initial}</span>
                      </div>
                      <span className="text-md sm:text-lg font-medium text-slate-600">{member.name}</span>
                    </div>
                    {isRoutineFullyCompleted && (
                      <div className="flex items-center text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
                        <Award size={14} className="mr-1" />
                        Completed! +{routine.completionPoints}pts
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {routine.steps.map(step => {
                      const isCompleted = completedStepIds.includes(step.id);
                      return (
                        <button
                          key={step.id}
                          onClick={() => onToggleRoutineStep(member.id, routine.id, step.id, currentDate)}
                          className={`w-full flex items-center p-2 sm:p-3 rounded-lg transition-all text-left border
                            ${isCompleted
                              ? 'bg-teal-50 border-teal-400 shadow-sm hover:bg-teal-100'
                              : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                            }
                          `}
                          aria-pressed={isCompleted}
                          aria-label={`Mark ${step.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={20} className="text-teal-500 mr-2 sm:mr-3 flex-shrink-0" />
                          ) : (
                            <Circle size={20} className="text-slate-400 mr-2 sm:mr-3 flex-shrink-0" />
                          )}
                          <span className="text-2xl mr-2 sm:mr-3 flex-shrink-0">{getIcon(step.icon)}</span>
                          <span className={`text-sm sm:text-base ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-600'}`}>
                            {step.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {totalSteps > 0 && !isRoutineFullyCompleted && (
                    <div className="mt-2 text-right text-xs sm:text-sm text-slate-500">
                        {completedStepsCount} / {totalSteps} steps completed
                    </div>
                  )}
                   {totalSteps === 0 && (
                     <p className="text-slate-400 text-xs mt-2">This routine has no steps yet. Add some in "Manage Routines".</p>
                   )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoutinesTab;