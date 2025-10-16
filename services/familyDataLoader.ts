import { dataService } from '../dataService';
import { dataLogger } from '../utils/logger';
import {
  FamilyMember,
  FamilyDetails,
  Chore,
  ChoreType,
  Routine,
  Reward,
  EventItem,
  DailyRoutineProgress
} from '../types';

export interface FamilyDataSnapshot {
  members: FamilyMember[];
  details: FamilyDetails;
  chores: Chore[];
  choreTypes: ChoreType[];
  routines: Routine[];
  rewards: Reward[];
  events: EventItem[];
  progress: DailyRoutineProgress[];
  photo: string | null;
}

async function safeLoad<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    dataLogger.error(`Error loading ${label}`, error as Error);
    return fallback;
  }
}

export async function fetchFamilyDataSnapshot(currentDate: string): Promise<FamilyDataSnapshot> {
  dataLogger.info('Initializing data service and loading snapshot');
  await dataService.initialize();

  const [
    members,
    details,
    chores,
    choreTypes,
    routines,
    rewards,
    events,
    progress,
    photo
  ] = await Promise.all([
    safeLoad('family members', () => dataService.getFamilyMembers(), []),
    safeLoad('family details', () => dataService.getFamilyDetails(), {
      name: 'My Family',
      address: '',
      photoObjectPosition: 'center center'
    } as FamilyDetails),
    safeLoad('chores', () => dataService.getChores(), []),
    safeLoad('chore types', () => dataService.getChoreTypes(), []),
    safeLoad('routines', () => dataService.getRoutines(), []),
    safeLoad('rewards', () => dataService.getRewards(), []),
    safeLoad('events', () => dataService.getEvents(), []),
    safeLoad('routine progress', () => dataService.getDailyRoutineProgress(currentDate), []),
    safeLoad('family photo', () => dataService.getFamilyPhoto(), null)
  ]);

  dataLogger.info('Snapshot loaded', {
    members: members.length,
    chores: chores.length,
    routines: routines.length,
    rewards: rewards.length,
    events: events.length,
    hasPhoto: !!photo
  });

  return {
    members,
    details,
    chores,
    choreTypes,
    routines,
    rewards,
    events,
    progress,
    photo
  };
}
