import React from 'react';
import { Chore, FamilyMember, Reward } from '../types';
import { CheckSquare, Plus, Star, Award, Check, Settings, Gift, AlertTriangle, Edit3, Calendar, Wifi, WifiOff } from 'lucide-react';
import { useRealtimeChores } from '../hooks/useRealtimeData';
import { getIcon } from '../utils/iconUtils';

interface ChoresTabProps {
  chores: Chore[];
  familyMembers: FamilyMember[];
  getMemberByName: (name: string) => FamilyMember | undefined;
  onCompleteChore: (choreId: number) => void;
  onEditChore?: (chore: Chore) => void;
  rewards: Reward[];
  onAddChore: () => void;
  onManageChoreTypes: () => void; 
  onAddReward: () => void; 
}

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

const ChoresTab: React.FC<ChoresTabProps> = ({ 
  chores, 
  familyMembers, 
  getMemberByName, 
  onCompleteChore,
  onEditChore,
  rewards, 
  onAddChore, 
  onManageChoreTypes,
  onAddReward 
}) => {
  // Real-time chores monitoring
  const { isConnected: isRealtimeConnected } = useRealtimeChores((eventType, record) => {
    uiLogger.debug('Real-time chore update', { eventType, recordId: record?.id });
  });

  const todayDate = getTodayDateString();
  const filteredChores = chores;
  const todaysChores = chores.filter(chore => chore.dueDate === todayDate);
  const overdueChores = chores.filter(chore => isOverdue(chore.dueDate) && !chore.completed);

  const calculatePoints = (memberName: string) => {
    return chores
      .filter(chore => chore.assignedTo === memberName && chore.completed)
      .reduce((total, chore) => total + chore.points, 0);
  };
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-light text-slate-600">Family Chores & Rewards</h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={onManageChoreTypes}
            className="bg-slate-100/60 hover:bg-slate-200/80 backdrop-blur-sm text-slate-600 rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-md transition-colors flex items-center gap-2 min-h-[40px] sm:min-h-[48px]"
            aria-label="Manage Chore Types"
          >
            <Settings size={18} />
            <span className="text-xs sm:text-sm font-medium">Types</span>
          </button>
          <button 
            onClick={onAddReward} 
            className="bg-purple-400 hover:bg-purple-500 text-white rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg transition-colors flex items-center gap-2 min-h-[40px] sm:min-h-[48px]"
            aria-label="Add New Reward"
          >
            <Gift size={18} />
            <span className="text-xs sm:text-sm font-medium">Add Reward</span>
          </button>
          <button 
            onClick={onAddChore}
            className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg transition-colors flex items-center gap-2 min-h-[40px] sm:min-h-[48px]"
            aria-label="Add New Chore"
          >
            <Plus size={18} />
            <span className="text-xs sm:text-sm font-medium">Add Chore</span>
          </button>
        </div>
      </div>

      {/* Smart Alerts */}
      <div className="flex-shrink-0 mb-4 space-y-2">
        {overdueChores.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-red-700 text-sm font-medium">
              {overdueChores.length} overdue chore{overdueChores.length > 1 ? 's' : ''} need attention
            </span>
          </div>
        )}
        
        {todaysChores.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            <span className="text-blue-700 text-sm font-medium">
              {todaysChores.length} chore{todaysChores.length > 1 ? 's' : ''} due today
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-slate-50/60 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-lg flex flex-col min-h-[300px] max-h-[500px]">
            <h3 className="text-base sm:text-lg font-semibold text-slate-600 mb-3 sm:mb-4 flex items-center flex-shrink-0">
              <CheckSquare className="mr-2 text-teal-500" size={18} />
              Today's Tasks ({todayDate})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-1">
              {todaysChores.length > 0 ? todaysChores.map(chore => {
                const member = getMemberByName(chore.assignedTo);
                const choreIsOverdue = isOverdue(chore.dueDate) && !chore.completed;
                return (
                  <div key={chore.id} className={`bg-slate-100/80 rounded-xl p-3 sm:p-4 shadow-sm flex-shrink-0 
                    ${choreIsOverdue ? 'border-l-4 border-l-red-400 bg-red-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${member?.color || 'bg-gray-300'} flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0`}>
                          <span className="text-white font-semibold text-sm sm:text-base">{member?.initial || '?'}</span>
                        </div>
                        <div className="flex-grow">
                          <div className={`font-medium text-sm sm:text-base ${chore.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                            {chore.icon && <span className="mr-1.5 text-base sm:text-lg align-middle">{getIcon(chore.icon)}</span>}
                            {chore.title}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2">
                            <Star className="text-yellow-400 mr-1" size={12} />
                            {chore.points} points
                            {choreIsOverdue && (
                              <span className="flex items-center text-red-600">
                                <AlertTriangle size={12} className="mr-1" />
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {!chore.completed && onEditChore && (
                          <button
                            onClick={() => onEditChore(chore)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit chore"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {!chore.completed && (
                          <button
                            onClick={() => onCompleteChore(chore.id)}
                            className="bg-teal-500 text-white rounded-lg sm:rounded-xl p-2 sm:px-4 sm:py-2 hover:bg-teal-600 transition-colors min-h-[36px] sm:min-h-[44px] min-w-[36px] sm:min-w-[44px] flex items-center justify-center flex-shrink-0"
                            aria-label={`Mark ${chore.title} as complete`}
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-slate-500 text-sm">No chores for today!</p>
              )}
            </div>
          </div>

          <div className="bg-slate-50/60 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-lg flex flex-col min-h-[300px] max-h-[500px]">
            <h3 className="text-base sm:text-lg font-semibold text-slate-600 mb-3 sm:mb-4 flex items-center flex-shrink-0">
              <Award className="mr-2 text-teal-500" size={18} />
              All Chores
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-1">
              {filteredChores.map(chore => {
                const member = getMemberByName(chore.assignedTo);
                const choreIsOverdue = isOverdue(chore.dueDate) && !chore.completed;
                return (
                  <div key={chore.id} className={`bg-slate-100/80 rounded-xl p-3 sm:p-4 shadow-sm flex-shrink-0
                    ${choreIsOverdue ? 'border-l-4 border-l-red-400 bg-red-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${member?.color || 'bg-gray-300'} flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0`}>
                          <span className="text-white text-xs sm:text-sm font-semibold">{member?.initial || '?'}</span>
                        </div>
                        <div className="flex-grow">
                          <div className={`text-xs sm:text-sm font-medium ${chore.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                            {chore.icon && <span className="mr-1.5 text-sm sm:text-base align-middle">{getIcon(chore.icon)}</span>}
                            {chore.title}
                          </div>
                          <div className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-2">
                            <span>Due: {chore.dueDate}</span>
                            <span>• {chore.points} pts</span>
                            {choreIsOverdue && (
                              <span className="flex items-center text-red-600">
                                <AlertTriangle size={10} className="mr-1" />
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {chore.completed ? (
                          <div className="text-teal-600 text-xs sm:text-sm font-medium px-2 py-1 sm:px-3 sm:py-2 min-h-[36px] sm:min-h-[44px] flex items-center flex-shrink-0">✓ Done</div>
                        ) : (
                          <>
                            {onEditChore && (
                              <button
                                onClick={() => onEditChore(chore)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit chore"
                              >
                                <Edit3 size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => onCompleteChore(chore.id)}
                              className="text-teal-600 hover:text-teal-700 text-xs sm:text-sm font-medium px-2 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-teal-50 transition-colors min-h-[36px] sm:min-h-[44px] flex-shrink-0"
                              aria-label={`Mark ${chore.title} as complete`}
                            >
                              Mark Done
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50/60 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-lg">
          <h3 className="text-base sm:text-lg font-semibold text-slate-600 mb-3 sm:mb-4 flex items-center">
            <Star className="mr-2 text-yellow-500" size={18} />
            Family Leaderboard & Stats
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {familyMembers
              .sort((a, b) => calculatePoints(b.name) - calculatePoints(a.name))
              .map((member, index) => {
                const points = calculatePoints(member.name);
                const completedChores = chores.filter(c => c.assignedTo === member.name && c.completed).length;
                const pendingChores = chores.filter(c => c.assignedTo === member.name && !c.completed).length;
                const isTopPerformer = index === 0 && points > 0;
                
                return (
                  <div key={member.id} className={`bg-white rounded-xl p-3 shadow-sm border-2 ${
                    isTopPerformer ? 'border-yellow-300 bg-yellow-50' : 'border-transparent'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center mr-2 shadow-sm relative`}>
                          <span className="text-white text-sm font-bold">{member.initial}</span>
                          {isTopPerformer && (
                            <span className="absolute -top-1 -right-1 text-yellow-500 text-xs">👑</span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{member.name.split(' ')[0]}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-800 flex items-center">
                          <Star className="text-yellow-400 mr-1" size={14} />
                          {points}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <div className="font-semibold text-green-700">{completedChores}</div>
                        <div>Completed</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <div className="font-semibold text-blue-700">{pendingChores}</div>
                        <div>Pending</div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-slate-50/60 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-lg">
          <h3 className="text-base sm:text-lg font-semibold text-slate-600 mb-3 sm:mb-4 flex items-center">
            <Award className="mr-2 text-purple-500" size={18} />
            Available Rewards
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {rewards.map(reward => (
              <div key={reward.id} className="bg-slate-100/70 rounded-xl p-3 text-center shadow hover:shadow-md transition-shadow">
                <div className="text-2xl sm:text-3xl mb-1">{getIcon(reward.icon)}</div>
                <div className="text-xs sm:text-sm font-medium text-slate-600">{reward.title}</div>
                <div className="text-xs text-purple-600">{reward.cost} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChoresTab;
