import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
// import { deserializeVinData } from '../utils/vinDataDeserializer'; // Removed dependency

const NHTSA_API_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValuesBatch/';
const VIN_LENGTH = 17;
const DEBOUNCE_DELAY = 1000; // milliseconds

// Define the structure of the data returned by the hook
interface DecodedVinData {
  make: string | null;
  model: string | null;
  year: number | null;
}

// Removed DeserializerReturnType type

interface UseVinDataReturn {
  data: DecodedVinData | null;
  isLoading: boolean;
  error: string | null;
  fetchVinData: (vin: string) => void;
}

/**
 * Custom hook to fetch and decode vehicle data from NHTSA based on VIN.
 * Handles debouncing, loading, and error states.
 *
 * @param initialVin Optional initial VIN to decode immediately.
 * @returns {UseVinDataReturn} Object containing decoded data, loading state, error state, and a function to trigger fetching.
 */
export const useVinData = (initialVin: string = ''): UseVinDataReturn => {
  const [data, setData] = useState<DecodedVinData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [vinToFetch, setVinToFetch] = useState<string>(initialVin);

  const performFetch = useCallback(async (vin: string) => {
    if (vin.length !== VIN_LENGTH) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    console.log(`[useVinData] Decoding VIN: ${vin}`);
    setIsLoading(true);
    setError(null); // Clear previous errors before fetch
    setData(null);

    try {
      const formData = new URLSearchParams();
      formData.append('DATA', vin);
      formData.append('format', 'JSON');

      const response = await fetch(NHTSA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });


      const rawData = await response.json();
      console.log('[useVinData] Raw NHTSA response:', rawData);

      const results = rawData?.Results?.[0];

      if (results) {
        // Success Case: ErrorCode is exactly '0'
        const deserialized: DecodedVinData = {
          make: results.Make || null,
          model: results.Model || null,
          year: results.ModelYear ? parseInt(results.ModelYear, 10) : null,
        };
        console.log('[useVinData] Successfully processed data:', deserialized);
        setData(deserialized);
        setError(null); // Explicitly clear error on success
      } else {
        // Error Case: No results or ErrorCode is not '0'
        const apiError = results?.ErrorText || 'VIN not found or data unavailable.';
        console.warn(`[useVinData] NHTSA API reported an issue for VIN ${vin}:`, results?.ErrorCode, apiError);
        setError(apiError);
        setData(null); // Ensure data is null when there's an error
      }

    } catch (err: any) {
      // Catch fetch errors or unexpected issues during processing
      console.error('[useVinData] Error during VIN decoding fetch/processing:', err);
      // Set error state only if it wasn't already set by the API response check
      if (!error) {
           setError(err.message || 'Failed to decode VIN.');
      }
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced version of the fetch logic trigger
  const debouncedFetch = useCallback(debounce(performFetch, DEBOUNCE_DELAY), [performFetch]);

  // Effect to trigger debounced fetch when vinToFetch changes
  useEffect(() => {
    const upperCaseVin = vinToFetch.trim().toUpperCase();
    if (upperCaseVin.length === VIN_LENGTH) {
      debouncedFetch(upperCaseVin);
    } else {
      // Cancel pending fetches and clear state if VIN becomes invalid
      debouncedFetch.cancel();
      setData(null);
      setError(null);
      setIsLoading(false);
    }

    // Cleanup debounce on unmount or when vinToFetch changes
    return () => {
      debouncedFetch.cancel();
    };
  }, [vinToFetch, debouncedFetch]);

  // Allow external trigger if needed, though typically driven by state change
  const fetchVinData = (vin: string) => {
      setVinToFetch(vin);
  };


  return { data, isLoading, error, fetchVinData };
}; 