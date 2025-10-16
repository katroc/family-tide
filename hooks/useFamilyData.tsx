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
import { dataLogger } from '../utils/logger';
import { useFamilyMutations, familyQueryKeys } from './useFamilyQueries';
import { useQueryClient } from '@tanstack/react-query';
import { fetchFamilyDataSnapshot } from '../services/familyDataLoader';
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
  handleSaveChore: (choreData: Chore | NewChore) => Promise<void>;
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
  const queryClient = useQueryClient();
  const {
    memberMutation,
    deleteMemberMutation,
    choreMutation,
    deleteChoreMutation,
    familyDetailsMutation,
    routineProgressMutation,
    familyPhotoMutation
  } = useFamilyMutations();

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

      const snapshot = await queryClient.fetchQuery({
        queryKey: familyQueryKeys.snapshot(currentDate),
        queryFn: () => fetchFamilyDataSnapshot(currentDate),
        staleTime: 1000 * 60
      });

      setFamilyMembers(snapshot.members);
      setFamilyDetails(snapshot.details);
      setChores(snapshot.chores);
      setChoreTypes(snapshot.choreTypes);
      setRoutines(snapshot.routines);
      setRewards(snapshot.rewards);
      setEvents(snapshot.events);
      setDailyRoutineProgress(snapshot.progress);
      setFamilyPhoto(snapshot.photo);
    } catch (error) {
      dataLogger.error('Error loading family data', error as Error, { currentDate });
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

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
      const result = await memberMutation.mutateAsync(member);
      if ('id' in member) {
        setFamilyMembers(prev => prev.map(m => m.id === member.id ? member : m));
      } else if (result) {
        setFamilyMembers(prev => [...prev, result as FamilyMember]);
      }
    } catch (error) {
      dataLogger.error('Error saving family member', error as Error, { memberId: 'id' in member ? member.id : 'new' });
      throw error;
    }
  }, [memberMutation, setFamilyMembers]);

  const handleDeleteMember = useCallback(async (id: number) => {
    try {
      await deleteMemberMutation.mutateAsync(id);
      setFamilyMembers(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      dataLogger.error('Error deleting family member', error as Error, { memberId: id });
      throw error;
    }
  }, [deleteMemberMutation, setFamilyMembers]);

  // Chore handlers
  const handleCompleteChore = useCallback(async (choreId: number) => {
    try {
      const chore = chores.find(c => c.id === choreId);
      if (!chore) return;

      const updatedChore = { ...chore, completed: true };
      await choreMutation.mutateAsync(updatedChore);
      setChores(prev => prev.map(c => c.id === choreId ? updatedChore : c));

      // Update member points if assigned
      if (chore.assignedTo) {
        const member = getMemberByName(chore.assignedTo);
        if (member) {
          const updatedMember = {
            ...member,
            points: member.points + (chore.points || 0)
          };
          await memberMutation.mutateAsync(updatedMember);
          setFamilyMembers(prev =>
            prev.map(m => m.id === updatedMember.id ? updatedMember : m)
          );
        }
      }
    } catch (error) {
      dataLogger.error('Error completing chore', error as Error, { choreId });
      throw error;
    }
  }, [chores, getMemberByName, choreMutation, memberMutation, setChores, setFamilyMembers]);

  const handleSaveChore = useCallback(async (choreData: Chore | NewChore) => {
    try {
      const savedChore = await choreMutation.mutateAsync(choreData);
      if ('id' in choreData) {
        setChores(prev => prev.map(c => (c.id === choreData.id ? choreData : c)));
      } else if (savedChore) {
        setChores(prev => [...prev, savedChore as Chore]);
      }
    } catch (error) {
      dataLogger.error('Error saving chore', error as Error);
      throw error;
    }
  }, [choreMutation, setChores]);

  const handleDeleteChore = useCallback(async (choreId: number) => {
    try {
      await deleteChoreMutation.mutateAsync(choreId);
      setChores(prev => prev.filter(c => c.id !== choreId));
    } catch (error) {
      dataLogger.error('Error deleting chore', error as Error, { choreId });
      throw error;
    }
  }, [deleteChoreMutation, setChores]);

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

      await routineProgressMutation.mutateAsync(updatedProgress);

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
      dataLogger.error('Error toggling routine step', error as Error, { memberId, routineId, stepId, date });
      throw error;
    }
  }, [routines, dailyRoutineProgress]);

  // Family handlers
  const handleNewPhotoSelected = useCallback((photoDataUrl: string) => {
    setFamilyPhoto(photoDataUrl);
    familyPhotoMutation.mutate(photoDataUrl, {
      onError: (error) => dataLogger.error('Error saving family photo', error as Error)
    });
  }, [familyPhotoMutation]);

  const saveFamilyDetails = useCallback(async () => {
    try {
      dataLogger.debug('Saving family details', { familyName: familyDetails.name, hasAddress: !!familyDetails.address });
      await familyDetailsMutation.mutateAsync(familyDetails);
      dataLogger.info('Successfully saved family details', { familyName: familyDetails.name });
    } catch (error: unknown) {
      const errorObj = error as Error & { code?: string };
      dataLogger.error('Error saving family details', errorObj, {
        familyName: familyDetails.name,
        errorCode: errorObj.code
      });
      throw new Error(errorObj.message || 'Failed to save family details');
    }
  }, [familyDetails, familyDetailsMutation]);

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
