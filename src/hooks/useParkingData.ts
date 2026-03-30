import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParkingRealtime } from './useRealtime';

interface ParkingData {
  id: string;
  temple_id: string;
  parking_area_name: string;
  total_spots: number;
  available_spots: number;
  last_updated: string;
}

export function useParkingData(templeId: string | null) {
  const [parkingData, setParkingData] = useState<ParkingData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParkingData = useCallback(async () => {
    if (!templeId) return;

    try {
      const { data, error } = await supabase
        .from('parking_data')
        .select('*')
        .eq('temple_id', templeId)
        .order('parking_area_name');

      if (error) throw error;
      setParkingData(data || []);
    } catch (error) {
      console.error('Failed to load parking data:', error);
    } finally {
      setLoading(false);
    }
  }, [templeId]);

  useEffect(() => {
    if (templeId) {
      loadParkingData();
    }
  }, [templeId, loadParkingData]);

  // Real-time updates
  useParkingRealtime(
    templeId || '',
    (data) => {
      const next = data as ParkingData;

      setParkingData((prev) => {
        const index = prev.findIndex((parking) => parking.id === next.id);

        if (index >= 0) {
          const updated = [...prev];
          updated[index] = next;
          return updated;
        }

        return [...prev, next];
      });
    },
    (deletedId) => {
      setParkingData((prev) => prev.filter((parking) => parking.id !== deletedId));
    }
  );

  const totalAvailable = parkingData.reduce((sum, p) => sum + p.available_spots, 0);
  const totalSpots = parkingData.reduce((sum, p) => sum + p.total_spots, 0);
  const occupancyRate = totalSpots > 0 ? ((totalSpots - totalAvailable) / totalSpots) * 100 : 0;

  return {
    parkingData,
    loading,
    totalAvailable,
    totalSpots,
    occupancyRate,
    refreshParkingData: loadParkingData,
  };
}
