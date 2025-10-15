import React, { useState, useEffect, useCallback } from 'react';
import { dataService } from './dataService';
import SetupWizard from './components/SetupWizard';
import { RealtimeProvider } from './components/RealtimeProvider';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import SplashScreen from './components/SplashScreen';
import { useAuth } from './hooks/useAuth';
import {
  FamilyMember,
  NewFamilyMember,
  Chore,
  NewChore,
  EventItem,
  Reward,
  NewReward,
  FamilyDetails,
  ChoreType,
  Routine,
  DailyRoutineProgress,
  TabId,
  DEFAULT_COLORS
} from './types';

// Import components
import FamilyTab from './components/FamilyTab';
import ChoresTab from './components/ChoresTab';
import RoutinesTab from './components/RoutinesTab';
import CalendarTab from './components/CalendarTab';
import BottomNavigation from './components/BottomNavigation';
import EditMemberModal from './components/EditMemberModal';
import AddRewardModal from './components/AddRewardModal';
import EventModal from './components/EventModal';
import AddChoreModal from './components/AddChoreModal';
import EditChoreModal from './components/EditChoreModal';
import ManageChoreTypesModal from './components/ManageChoreTypesModal';
import ManageRoutinesModal from './components/ManageRoutinesModal';

// Constants from types.ts
const AVAILABLE_COLORS = [...DEFAULT_COLORS];

// Navigation items
const NAVIGATION_ITEMS = [
  { id: 'family' as TabId, label: 'Family', icon: 'people' },
  { id: 'calendar' as TabId, label: 'Calendar', icon: 'calendar' },
  { id: 'chores' as TabId, label: 'Chores', icon: 'list' },
  { id: 'routines' as TabId, label: 'Routines', icon: 'repeat' }
];

