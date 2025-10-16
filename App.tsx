import React, { useState, useEffect, useCallback } from 'react';
import { dataService } from './dataService';
import SetupWizard from './components/SetupWizard';
import { RealtimeProvider } from './components/RealtimeProvider';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import SplashScreen from './components/SplashScreen';
import { useAuth } from './hooks/useAuth';
import { useFamilyData } from './hooks/useFamilyData';
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

  // Family data management
  const {
    isLoading,
    familyMembers,
    chores,
    events,
    rewards,
    routines,
    choreTypes,
    familyDetails,
    familyPhoto,
    dailyRoutineProgress,
    setFamilyMembers,
    setChores,
    setEvents,
    setRewards,
    setRoutines,
    setFamilyDetails,
    setDailyRoutineProgress,
    loadData,
    getMemberById,
    getMemberByName,
    handleSaveMember,
    handleDeleteMember,
    handleCompleteChore,
    handleSaveChore,
    handleDeleteChore,
    handleRoutineStepToggle,
    handleNewPhotoSelected,
    saveFamilyDetails
  } = useFamilyData();
  
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


  // Handle setup completion - wrapper around hook version to also load data
  const handleSetupComplete = useCallback(async (newFamilyId: string) => {
    try {
      await handleAuthSetupComplete(newFamilyId);
      await loadData(currentDate);
    } catch (error) {
      console.error('Error loading data after setup:', error);
    }
  }, [handleAuthSetupComplete, loadData, currentDate]);

  // UI state
  const [activeTab, setActiveTab] = useState<TabId>('family');
  
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
  useEffect(() => {
    if (!isCheckingAuth && !showSetupWizard) {
      console.log('🚀 Auth complete and setup not needed - loading family data...');
      loadData(currentDate);
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

  // Handler for tab change
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    dataService.saveActiveTab(tabId).catch(console.error);
  };

  // Member UI handlers
  const handleAddMember = () => {
    setEditingMember(null);
    setIsAddingMember(true);
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setIsAddingMember(true);
  };

  const handleMemberSave = async (member: FamilyMember | NewFamilyMember) => {
    try {
      await handleSaveMember(member);
      setIsAddingMember(false);
      setEditingMember(null);
    } catch (error) {
      console.error('Error in handleMemberSave:', error);
    }
  };

  const handleMemberDelete = async (id: number) => {
    try {
      await handleDeleteMember(id);
    } catch (error) {
      console.error('Error in handleMemberDelete:', error);
    }
  };

  // Chore UI handlers
  const handleAddChore = () => {
    setIsAddingChore(true);
  };

  const handleEditChore = (chore: Chore) => {
    setEditingChore(chore);
    setIsEditingChore(true);
  };

  // Family detail save with UI state management
  const handleSaveFamilyDetails = async () => {
    try {
      await saveFamilyDetails();
      setIsEditingFamily(false);
    } catch (error: unknown) {
      const errorObj = error as Error;
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
            saveFamilyDetails={handleSaveFamilyDetails}
            onEditMember={handleEditMember}
            onDeleteMember={handleMemberDelete}
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
            onSaveMember={handleMemberSave}
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
