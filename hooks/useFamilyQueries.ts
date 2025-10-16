import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../dataService';
import { fetchFamilyDataSnapshot } from '../services/familyDataLoader';
import { dataLogger } from '../utils/logger';
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

const familyKeys = {
  all: ['family'] as const,
  snapshot: (date: string) => [...familyKeys.all, 'snapshot', date] as const,
  members: ['family', 'members'] as const,
  chores: ['family', 'chores'] as const,
  routines: ['family', 'routines'] as const,
  rewards: ['family', 'rewards'] as const,
  events: ['family', 'events'] as const,
  choreTypes: ['family', 'choreTypes'] as const,
  routineProgress: (date: string) => ['family', 'routineProgress', date] as const,
  details: ['family', 'details'] as const,
  photo: ['family', 'photo'] as const
};

export function useFamilySnapshot(date: string) {
  return useQuery({
    queryKey: familyKeys.snapshot(date),
    queryFn: () => fetchFamilyDataSnapshot(date),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false
  });
}

export function useFamilyMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: familyKeys.all });

  const memberMutation = useMutation({
    mutationFn: async (member: FamilyMember | NewFamilyMember) => {
      if ('id' in member) {
        await dataService.updateFamilyMember(member);
        return member;
      }
      return dataService.addFamilyMember(member);
    },
    onSuccess: invalidateAll,
    onError: (error, variables) => {
      dataLogger.error('Member mutation failed', error as Error, { memberId: 'id' in variables ? variables.id : 'new' });
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: number) => dataService.deleteFamilyMember(id),
    onSuccess: invalidateAll,
    onError: (error, id) => {
      dataLogger.error('Delete member failed', error as Error, { memberId: id });
    }
  });

  const choreMutation = useMutation({
    mutationFn: async (chore: Chore | NewChore) => {
      if ('id' in chore) {
        await dataService.updateChore(chore);
        return chore;
      }
      return dataService.addChore({ ...chore, completed: false });
    },
    onSuccess: invalidateAll,
    onError: (error, chore) => dataLogger.error('Chore mutation failed', error as Error, { choreId: 'id' in chore ? chore.id : 'new' })
  });

  const deleteChoreMutation = useMutation({
    mutationFn: (id: number) => dataService.deleteChore(id),
    onSuccess: invalidateAll,
    onError: (error, id) => dataLogger.error('Delete chore failed', error as Error, { choreId: id })
  });

  const rewardMutation = useMutation({
    mutationFn: async (reward: Reward | NewReward) => {
      if ('id' in reward) {
        await dataService.updateReward(reward);
        return reward;
      }
      return dataService.addReward(reward);
    },
    onSuccess: invalidateAll,
    onError: (error, reward) => dataLogger.error('Reward mutation failed', error as Error, { rewardId: 'id' in reward ? reward.id : 'new' })
  });

  const familyDetailsMutation = useMutation({
    mutationFn: (details: FamilyDetails) => dataService.saveFamilyDetails(details),
    onSuccess: invalidateAll,
    onError: (error) => dataLogger.error('Family details update failed', error as Error)
  });

  const routineProgressMutation = useMutation({
    mutationFn: (progress: DailyRoutineProgress) => dataService.upsertDailyRoutineProgress(progress),
    onSuccess: invalidateAll,
    onError: (error, progress) => dataLogger.error('Routine progress update failed', error as Error, progress)
  });

  const familyPhotoMutation = useMutation({
    mutationFn: (photo: string) => dataService.saveFamilyPhoto(photo),
    onSuccess: invalidateAll,
    onError: (error) => dataLogger.error('Family photo save failed', error as Error)
  });

  return {
    memberMutation,
    deleteMemberMutation,
    choreMutation,
    deleteChoreMutation,
    rewardMutation,
    familyDetailsMutation,
    routineProgressMutation,
    familyPhotoMutation,
    invalidateAll
  };
}

export const familyQueryKeys = familyKeys;
