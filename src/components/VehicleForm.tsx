import React, { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { Vehicle } from '../pages/Vehicles'; // Import Vehicle type
// import { Client } from '../pages/Clients'; // Import Client if needed for dropdown
import { supabase } from '../services/supabaseClient'; // Import supabase client
import { useVinData } from '../hooks/useVinData'; // Import the new hook

// --- TEMPORARY & INSECURE: Import Google Vision and Credentials ---
// import vision from '@google-cloud/vision';
// import googleCredentials from '../temp-google-creds.json'; // <-- Import from UNCOMMITTED file
// -----------------------------------------------------------------

// Constants
const VIN_LENGTH = 17;
// const DEBOUNCE_DELAY = 500; // Debounce handled in the hook

interface VehicleFormProps {
  onSubmit: (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'> | Vehicle) => Promise<void>;
  onCancel: () => void;
  initialData?: Vehicle | null;
  isSubmitting: boolean;
  // Optional: Pass clients list for dropdown if assigning client here
  // clients?: Client[]; 
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  onSubmit,
  onCancel,
  initialData = null,
  isSubmitting,
  // clients = [],
}) => {
  // Form State
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>( ''); // Store year as number or empty string
  const [color, setColor] = useState('');
  const [clientId, setClientId] = useState<string | null>(null); // If associating client
  const [formError, setFormError] = useState<string | null>(null);

  // OCR State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // VIN Decode Hook
  // The hook manages its own state for loading, error, and data
  // We pass the current VIN state to the hook's fetch trigger function
  const { data: vinData, isLoading: vinDecodingLoading, error: vinDecodingError, fetchVinData } = useVinData();

  console.log('[VehicleForm] vinData:', vinData);

  // Refs for hidden file inputs
  const vinFileInputRef = useRef<HTMLInputElement>(null);
  const plateFileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!initialData;

  // Populate form if initialData is provided (runs once on mount if editing)
  useEffect(() => {
    if (initialData) {
      setVin(initialData.vin || '');
      setLicensePlate(initialData.license_plate || '');
      setMake(initialData.make || '');
      setModel(initialData.model || '');
      setYear(initialData.year || '');
      setColor(initialData.color || '');
      setClientId(initialData.client_id || null);
    } else {
      // Reset form for creating
      setVin('');
      setLicensePlate('');
      setMake('');
      setModel('');
      setYear('');
      setColor('');
      setClientId(null);
      setFormError(null);
    }
  }, [initialData]);

  // Effect to trigger VIN decoding via the hook when VIN changes
  useEffect(() => {
    fetchVinData(vin); // The hook handles debouncing and length check internally
  }, [vin, fetchVinData]);

  // Effect to update form fields when VIN decoding data is available
  useEffect(() => {
    if (vinData) {
      // Only update if the field is currently empty to avoid overwriting manual edits
      if (vinData.make && !make) {
        setMake(vinData.make);
      }
      if (vinData.model && !model) {
        setModel(vinData.model);
      }
      if (vinData.year && !year) {
        setYear(vinData.year);
      }
    }
    // We don't want this effect to re-run if make/model/year change, only when vinData changes.
  }, [vinData]); // Dependency is vinData from the hook

  // --- OCR Handling (remains largely the same) --- 
  const handleImageForOCR = async (event: ChangeEvent<HTMLInputElement>, targetField: 'vin' | 'plate') => {
      const file = event.target.files?.[0];
      if (!file) return;
  
      setOcrLoading(true);
      setOcrError(null);
      setFormError(null); 
  
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          const imageBase64 = reader.result as string;
          if (!imageBase64) {
              throw new Error('Could not read image file.');
          }

          console.log(`[VehicleForm] Invoking ocr-vision function for ${targetField}...`);
          const { data: functionResponseData, error: functionError } = await supabase.functions.invoke('ocr-vision', {
              body: { imageBase64 },
          });

          if (functionError) {
              console.error(`[VehicleForm] OCR function invocation error:`, functionError);
              throw new Error(`OCR function invocation failed: ${functionError.message}`);
          }

          if (functionResponseData?.error) {
              console.error(`[VehicleForm] OCR function execution error:`, functionResponseData.error);
              throw new Error(`OCR processing failed: ${functionResponseData.error}`);
          }

          console.log(`[VehicleForm] Raw OCR function response:`, functionResponseData);

          const fullText = functionResponseData?.responses?.[0]?.fullTextAnnotation?.text;
          if (typeof fullText !== 'string') {
               console.error('[VehicleForm] Could not find fullTextAnnotation.text in the function response:', functionResponseData);
              throw new Error('Unexpected response format from OCR function.');
          }
          
          let recognizedText = fullText;
          const newlineIndex = recognizedText.indexOf('\n');
          if (newlineIndex !== -1) {
            recognizedText = recognizedText.substring(newlineIndex + 1);
          }
          recognizedText = recognizedText.replace(/\n/g, '').trim();
          console.log(`[VehicleForm] Parsed text: ${recognizedText}`);

          if (targetField === 'vin') {
            setVin(recognizedText); // Setting VIN here will trigger the useVinData hook effect
          } else {
            setLicensePlate(recognizedText);
          }
          setOcrLoading(false);
        };

        reader.onerror = (error) => {
            console.error('[VehicleForm] FileReader error:', error);
            throw new Error('Failed to read image file.');
        }

      } catch (error: any) {
        console.error('[VehicleForm] Error during OCR process:', error);
        setOcrError(error.message || 'Failed to process image.');
        setOcrLoading(false);
      } finally {
        if (event.target) {
            event.target.value = '';
        }
      }
  };
  
  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };

  // --- Form Submission (remains largely the same) --- 
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!vin.trim() && !licensePlate.trim()) {
      setFormError('Either VIN or License Plate is required.');
      return;
    }
    if (year !== '' && (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1)) {
        setFormError('Please enter a valid year.');
        return;
    }

    const vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'> | Vehicle = {
      ...(isEditing && initialData ? { id: initialData.id } : {}),
      vin: vin.trim().toUpperCase() || null,
      license_plate: licensePlate.trim().toUpperCase() || null,
      make: make.trim() || null,
      model: model.trim() || null,
      year: year === '' ? null : Number(year),
      color: color.trim() || null,
      client_id: clientId,
      ...(isEditing && initialData ? { created_at: initialData.created_at, updated_at: initialData.updated_at } : {}),
    };

    try {
      await onSubmit(vehicleData as any);
    } catch (error: any) {
      console.error('Error submitting vehicle form:', error);
      setFormError(error.message || 'Failed to save vehicle.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-white shadow-sm">
      <h2 className="text-lg font-medium">{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
      
      {formError && <p className="text-red-600 text-sm">Error: {formError}</p>}

      {/* --- Status Displays --- */}
      {ocrLoading && <p className="text-blue-600 text-sm">Processing image...</p>}
      {ocrError && <p className="text-red-600 text-sm">OCR Error: {ocrError}</p>}

      {/* Use loading/error state from the useVinData hook */} 
      <div className="h-6"> {/* Placeholder to prevent layout shift */}
        {vinDecodingLoading && <p className="text-blue-600 text-sm">Decoding VIN...</p>}
        {vinDecodingError && <p className="text-red-600 text-sm">VIN Decode Error: {vinDecodingError}</p>}
      </div>

      {/* VIN Input */}
      <div className="relative">
        <label htmlFor="vin" className="block text-sm font-medium text-gray-700">VIN</label>
        <div className="flex items-center">
          <input
            type="text"
            id="vin"
            value={vin}
            onChange={(e) => setVin(e.target.value)} // Directly update VIN state
            maxLength={VIN_LENGTH}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={ocrLoading || vinDecodingLoading} // Disable if OCR or VIN decoding is happening
          />
          <input 
            type="file"
            ref={vinFileInputRef}
            onChange={(e) => handleImageForOCR(e, 'vin')}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <button 
            type="button"
            onClick={() => triggerFileInput(vinFileInputRef)}
            className="mt-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            title="Scan VIN from Image"
            disabled={ocrLoading || vinDecodingLoading} // Also disable if VIN decoding
          >
            {ocrLoading ? '...' : '📷'} 
          </button>
        </div>
      </div>

      {/* License Plate Input */}
      <div className="relative">
        <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">License Plate</label>
        <div className="flex items-center">
            <input
              type="text"
              id="licensePlate"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={ocrLoading} // Only disabled by OCR now
            />
            <input 
              type="file"
              ref={plateFileInputRef}
              onChange={(e) => handleImageForOCR(e, 'plate')}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <button 
              type="button"
              onClick={() => triggerFileInput(plateFileInputRef)}
              className="mt-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              title="Scan Plate from Image"
              disabled={ocrLoading}
            >
              {ocrLoading ? '...' : '📷'}
            </button>
          </div>
      </div>

      {/* Other Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="make" className="block text-sm font-medium text-gray-700">Make</label>
          <input 
            type="text" 
            id="make" 
            value={make} 
            onChange={(e) => setMake(e.target.value)} 
            className="mt-1 input-field" 
            disabled={vinDecodingLoading} // Disable if VIN decoding is loading
          />
        </div>
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
          <input 
            type="text" 
            id="model" 
            value={model} 
            onChange={(e) => setModel(e.target.value)} 
            className="mt-1 input-field" 
            disabled={vinDecodingLoading} // Disable if VIN decoding is loading
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
          <input 
            type="number" 
            id="year" 
            value={year} 
            onChange={(e) => setYear(e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
            className="mt-1 input-field" 
            disabled={vinDecodingLoading} // Disable if VIN decoding is loading
          />
        </div>
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color</label>
          <input type="text" id="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-1 input-field" />
        </div>
      </div>

      {/* TODO: Add Client Association Dropdown if needed */}
      {/* <div>
        <label htmlFor="client" className="block text-sm font-medium text-gray-700">Assign Client</label>
        <select 
          id="client"
          value={clientId || ''}
          onChange={(e) => setClientId(e.target.value || null)}
          className="mt-1 input-field"
        >
          <option value="">-- Select Client --</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div> */} 

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || ocrLoading || vinDecodingLoading} // Disable based on any loading state
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || ocrLoading || vinDecodingLoading} // Combine all loading states, remove duplicate
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Vehicle' : 'Add Vehicle')}
        </button>
      </div>

      {/* Helper class for inputs */}
      <style>{`
        .input-field {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #D1D5DB; /* gray-300 */
          border-radius: 0.375rem; /* rounded-md */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
        }
        .input-field:focus {
          outline: none;
          border-color: #6366F1; /* indigo-500 */
          box-shadow: 0 0 0 1px #6366F1; /* focus:ring-indigo-500 */
        }
      `}</style>
    </form>
  );
};

export default VehicleForm; 