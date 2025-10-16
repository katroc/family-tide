import {
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
  FC
} from 'react';
import { dataService } from '../dataService';
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
  DailyRoutineProgress
} from '../types';

export interface UseFamilyDataReturn {
  // State
  isLoading: boolean;
  familyMembers: FamilyMember[];
  chores: Chore[];
  events: EventItem[];
  rewards: Reward[];
  routines: Routine[];
  choreTypes: ChoreType[];
  familyDetails: FamilyDetails;
  familyPhoto: string | null;
  dailyRoutineProgress: DailyRoutineProgress[];

  // Setters (for external updates like real-time)
  setFamilyMembers: Dispatch<SetStateAction<FamilyMember[]>>;
  setChores: Dispatch<SetStateAction<Chore[]>>;
  setEvents: Dispatch<SetStateAction<EventItem[]>>;
  setRewards: Dispatch<SetStateAction<Reward[]>>;
  setRoutines: Dispatch<SetStateAction<Routine[]>>;
  setChoreTypes: Dispatch<SetStateAction<ChoreType[]>>;
  setFamilyDetails: Dispatch<SetStateAction<FamilyDetails>>;
  setDailyRoutineProgress: Dispatch<SetStateAction<DailyRoutineProgress[]>>;

  // Load data
  loadData: (currentDate: string) => Promise<void>;

  // Member operations
  getMemberById: (id: number) => FamilyMember | undefined;
  getMemberByName: (name: string) => FamilyMember | undefined;
  handleSaveMember: (member: FamilyMember | NewFamilyMember) => Promise<void>;
  handleDeleteMember: (id: number) => Promise<void>;

  // Chore operations
  handleCompleteChore: (choreId: number) => Promise<void>;
  handleSaveChore: (newChoreData: Omit<Chore, 'id' | 'completed'>) => Promise<void>;
  handleDeleteChore: (choreId: number) => Promise<void>;

  // Routine operations
  handleRoutineStepToggle: (memberId: number, routineId: string, stepId: string, date: string) => Promise<void>;

  // Family operations
  handleNewPhotoSelected: (photoDataUrl: string) => void;
  saveFamilyDetails: () => Promise<void>;
}

/**
 * Custom hook to manage all family-related data and operations
 * Consolidates state management for members, chores, events, rewards, routines, etc.
 */
function useProvideFamilyData(): UseFamilyDataReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  // Load initial data
  const loadData = useCallback(async (currentDate: string) => {
    try {
      setIsLoading(true);
      console.log('Starting data service initialization...');
      await dataService.initialize();
      console.log('Data service initialized, loading data...');

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
  }, []);

  // Helper functions
  const getMemberById = useCallback((id: number): FamilyMember | undefined => {
    return familyMembers.find(member => member.id === id);
  }, [familyMembers]);

  const getMemberByName = useCallback((name: string): FamilyMember | undefined => {
    return familyMembers.find(member => member.name === name);
  }, [familyMembers]);

  // Member handlers
  const handleSaveMember = useCallback(async (member: FamilyMember | NewFamilyMember) => {
    try {
      if ('id' in member) {
        await dataService.updateFamilyMember(member);
        setFamilyMembers(prev => prev.map(m => m.id === member.id ? member : m));
      } else {
        const newMember = await dataService.addFamilyMember(member);
        setFamilyMembers(prev => [...prev, newMember]);
      }
    } catch (error) {
      console.error('Error saving member:', error);
      throw error;
    }
  }, []);

  const handleDeleteMember = useCallback(async (id: number) => {
    try {
      await dataService.deleteFamilyMember(id);
      setFamilyMembers(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }, []);

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
      throw error;
    }
  }, [chores, getMemberByName]);

  const handleSaveChore = useCallback(async (newChoreData: Omit<Chore, 'id' | 'completed'>) => {
    try {
      const newChore = await dataService.addChore({
        ...newChoreData,
        completed: false
      });
      setChores(prev => [...prev, newChore]);
    } catch (error) {
      console.error('Error saving chore:', error);
      throw error;
    }
  }, []);

  const handleDeleteChore = useCallback(async (choreId: number) => {
    try {
      await dataService.deleteChore(choreId);
      setChores(prev => prev.filter(c => c.id !== choreId));
    } catch (error) {
      console.error('Error deleting chore:', error);
      throw error;
    }
  }, []);

  // Routine handlers
  const handleRoutineStepToggle = useCallback(async (
    memberId: number,
    routineId: string,
    stepId: string,
    date: string
  ) => {
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
      throw error;
    }
  }, [routines, dailyRoutineProgress]);

  // Family handlers
  const handleNewPhotoSelected = useCallback((photoDataUrl: string) => {
    setFamilyPhoto(photoDataUrl);
    dataService.saveFamilyPhoto(photoDataUrl).catch(console.error);
  }, []);

  const saveFamilyDetails = useCallback(async () => {
    try {
      console.log('Saving family details:', familyDetails);
      await dataService.saveFamilyDetails(familyDetails);
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
      throw new Error(errorObj.message || 'Failed to save family details');
    }
  }, [familyDetails]);

  return {
    // State
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

    // Setters
    setFamilyMembers,
    setChores,
  	setEvents,
    setRewards,
    setRoutines,
    setChoreTypes,
    setFamilyDetails,
    setDailyRoutineProgress,

    // Operations
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
  };
}

const FamilyDataContext = createContext<UseFamilyDataReturn | undefined>(undefined);

export const FamilyDataProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const value = useProvideFamilyData();
  return (
    <FamilyDataContext.Provider value={value}>
      {children}
    </FamilyDataContext.Provider>
  );
};

export function useFamilyData(): UseFamilyDataReturn {
  const context = useContext(FamilyDataContext);
  if (!context) {
    throw new Error('useFamilyData must be used within a FamilyDataProvider');
  }
  return context;
}
