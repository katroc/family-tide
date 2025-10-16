import { useCallback, Dispatch, SetStateAction } from 'react';
import { dataService } from '../dataService';
import { syncLogger } from '../utils/logger';
import {
  FamilyMember,
  Chore,
  EventItem,
  Reward,
  Routine,
  ChoreType
} from '../types';

export interface UseSupabaseSyncProps {
  setFamilyMembers: Dispatch<SetStateAction<FamilyMember[]>>;
  setChores: Dispatch<SetStateAction<Chore[]>>;
  setEvents: Dispatch<SetStateAction<EventItem[]>>;
  setRewards: Dispatch<SetStateAction<Reward[]>>;
  setRoutines: Dispatch<SetStateAction<Routine[]>>;
  setChoreTypes?: Dispatch<SetStateAction<ChoreType[]>>;
}

export interface UseSupabaseSyncReturn {
  handleRealtimeDataUpdate: (table: string, eventType: string, record: any) => Promise<void>;
}

/**
 * Custom hook to handle real-time data synchronization from Supabase
 * Refreshes local state when database changes are detected
 *
 * @param props - Setter functions for all synced data types
 * @returns Handler function for real-time updates
 */
export function useSupabaseSync(props: UseSupabaseSyncProps): UseSupabaseSyncReturn {
  const {
    setFamilyMembers,
    setChores,
    setEvents,
    setRewards,
    setRoutines,
    setChoreTypes
  } = props;

  const handleRealtimeDataUpdate = useCallback(async (
    table: string,
    eventType: string,
    record: any
  ) => {
    syncLogger.debug('Handling real-time update', { table, eventType, recordId: record?.id });

    try {
      // Refresh specific data based on the table that was updated
      switch (table) {
        case 'family_members':
          const updatedMembers = await dataService.getFamilyMembers();
          setFamilyMembers(updatedMembers);
          syncLogger.info('Updated family members', { count: updatedMembers.length });
          break;

        case 'chores':
          const updatedChores = await dataService.getChores();
          setChores(updatedChores);
          syncLogger.info('Updated chores', { count: updatedChores.length });
          break;

        case 'events':
          const updatedEvents = await dataService.getEvents();
          setEvents(updatedEvents);
          syncLogger.info('Updated events', { count: updatedEvents.length });
          break;

        case 'rewards':
          const updatedRewards = await dataService.getRewards();
          setRewards(updatedRewards);
          syncLogger.info('Updated rewards', { count: updatedRewards.length });
          break;

        case 'routines':
          const updatedRoutines = await dataService.getRoutines();
          setRoutines(updatedRoutines);
          syncLogger.info('Updated routines', { count: updatedRoutines.length });
          break;
        case 'chore_types':
          if (setChoreTypes) {
            const updatedTypes = await dataService.getChoreTypes();
            setChoreTypes(updatedTypes);
            syncLogger.info('Updated chore types', { count: updatedTypes.length });
          }
          break;

        default:
          syncLogger.debug('No specific handler for table', { table });
      }
    } catch (error) {
      syncLogger.error('Error refreshing data after real-time update', error as Error, { table });
      // Don't throw - we don't want real-time sync errors to crash the app
    }
  }, [setFamilyMembers, setChores, setEvents, setRewards, setRoutines, setChoreTypes]);

  return {
    handleRealtimeDataUpdate
  };
}
