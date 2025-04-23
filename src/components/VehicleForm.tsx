import React, { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { Vehicle } from '../pages/Vehicles'; // Import Vehicle type
// import { Client } from '../pages/Clients'; // Import Client if needed for dropdown
import { supabase } from '../services/supabaseClient'; // Import supabase client

// --- TEMPORARY & INSECURE: Import Google Vision and Credentials ---
// import vision from '@google-cloud/vision';
// import googleCredentials from '../temp-google-creds.json'; // <-- Import from UNCOMMITTED file
// -----------------------------------------------------------------

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

  // OCR/Function Call State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Refs for hidden file inputs
  const vinFileInputRef = useRef<HTMLInputElement>(null);
  const plateFileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!initialData;

  // Populate form if initialData is provided
  useEffect(() => {
    if (initialData) {
      setVin(initialData.vin || '');
      setLicensePlate(initialData.license_plate || '');
      setMake(initialData.make || '');
      setModel(initialData.model || '');
      setYear(initialData.year || '');
      setColor(initialData.color || '');
      setClientId(initialData.client_id || null);
      // Populate other fields like engine_details, odometer if editing them here
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

  // --- Restore Edge Function Call Handling --- 
  const handleImageForOCR = async (event: ChangeEvent<HTMLInputElement>, targetField: 'vin' | 'plate') => {
      const file = event.target.files?.[0];
      if (!file) return;
  
      setOcrLoading(true);
      setOcrError(null);
      setFormError(null); 
  
      try {
        // 1. Read file as Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          const imageBase64 = reader.result as string;
          if (!imageBase64) {
              throw new Error('Could not read image file.');
          }

          // --- Call Supabase Edge Function ---
          console.log(`[VehicleForm] Invoking ocr-vision function for ${targetField}...`);
          const { data: functionResponseData, error: functionError } = await supabase.functions.invoke('ocr-vision', {
              body: { imageBase64 }, // Send base64 string in the body
          });

          // Handle potential function invocation errors (network, CORS, etc.)
          if (functionError) {
              console.error(`[VehicleForm] OCR function invocation error:`, functionError);
              throw new Error(`OCR function invocation failed: ${functionError.message}`);
          }

          // Check for errors returned *from* the function execution itself
          if (functionResponseData?.error) {
              console.error(`[VehicleForm] OCR function execution error:`, functionResponseData.error);
              throw new Error(`OCR processing failed: ${functionResponseData.error}`);
          }

          console.log(`[VehicleForm] Raw OCR function response:`, functionResponseData);

          // --- Parse the Google Vision response (nested within functionResponseData) ---
          const fullText = functionResponseData?.responses?.[0]?.fullTextAnnotation?.text;
          if (typeof fullText !== 'string') {
               console.error('[VehicleForm] Could not find fullTextAnnotation.text in the function response:', functionResponseData);
              throw new Error('Unexpected response format from OCR function.');
          }
          
          // Extract text after the first newline, if present
          let recognizedText = fullText;
          const newlineIndex = recognizedText.indexOf('\n');
          if (newlineIndex !== -1) {
            recognizedText = recognizedText.substring(newlineIndex + 1);
          }

          // Clean up any remaining newlines and trim whitespace
          recognizedText = recognizedText.replace(/\n/g, '').trim();

          console.log(`[VehicleForm] Parsed text: ${recognizedText}`);

          // 3. Update the correct field
          if (targetField === 'vin') {
            setVin(recognizedText);
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
        // Reset file input value 
        if (event.target) {
            event.target.value = '';
        }
      }
  };
  
  // Trigger hidden file input click
  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };
  // --- End Client-Side OCR/Vision Call Handling (TEMPORARY & INSECURE) --- 

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation (Add more as needed)
    if (!vin.trim() && !licensePlate.trim()) {
      setFormError('Either VIN or License Plate is required.');
      return;
    }
    if (year !== '' && (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1)) {
        setFormError('Please enter a valid year.');
        return;
    }

    // Prepare data for submission
    const vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'> | Vehicle = {
      ...(isEditing && initialData ? { id: initialData.id } : {}),
      vin: vin.trim().toUpperCase() || null,
      license_plate: licensePlate.trim().toUpperCase() || null,
      make: make.trim() || null,
      model: model.trim() || null,
      year: year === '' ? null : Number(year),
      color: color.trim() || null,
      client_id: clientId,
      // Include other fields if needed
      ...(isEditing && initialData ? { created_at: initialData.created_at, updated_at: initialData.updated_at } : {}),
    };

    try {
      await onSubmit(vehicleData as any); // Use type assertion
    } catch (error: any) {
      console.error('Error submitting vehicle form:', error);
      setFormError(error.message || 'Failed to save vehicle.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-white shadow-sm">
      <h2 className="text-lg font-medium">{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
      
      {formError && <p className="text-red-600 text-sm">Error: {formError}</p>}

      {/* OCR Status Display */}
      {ocrLoading && <p className="text-blue-600 text-sm">Processing image...</p>}
      {ocrError && <p className="text-red-600 text-sm">OCR Error: {ocrError}</p>}

      {/* VIN Input */}
      <div className="relative">
        <label htmlFor="vin" className="block text-sm font-medium text-gray-700">VIN</label>
        <div className="flex items-center">
          <input
            type="text"
            id="vin"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={ocrLoading} // Disable while OCR is running
          />
          <input 
            type="file"
            ref={vinFileInputRef}
            onChange={(e) => handleImageForOCR(e, 'vin')}
            accept="image/*"
            capture="environment" // Prefer back camera on mobile
            className="hidden"
          />
          <button 
            type="button"
            onClick={() => triggerFileInput(vinFileInputRef)}
            className="mt-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            title="Scan VIN from Image"
            disabled={ocrLoading}
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
              disabled={ocrLoading}
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
          <input type="text" id="make" value={make} onChange={(e) => setMake(e.target.value)} className="mt-1 input-field" />
        </div>
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
          <input type="text" id="model" value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 input-field" />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
          <input type="number" id="year" value={year} onChange={(e) => setYear(e.target.value === '' ? '' : parseInt(e.target.value, 10))} className="mt-1 input-field" />
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
          disabled={isSubmitting || ocrLoading} // Also disable if OCR is loading
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || ocrLoading} // Also disable if OCR is loading
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