const App: React.FC = () => {
  const currentDate = new Date().toISOString().split('T')[0];

  // Authentication and setup
  const {
    isCheckingAuth,
    showSetupWizard,
    currentFamilyId,
    handleSetupComplete: handleAuthSetupComplete
  } = useAuth();

  // State management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Real-time data update handler
  const handleRealtimeDataUpdate = useCallback(async (table: string, eventType: string, record: any) => {
    console.log(`🔄 [App] Handling real-time update for ${table}:`, eventType, record);
    
    try {
      // Refresh specific data based on the table that was updated
      switch (table) {
        case 'family_members':
          const updatedMembers = await dataService.getFamilyMembers();
          setFamilyMembers(updatedMembers);
          break;
        case 'chores':
          const updatedChores = await dataService.getChores();
          setChores(updatedChores);
          break;
        case 'events':
          const updatedEvents = await dataService.getEvents();
          setEvents(updatedEvents);
          break;
        case 'rewards':
          const updatedRewards = await dataService.getRewards();
          setRewards(updatedRewards);
          break;
        case 'routines':
          const updatedRoutines = await dataService.getRoutines();
          setRoutines(updatedRoutines);
          break;
        default:
          console.log(`ℹ️ [App] No specific handler for table: ${table}`);
      }
    } catch (error) {
      console.error(`❌ [App] Error refreshing data for ${table}:`, error);
    }
  }, []);

  // Load initial data after setup is complete
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Starting data service initialization...');
      await dataService.initialize();
      console.log('Data service initialized, loading data...');
      
      // Skip auth check here since we handle it via auth state changes
      // Data loading will only be called when setup is complete
      console.log('Auth state already verified, proceeding with data load...');
      
      const [
        members,
        details,
        choresData,
        types,
        routinesData,
        rewardsData,
        eventsData,
        progress,
        photo
      ] = await Promise.all([
        dataService.getFamilyMembers().catch(e => {
          console.error('Error loading family members:', e);
          return [];
        }),
        dataService.getFamilyDetails().catch(e => {
          console.error('Error loading family details:', e);
          return { name: 'My Family', address: '', photoObjectPosition: 'center center' };
        }),
        dataService.getChores().catch(e => {
          console.error('Error loading chores:', e);
          return [];
        }),
        dataService.getChoreTypes().catch(e => {
          console.error('Error loading chore types:', e);
          return [];
        }),
        dataService.getRoutines().catch(e => {
          console.error('Error loading routines:', e);
          return [];
        }),
        dataService.getRewards().catch(e => {
          console.error('Error loading rewards:', e);
          return [];
        }),
        dataService.getEvents().catch(e => {
          console.error('Error loading events:', e);
          return [];
        }),
        dataService.getDailyRoutineProgress(currentDate).catch(e => {
          console.error('Error loading routine progress:', e);
          return [];
        }),
        dataService.getFamilyPhoto().catch(e => {
          console.error('Error loading family photo:', e);
          return null;
        })
      ]);
      
      console.log('Data loaded successfully:', {
        members: members.length,
        chores: choresData.length,
        routines: routinesData.length,
        rewards: rewardsData.length,
        events: eventsData.length,
        hasPhoto: !!photo
      });

      // Note: Family ID is already set by useAuth hook
      if (details.id) {
        console.log('📡 [App] Using family ID for real-time:', details.id);
      }

      setFamilyMembers(members);
      setFamilyDetails(details);
      setChores(choresData);
      setChoreTypes(types);
      setRoutines(routinesData);
      setRewards(rewardsData);
      setEvents(eventsData);
      setDailyRoutineProgress(progress);
      setFamilyPhoto(photo);
    } catch (error) {
      console.error('Error in loadData:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  // Handle setup completion - wrapper around hook version to also load data
  const handleSetupComplete = useCallback(async (newFamilyId: string) => {
    setIsLoading(true);
    try {
      await handleAuthSetupComplete(newFamilyId);
      await loadData();
    } catch (error) {
      console.error('Error loading data after setup:', error);
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSetupComplete, loadData]);
  const [activeTab, setActiveTab] = useState<TabId>('family');
  
  // Data states
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [choreTypes, setChoreTypes] = useState<ChoreType[]>([]);
  const [familyDetails, setFamilyDetails] = useState<FamilyDetails>({
    name: 'My Family',
    address: '',
    photoObjectPosition: 'center center'
  });
  const [familyPhoto, setFamilyPhoto] = useState<string | null>(null);
  const [dailyRoutineProgress, setDailyRoutineProgress] = useState<DailyRoutineProgress[]>([]);
  
  // State for modals and UI
  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isAddingChore, setIsAddingChore] = useState(false);
  const [isEditingChore, setIsEditingChore] = useState(false);
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [isManagingChoreTypes, setIsManagingChoreTypes] = useState(false);
  const [isManagingRoutines, setIsManagingRoutines] = useState(false);
  const [isPerformanceMonitorOpen, setIsPerformanceMonitorOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);


  // Load data when setup is complete AND auth check is done
  
  // Load data when setup is complete AND auth check is done
  useEffect(() => {
    if (!isCheckingAuth && !showSetupWizard) {
      console.log('🚀 Auth complete and setup not needed - loading family data...');
      loadData();
    } else {
      console.log('⏸️ Waiting for auth/setup:', { isCheckingAuth, showSetupWizard });
    }
  }, [isCheckingAuth, showSetupWizard, currentDate, loadData]);

  // Performance monitor hotkey (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsPerformanceMonitorOpen(true);
        console.log('🎛️ Performance monitor opened via hotkey');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper functions
  const getMemberById = useCallback((id: number): FamilyMember | undefined => {
    return familyMembers.find(member => member.id === id);
  }, [familyMembers]);

  const getMemberByName = useCallback((name: string): FamilyMember | undefined => {
    return familyMembers.find(member => member.name === name);
  }, [familyMembers]);
  
  // Handler for tab change
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    dataService.saveActiveTab(tabId).catch(console.error);
  };
  
  // Member handlers
  const handleAddMember = () => {
    setEditingMember(null);
    setIsAddingMember(true);
  };
  
  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setIsAddingMember(true);
  };
  
  const handleSaveMember = async (member: FamilyMember | NewFamilyMember) => {
    try {
      if ('id' in member) {
        await dataService.updateFamilyMember(member);
        setFamilyMembers(prev => prev.map(m => m.id === member.id ? member : m));
      } else {
        const newMember = await dataService.addFamilyMember(member);
        setFamilyMembers(prev => [...prev, newMember]);
      }
      setIsAddingMember(false);
      setEditingMember(null);
    } catch (error) {
      console.error('Error saving member:', error);
    }
  };
  
  const handleDeleteMember = async (id: number) => {
    try {
      await dataService.deleteFamilyMember(id);
      setFamilyMembers(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  // Chore handlers
  const handleCompleteChore = useCallback(async (choreId: number) => {
    try {
      const chore = chores.find(c => c.id === choreId);
      if (!chore) return;

      const updatedChore = { ...chore, completed: true };
      await dataService.updateChore(updatedChore);
      setChores(prev => prev.map(c => c.id === choreId ? updatedChore : c));

      // Update member points if assigned
      if (chore.assignedTo) {
        const member = getMemberByName(chore.assignedTo);
        if (member) {
          const updatedMember = {
            ...member,
            points: member.points + (chore.points || 0)
          };
          await dataService.updateFamilyMember(updatedMember);
          setFamilyMembers(prev => 
            prev.map(m => m.id === updatedMember.id ? updatedMember : m)
          );
        }
      }
    } catch (error) {
      console.error('Error completing chore:', error);
    }
  }, [chores, getMemberByName]);
  
  const handleAddChore = () => {
    setIsAddingChore(true);
  };

  const handleEditChore = (chore: Chore) => {
    setEditingChore(chore);
    setIsEditingChore(true);
  };

  const handleDeleteChore = async (choreId: number) => {
    try {
      await dataService.deleteChore(choreId);
      setChores(prev => prev.filter(c => c.id !== choreId));
    } catch (error) {
      console.error('Error deleting chore:', error);
    }
  };
  
  const handleSaveChore = async (newChoreData: Omit<Chore, 'id' | 'completed'>) => {
    try {
      const newChore = await dataService.addChore({
        ...newChoreData,
        completed: false
      });
      setChores(prev => [...prev, newChore]);
    } catch (error) {
      console.error('Error saving chore:', error);
    }
  };

  // Routine handlers
  const handleRoutineStepToggle = useCallback(async (memberId: number, routineId: string, stepId: string, date: string) => {
    try {
      const progress = dailyRoutineProgress.find(p => 
        p.memberId === memberId && p.routineId === routineId && p.date === date
      );
      
      const completedStepIds = progress?.completedStepIds || [];
      const newCompletedStepIds = completedStepIds.includes(stepId)
        ? completedStepIds.filter(id => id !== stepId)
        : [...completedStepIds, stepId];
      
      const routine = routines.find(r => r.id === routineId);
      const isFullyCompleted = routine && 
        newCompletedStepIds.length === routine.steps.length;
      
      const updatedProgress: DailyRoutineProgress = {
        memberId,
        routineId,
        date,
        completedStepIds: newCompletedStepIds,
        isFullyCompleted: !!isFullyCompleted
      };

      await dataService.upsertDailyRoutineProgress(updatedProgress);
      
      setDailyRoutineProgress(prev => {
        const existingIndex = prev.findIndex(p => 
          p.memberId === memberId && p.routineId === routineId && p.date === date
        );
        
        if (existingIndex >= 0) {
          const newProgress = [...prev];
          newProgress[existingIndex] = updatedProgress;
          return newProgress;
        } else {
          return [...prev, updatedProgress];
        }
      });
    } catch (error) {
      console.error('Error toggling routine step:', error);
    }
  }, [routines, dailyRoutineProgress]);

  // Family handlers
  const handleNewPhotoSelected = (photoDataUrl: string) => {
    setFamilyPhoto(photoDataUrl);
    dataService.saveFamilyPhoto(photoDataUrl).catch(console.error);
  };
  
  const saveFamilyDetails = async () => {
    try {
      console.log('Saving family details:', familyDetails);
      await dataService.saveFamilyDetails(familyDetails);
      setIsEditingFamily(false);
      console.log('Successfully saved family details');
    } catch (error: unknown) {
      const errorObj = error as Error & { code?: string };
      console.error('Error saving family details:', {
        error: errorObj,
        errorString: String(errorObj),
        errorMessage: errorObj.message,
        errorCode: errorObj.code,
        errorStack: errorObj.stack,
        familyDetails
      });
      alert(`Error saving family details: ${errorObj.message || 'Unknown error'}`);
    }
  };

  // Default new states for modals
  const DEFAULT_NEW_MEMBER_STATE: Omit<FamilyMember, 'id'> = {
    name: '',
    initial: '',
    role: 'child',
    color: AVAILABLE_COLORS[0],
    nickname: '',
    dob: '',
    points: 0
  };

  const DEFAULT_NEW_CHORE_STATE: NewChore = {
    title: '',
    assignedTo: '',
    completed: false,
    points: 10,
    dueDate: new Date().toISOString().split('T')[0],
    icon: 'checkmark-circle',
    choreTypeId: null
  };

  const DEFAULT_NEW_REWARD_STATE: NewReward = {
    title: '',
    cost: 10,
    icon: 'gift'
  };

  // Render the current tab
  const renderTab = () => {
    switch (activeTab) {
      case 'family':
        return (
          <FamilyTab 
            familyMembers={familyMembers}
            familyDetails={familyDetails}
            setFamilyDetails={setFamilyDetails}
            familyPhoto={familyPhoto}
            isEditingFamily={isEditingFamily}
            setIsEditingFamily={setIsEditingFamily}
            onNewPhotoSelected={handleNewPhotoSelected}
            saveFamilyDetails={saveFamilyDetails}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onAddMember={handleAddMember}
          />
        );
      case 'chores':
        return (
          <ChoresTab 
            chores={chores}
            familyMembers={familyMembers}
            onAddChore={handleAddChore}
            onCompleteChore={handleCompleteChore}
            onEditChore={handleEditChore}
            onManageChoreTypes={() => setIsManagingChoreTypes(true)}
            rewards={rewards}
            onAddReward={() => setIsAddingReward(true)}
            getMemberByName={getMemberByName}
          />
        );
      case 'routines':
        return (
          <RoutinesTab 
            routines={routines}
            familyMembers={familyMembers}
            dailyRoutineProgress={dailyRoutineProgress}
            onToggleRoutineStep={handleRoutineStepToggle}
            currentDate={currentDate}
            onManageRoutines={() => setIsManagingRoutines(true)}
            getMemberById={getMemberById}
          />
        );
      case 'calendar':
        return <CalendarTab 
                 events={events} 
                 familyMembers={familyMembers} 
                 onAddEvent={() => setIsAddingEvent(true)} 
                 currentLocation={familyDetails.address || null} 
                 onEventsUpdated={setEvents}
               />;
      default:
        return <div className="p-8 text-center text-gray-600">Unknown Tab</div>;
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return <SplashScreen message="Checking authentication..." />;
  }
  
  // Show setup wizard if needed
  if (showSetupWizard) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }
  
  // Show loading state while data is being loaded
  if (isLoading) {
    return <SplashScreen message="Loading your family data..." />;
  }

  return (
    <RealtimeProvider 
      familyId={currentFamilyId} 
      onDataUpdate={handleRealtimeDataUpdate}
    >
      <div className="h-screen overflow-hidden flex flex-col" style={{backgroundColor: '#A8D8D8'}}>
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          {renderTab()}
        </div>

        <BottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange} 
          items={NAVIGATION_ITEMS}
        />

        {/* Modals */}
        {(isAddingMember || editingMember) && (
          <EditMemberModal
            isOpen={isAddingMember || !!editingMember}
            onClose={() => {
              setIsAddingMember(false);
              setEditingMember(null);
            }}
            memberToEdit={editingMember}
            onSaveMember={handleSaveMember}
            availableColors={AVAILABLE_COLORS}
            defaultNewMemberState={DEFAULT_NEW_MEMBER_STATE}
          />
        )}

        {isAddingChore && (
        <AddChoreModal
          isOpen={isAddingChore}
          onClose={() => setIsAddingChore(false)}
          onSaveChore={handleSaveChore}
          familyMembers={familyMembers}
          defaultNewChoreState={DEFAULT_NEW_CHORE_STATE}
          choreTypes={choreTypes}
        />
      )}

      {isEditingChore && editingChore && (
        <EditChoreModal
          isOpen={isEditingChore}
          onClose={() => {
            setIsEditingChore(false);
            setEditingChore(null);
          }}
          onSaveChore={handleSaveChore}
          onDeleteChore={handleDeleteChore}
          chore={editingChore}
          familyMembers={familyMembers}
          choreTypes={choreTypes}
        />
      )}

      {isAddingReward && (
        <AddRewardModal
          isOpen={isAddingReward}
          onClose={() => setIsAddingReward(false)}
          onSaveReward={async (reward) => {
            const newReward = await dataService.addReward(reward);
            setRewards(prev => [...prev, newReward]);
            setIsAddingReward(false);
          }}
          defaultNewRewardState={DEFAULT_NEW_REWARD_STATE}
          availableIcons={[]}
        />
      )}

      {isManagingChoreTypes && (
        <ManageChoreTypesModal
          isOpen={isManagingChoreTypes}
          onClose={() => setIsManagingChoreTypes(false)}
          choreTypes={choreTypes}
          onSaveChoreType={async (choreType) => {
            const updatedTypes = await dataService.updateChoreTypes([...choreTypes, choreType]);
            setChoreTypes(updatedTypes);
          }}
        />
      )}

      {isManagingRoutines && (
        <ManageRoutinesModal
          isOpen={isManagingRoutines}
          onClose={() => setIsManagingRoutines(false)}
          routines={routines}
          familyMembers={familyMembers}
          onSaveRoutine={async (routine) => {
            const updatedRoutines = await dataService.updateRoutines([...routines, routine]);
            setRoutines(updatedRoutines);
          }}
          onDeleteRoutine={async (routineId) => {
            await dataService.deleteRoutine(routineId);
            setRoutines(prev => prev.filter(r => r.id !== routineId));
            return true;
          }}
        />
      )}

      {isAddingEvent && (
        <EventModal
          isOpen={isAddingEvent}
          onClose={() => setIsAddingEvent(false)}
          onSaveEvent={async (event) => {
            try {
              console.log('Saving event:', event);
              const newEvent = await dataService.addEvent(event);
              console.log('Event saved successfully:', newEvent);
              setEvents(prev => [...prev, newEvent]);
              setIsAddingEvent(false);
            } catch (error) {
              console.error('Error saving event:', error);
              alert('Failed to save event. Please try again.');
            }
          }}
          familyMembers={familyMembers}
          eventColors={[...DEFAULT_COLORS]}
          defaultNewEventState={{
            title: '',
            date: '',
            color: DEFAULT_COLORS[0],
            attendees: []
          }}
        />
      )}

      {/* Performance Monitor (Ctrl+Shift+P) */}
      <PerformanceMonitor
        isOpen={isPerformanceMonitorOpen}
        onClose={() => setIsPerformanceMonitorOpen(false)}
      />
      </div>
    </RealtimeProvider>
  );
};
export default App;
