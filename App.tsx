import React, { useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dataService } from './dataService';
import SetupWizard from './components/SetupWizard';
import { RealtimeProvider } from './components/RealtimeProvider';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { FamilyDataProvider, useFamilyData } from './hooks/useFamilyData';
import { ModalStateProvider, useModalState } from './hooks/useModalState';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { uiLogger, dataLogger } from './utils/logger';
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

const AppContent: React.FC = () => {
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
    setChoreTypes,
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

  // Real-time data synchronization
  const { handleRealtimeDataUpdate } = useSupabaseSync({
    setFamilyMembers,
    setChores,
    setEvents,
    setRewards,
    setRoutines,
    setChoreTypes
  });


  // Handle setup completion - wrapper around hook version to also load data
  const handleSetupComplete = useCallback(async (newFamilyId: string) => {
    try {
      await handleAuthSetupComplete(newFamilyId);
      await loadData(currentDate);
    } catch (error) {
      dataLogger.error('Error loading data after setup', error as Error, { familyId: newFamilyId });
    }
  }, [handleAuthSetupComplete, loadData, currentDate]);

  const {
    activeTab,
    handleTabChange,
    isEditingFamily,
    setIsEditingFamily,
    isMemberModalOpen,
    editingMember,
    openAddMember,
    openEditMember,
    closeMemberModal,
    isEventModalOpen,
    openEventModal,
    closeEventModal,
    isAddChoreModalOpen,
    isEditChoreModalOpen,
    editingChore,
    openAddChoreModal,
    openEditChoreModal,
    closeChoreModals,
    isAddRewardModalOpen,
    openAddRewardModal,
    closeAddRewardModal,
    isManageChoreTypesOpen,
    openManageChoreTypes,
    closeManageChoreTypes,
    isManageRoutinesOpen,
    openManageRoutines,
    closeManageRoutines,
    isPerformanceMonitorOpen,
    openPerformanceMonitor,
    closePerformanceMonitor
  } = useModalState();


  // Load data when setup is complete AND auth check is done
  useEffect(() => {
    if (!isCheckingAuth && !showSetupWizard) {
      uiLogger.info('Auth complete - loading family data');
      loadData(currentDate);
    } else {
      uiLogger.debug('Waiting for auth/setup', { isCheckingAuth, showSetupWizard });
    }
  }, [isCheckingAuth, showSetupWizard, currentDate, loadData]);

  // Performance monitor hotkey (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        openPerformanceMonitor();
        uiLogger.debug('Performance monitor opened via hotkey');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openPerformanceMonitor]);

  // Member UI handlers
  const handleAddMember = () => {
    openAddMember();
  };

  const handleEditMember = (member: FamilyMember) => {
    openEditMember(member);
  };

  const handleMemberSave = async (member: FamilyMember | NewFamilyMember) => {
    try {
      await handleSaveMember(member);
      closeMemberModal();
    } catch (error) {
      uiLogger.error('Error in member save handler', error as Error);
    }
  };

  const handleMemberDelete = async (id: number) => {
    try {
      await handleDeleteMember(id);
    } catch (error) {
      uiLogger.error('Error in member delete handler', error as Error, { memberId: id });
    }
  };

  // Chore UI handlers
  const handleAddChore = () => {
    openAddChoreModal();
  };

  const handleEditChore = (chore: Chore) => {
    openEditChoreModal(chore);
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

  // Render the current tab with error boundary
  const renderTab = () => {
    switch (activeTab) {
      case 'family':
        return (
          <ErrorBoundary section="Family Tab" resetKeys={[activeTab]}>
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
          </ErrorBoundary>
        );
      case 'chores':
        return (
          <ErrorBoundary section="Chores Tab" resetKeys={[activeTab]}>
            <ChoresTab
              chores={chores}
              familyMembers={familyMembers}
              onAddChore={handleAddChore}
              onCompleteChore={handleCompleteChore}
              onEditChore={handleEditChore}
              onManageChoreTypes={openManageChoreTypes}
              rewards={rewards}
              onAddReward={openAddRewardModal}
              getMemberByName={getMemberByName}
            />
          </ErrorBoundary>
        );
      case 'routines':
        return (
          <ErrorBoundary section="Routines Tab" resetKeys={[activeTab]}>
            <RoutinesTab
              routines={routines}
              familyMembers={familyMembers}
              dailyRoutineProgress={dailyRoutineProgress}
              onToggleRoutineStep={handleRoutineStepToggle}
              currentDate={currentDate}
              onManageRoutines={openManageRoutines}
              getMemberById={getMemberById}
            />
          </ErrorBoundary>
        );
      case 'calendar':
        return (
          <ErrorBoundary section="Calendar Tab" resetKeys={[activeTab]}>
            <CalendarTab
              events={events}
              familyMembers={familyMembers}
              onAddEvent={openEventModal}
              currentLocation={familyDetails.address || null}
              onEventsUpdated={setEvents}
            />
          </ErrorBoundary>
        );
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
        {isMemberModalOpen && (
          <EditMemberModal
            isOpen={isMemberModalOpen}
            onClose={closeMemberModal}
            memberToEdit={editingMember}
            onSaveMember={handleMemberSave}
            availableColors={AVAILABLE_COLORS}
            defaultNewMemberState={DEFAULT_NEW_MEMBER_STATE}
          />
        )}

        {isAddChoreModalOpen && (
        <AddChoreModal
          isOpen={isAddChoreModalOpen}
          onClose={closeChoreModals}
          onSaveChore={handleSaveChore}
          familyMembers={familyMembers}
          defaultNewChoreState={DEFAULT_NEW_CHORE_STATE}
          choreTypes={choreTypes}
        />
      )}

      {isEditChoreModalOpen && editingChore && (
        <EditChoreModal
          isOpen={isEditChoreModalOpen}
          onClose={closeChoreModals}
          onSaveChore={handleSaveChore}
          onDeleteChore={handleDeleteChore}
          chore={editingChore}
          familyMembers={familyMembers}
          choreTypes={choreTypes}
        />
      )}

      {isAddRewardModalOpen && (
        <AddRewardModal
          isOpen={isAddRewardModalOpen}
          onClose={closeAddRewardModal}
          onSaveReward={async (reward) => {
            const newReward = await dataService.addReward(reward);
            setRewards(prev => [...prev, newReward]);
            closeAddRewardModal();
          }}
          defaultNewRewardState={DEFAULT_NEW_REWARD_STATE}
          availableIcons={[]}
        />
      )}

      {isManageChoreTypesOpen && (
        <ManageChoreTypesModal
          isOpen={isManageChoreTypesOpen}
          onClose={closeManageChoreTypes}
          choreTypes={choreTypes}
          onSaveChoreType={async (choreType) => {
            const updatedTypes = await dataService.updateChoreTypes([...choreTypes, choreType]);
            setChoreTypes(updatedTypes);
          }}
        />
      )}

      {isManageRoutinesOpen && (
        <ManageRoutinesModal
          isOpen={isManageRoutinesOpen}
          onClose={closeManageRoutines}
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

      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={closeEventModal}
          onSaveEvent={async (event) => {
            try {
              dataLogger.debug('Saving event', { title: event.title, date: event.date });
              const newEvent = await dataService.addEvent(event);
              dataLogger.info('Event saved successfully', { eventId: newEvent.id });
              setEvents(prev => [...prev, newEvent]);
              closeEventModal();
            } catch (error) {
              dataLogger.error('Error saving event', error as Error);
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
        onClose={closePerformanceMonitor}
      />
      </div>
    </RealtimeProvider>
  );
};

const queryClient = new QueryClient();

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <FamilyDataProvider>
      <ModalStateProvider>
        <AppContent />
      </ModalStateProvider>
    </FamilyDataProvider>
  </QueryClientProvider>
);

export default App;
