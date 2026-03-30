import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

interface RealtimeOptions {
  table: string;
  enabled?: boolean;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (payload: RealtimePayload) => void;
  onUpdate?: (payload: RealtimePayload) => void;
  onDelete?: (payload: RealtimePayload) => void;
  onChange?: (payload: RealtimePayload) => void;
}

const getRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return null;
};

export function useRealtime({
  table,
  enabled = true,
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
    if (!enabled) {
      setChannel(null);
      return;
    }

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
      const typedPayload = payload as RealtimePayload;

      handlersRef.current.onChange?.(typedPayload);

      switch (typedPayload.eventType) {
        case 'INSERT':
          handlersRef.current.onInsert?.(typedPayload);
          break;
        case 'UPDATE':
          handlersRef.current.onUpdate?.(typedPayload);
          break;
        case 'DELETE':
          handlersRef.current.onDelete?.(typedPayload);
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
  }, [table, enabled, event, filter]);

  return { channel };
}

export function useCrowdRealtime(templeId: string, onUpdate: (data: Record<string, unknown>) => void) {
  return useRealtime({
    table: 'crowd_data',
    enabled: Boolean(templeId),
    event: 'INSERT',
    filter: `temple_id=eq.${templeId}`,
    onInsert: (payload) => {
      const next = getRecord(payload.new);
      if (next) onUpdate(next);
    },
  });
}

export function useQueueRealtime(bookingId: string, onUpdate: (data: Record<string, unknown>) => void) {
  return useRealtime({
    table: 'queue_status',
    enabled: Boolean(bookingId),
    event: 'UPDATE',
    filter: `booking_id=eq.${bookingId}`,
    onUpdate: (payload) => {
      const next = getRecord(payload.new);
      if (next) onUpdate(next);
    },
  });
}

export function useParkingRealtime(
  templeId: string,
  onUpsert: (data: Record<string, unknown>) => void,
  onDelete?: (id: string) => void
) {
  return useRealtime({
    table: 'parking_data',
    enabled: Boolean(templeId),
    event: '*',
    filter: `temple_id=eq.${templeId}`,
    onInsert: (payload) => {
      const next = getRecord(payload.new);
      if (next) onUpsert(next);
    },
    onUpdate: (payload) => {
      const next = getRecord(payload.new);
      if (next) onUpsert(next);
    },
    onDelete: (payload) => {
      if (!onDelete) return;
      const previous = getRecord(payload.old);
      const id = previous?.id;
      if (typeof id === 'string') {
        onDelete(id);
      }
    },
  });
}

export function useEmergencyRealtime(onNewIncident: (data: Record<string, unknown>) => void) {
  return useRealtime({
    table: 'emergency_incidents',
    event: 'INSERT',
    onInsert: (payload) => {
      const next = getRecord(payload.new);
      if (next) onNewIncident(next);
    },
  });
}
