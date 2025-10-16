import { useEffect, useCallback, useState } from 'react';
import { syncLogger } from '../utils/logger';
import { useRealtime } from '../components/RealtimeProvider';

interface UseRealtimeDataOptions {
  table: string;
  onUpdate?: (eventType: string, record: any) => void;
  autoRefresh?: boolean; // Whether to trigger a data reload automatically
}

export const useRealtimeData = (options: UseRealtimeDataOptions) => {
  const { table, onUpdate, autoRefresh = true } = options;
  const { isConnected, subscribeToTable, unsubscribeFromTable } = useRealtime();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Handle real-time events
  const handleRealtimeUpdate = useCallback((event: CustomEvent) => {
    const { table: eventTable, eventType, record } = event.detail;
    
    if (eventTable === table) {
      syncLogger.debug(`🔄 [${table}] Real-time update:`, eventType, record);
      setLastUpdate(new Date());
      
      if (onUpdate) {
        onUpdate(eventType, record);
      }
    }
  }, [table, onUpdate]);

  // Set up event listener for real-time updates
  useEffect(() => {
    window.addEventListener('supabase-realtime-update', handleRealtimeUpdate as EventListener);
    
    return () => {
      window.removeEventListener('supabase-realtime-update', handleRealtimeUpdate as EventListener);
    };
  }, [handleRealtimeUpdate]);

  // Subscribe to table on mount
  useEffect(() => {
    subscribeToTable(table);
    
    return () => {
      unsubscribeFromTable(table);
    };
  }, [table, subscribeToTable, unsubscribeFromTable]);

  return {
    isConnected,
    lastUpdate,
    // Helper function to check if data should be refreshed
    shouldRefresh: autoRefresh && lastUpdate !== null
  };
};

// Specific hooks for each data type
export const useRealtimeEvents = (onUpdate?: (eventType: string, record: any) => void) => {
  return useRealtimeData({ table: 'events', onUpdate });
};

export const useRealtimeChores = (onUpdate?: (eventType: string, record: any) => void) => {
  return useRealtimeData({ table: 'chores', onUpdate });
};

export const useRealtimeFamilyMembers = (onUpdate?: (eventType: string, record: any) => void) => {
  return useRealtimeData({ table: 'family_members', onUpdate });
};

export const useRealtimeRewards = (onUpdate?: (eventType: string, record: any) => void) => {
  return useRealtimeData({ table: 'rewards', onUpdate });
};

export const useRealtimeRoutines = (onUpdate?: (eventType: string, record: any) => void) => {
  return useRealtimeData({ table: 'routines', onUpdate });
};