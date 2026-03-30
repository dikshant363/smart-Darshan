import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

interface RealtimeOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (payload: RealtimePayload) => void;
  onUpdate?: (payload: RealtimePayload) => void;
  onDelete?: (payload: RealtimePayload) => void;
  onChange?: (payload: RealtimePayload) => void;
}

export function useRealtime({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: RealtimeOptions) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const handlersRef = useRef({ onInsert, onUpdate, onDelete, onChange });

  useEffect(() => {
    handlersRef.current = { onInsert, onUpdate, onDelete, onChange };
  }, [onInsert, onUpdate, onDelete, onChange]);

  useEffect(() => {
    const channelName = `${table}-changes-${Math.random()}`;
    const realtimeChannel = supabase.channel(channelName);

    const config: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema: 'public';
      table: string;
      filter?: string;
    } = {
      event,
      schema: 'public',
      table,
    };

    if (filter) {
      config.filter = filter;
    }

    realtimeChannel.on('postgres_changes', config, (payload) => {
      console.log('Realtime update:', payload);

      handlersRef.current.onChange?.(payload as RealtimePayload);

      switch (payload.eventType) {
        case 'INSERT':
          handlersRef.current.onInsert?.(payload as RealtimePayload);
          break;
        case 'UPDATE':
          handlersRef.current.onUpdate?.(payload as RealtimePayload);
          break;
        case 'DELETE':
          handlersRef.current.onDelete?.(payload as RealtimePayload);
          break;
      }
    });

    realtimeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to ${table} changes`);
      }
    });

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [table, event, filter]);

  return { channel };
}

export function useCrowdRealtime(templeId: string, onUpdate: (data: Record<string, unknown>) => void) {
  return useRealtime({
    table: 'crowd_data',
    event: 'INSERT',
    filter: `temple_id=eq.${templeId}`,
    onInsert: (payload) => onUpdate((payload.new ?? {}) as Record<string, unknown>),
  });
}

export function useQueueRealtime(bookingId: string, onUpdate: (data: Record<string, unknown>) => void) {
  return useRealtime({
    table: 'queue_status',
    event: 'UPDATE',
    filter: `booking_id=eq.${bookingId}`,
    onUpdate: (payload) => onUpdate((payload.new ?? {}) as Record<string, unknown>),
  });
}

export function useParkingRealtime(templeId: string, onUpdate: (data: Record<string, unknown>) => void) {
  return useRealtime({
    table: 'parking_data',
    event: '*',
    filter: `temple_id=eq.${templeId}`,
    onChange: (payload) => onUpdate((payload.new ?? {}) as Record<string, unknown>),
  });
}

export function useEmergencyRealtime(onNewIncident: (data: Record<string, unknown>) => void) {
  return useRealtime({
    table: 'emergency_incidents',
    event: 'INSERT',
    onInsert: (payload) => onNewIncident((payload.new ?? {}) as Record<string, unknown>),
  });
}
