import { useCallback } from 'react';
import { dataService } from '../dataService';
import {
  FamilyMember,
  Chore,
  EventItem,
  Reward,
  Routine
} from '../types';

export interface UseSupabaseSyncProps {
  setFamilyMembers: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
  setChores: React.Dispatch<React.SetStateAction<Chore[]>>;
  setEvents: React.Dispatch<React.SetStateAction<EventItem[]>>;
  setRewards: React.Dispatch<React.SetStateAction<Reward[]>>;
  setRoutines: React.Dispatch<React.SetStateAction<Routine[]>>;
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
    setRoutines
  } = props;

  const handleRealtimeDataUpdate = useCallback(async (
    table: string,
    eventType: string,
    record: any
  ) => {
    console.log(`🔄 [useSupabaseSync] Handling real-time update for ${table}:`, eventType, record);

    try {
      // Refresh specific data based on the table that was updated
      switch (table) {
        case 'family_members':
          const updatedMembers = await dataService.getFamilyMembers();
          setFamilyMembers(updatedMembers);
          console.log(`✅ [useSupabaseSync] Updated ${updatedMembers.length} family members`);
          break;

        case 'chores':
          const updatedChores = await dataService.getChores();
          setChores(updatedChores);
          console.log(`✅ [useSupabaseSync] Updated ${updatedChores.length} chores`);
          break;

        case 'events':
          const updatedEvents = await dataService.getEvents();
          setEvents(updatedEvents);
          console.log(`✅ [useSupabaseSync] Updated ${updatedEvents.length} events`);
          break;

        case 'rewards':
          const updatedRewards = await dataService.getRewards();
          setRewards(updatedRewards);
          console.log(`✅ [useSupabaseSync] Updated ${updatedRewards.length} rewards`);
          break;

        case 'routines':
          const updatedRoutines = await dataService.getRoutines();
          setRoutines(updatedRoutines);
          console.log(`✅ [useSupabaseSync] Updated ${updatedRoutines.length} routines`);
          break;

        default:
          console.log(`ℹ️ [useSupabaseSync] No specific handler for table: ${table}`);
      }
    } catch (error) {
      console.error(`❌ [useSupabaseSync] Error refreshing data for ${table}:`, error);
      // Don't throw - we don't want real-time sync errors to crash the app
    }
  }, [setFamilyMembers, setChores, setEvents, setRewards, setRoutines]);

  return {
    handleRealtimeDataUpdate
  };
}
