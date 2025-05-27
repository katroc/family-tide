import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseService';
import { dataService } from '../dataService';

interface RealtimeContextType {
  isConnected: boolean;
  subscriptions: string[];
  subscribeToTable: (table: string, callback?: () => void) => void;
  unsubscribeFromTable: (table: string) => void;
  unsubscribeAll: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: React.ReactNode;
  familyId?: string;
  onDataUpdate?: (table: string, eventType: string, record: any) => void;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({
  children,
  familyId,
  onDataUpdate
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [activeChannels, setActiveChannels] = useState<Map<string, any>>(new Map());

  // Handle real-time events
  const handleRealtimeEvent = useCallback((table: string, payload: any) => {
    console.log(`📡 [Realtime] ${table} event:`, payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // Call the data update callback if provided
    if (onDataUpdate) {
      onDataUpdate(table, eventType, newRecord || oldRecord);
    }

    // Trigger UI refresh by dispatching a custom event
    window.dispatchEvent(new CustomEvent('supabase-realtime-update', {
      detail: { table, eventType, record: newRecord || oldRecord }
    }));
  }, [onDataUpdate]);

  // Subscribe to a specific table
  const subscribeToTable = useCallback((table: string, callback?: () => void) => {
    if (!familyId) {
      console.log(`⚠️ [Realtime] Skipping subscription to ${table} - no family ID`);
      return;
    }
    if (activeChannels.has(table)) {
      console.log(`⚠️ [Realtime] Already subscribed to ${table}, skipping.`);
      return;
    }

    console.log(`🔔 [Realtime] Subscribing to ${table} for family ${familyId}`);

    const channel = supabase
      .channel(`${table}-changes-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `family_id=eq.${familyId}`
        },
        (payload) => {
          handleRealtimeEvent(table, payload);
          if (callback) callback();
        }
      )
      .subscribe((status) => {
        console.log(`📡 [Realtime] ${table} subscription status:`, status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setSubscriptions(prev => [...prev.filter(t => t !== table), table]);
        }
      });

    setActiveChannels(prev => new Map(prev.set(table, channel)));
  }, [familyId, handleRealtimeEvent, activeChannels]);

  // Unsubscribe from a specific table
  const unsubscribeFromTable = useCallback((table: string) => {
    const channel = activeChannels.get(table);
    if (channel) {
      console.log(`🔕 [Realtime] Unsubscribing from ${table}`);
      supabase.removeChannel(channel);
      setActiveChannels(prev => {
        const newMap = new Map(prev);
        newMap.delete(table);
        return newMap;
      });
      setSubscriptions(prev => prev.filter(t => t !== table));
    }
  }, [activeChannels]);

  // Unsubscribe from all tables
  const unsubscribeAll = useCallback(() => {
    console.log('🔕 [Realtime] Unsubscribing from all tables');
    activeChannels.forEach((channel, table) => {
      supabase.removeChannel(channel);
    });
    setActiveChannels(new Map());
    setSubscriptions([]);
    setIsConnected(false);
  }, [activeChannels]);

  // Auto-subscribe to core tables when familyId changes
  useEffect(() => {
    if (familyId) {
      console.log(`🚀 [Realtime] Setting up subscriptions for family ${familyId}`);
      const coreTables = ['family_members', 'chores', 'events', 'rewards', 'routines'];
      coreTables.forEach(table => {
        if (!subscriptions.includes(table)) {
          subscribeToTable(table);
        }
      });
    } else {
      unsubscribeAll();
    }

    // Always cleanup on unmount or family change
    return () => {
      unsubscribeAll();
    };
  }, [familyId]);

  // Connection status monitoring
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(subscriptions.length > 0);
    };

    checkConnection();
  }, [subscriptions]);

  const value: RealtimeContextType = {
    isConnected,
    subscriptions,
    subscribeToTable,
    unsubscribeFromTable,
    unsubscribeAll
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export default RealtimeProvider;