import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import VehicleForm from '../components/VehicleForm';
import Modal from '../components/Modal';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Define the structure based on your Supabase 'vehicles' table
// Include related client data if fetching it (e.g., using a join)
export interface Vehicle {
  id: string; // UUID
  client_id?: string | null;
  created_at: string;
  updated_at: string;
  vin?: string | null;
  license_plate?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  engine_details?: string | null;
  last_odometer?: number | null;
  odometer_updated_at?: string | null;
  // Add a field for fetched client name if doing a join
  // client_name?: string | null; 
}

// Define the async function to fetch vehicles (can be outside the component)
const fetchVehiclesFromSupabase = async (): Promise<Vehicle[]> => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*' // Select specific columns if needed: 'id, make, model, year, vin, license_plate'
    )
    .order('make', { ascending: true })
    .order('model', { ascending: true });

  if (error) {
    console.error('[Vehicles] Error fetching vehicles:', error);
    throw new Error(error.message || 'Failed to fetch vehicles.');
  }
  return data || [];
};

const Vehicles: React.FC = () => {
  // State for modal/form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null); // Specific state for submission errors

  const { role } = useAuth(); // For permission checks
  const queryClient = useQueryClient(); // Get query client instance

  // Use react-query to fetch vehicles
  const { 
    data: vehicles = [], // Default to empty array
    isLoading,
    isError,
    error: queryError, // Rename to avoid conflict with submissionError
  } = useQuery<Vehicle[], Error>({
    queryKey: ['vehicles'], // Unique key for this query
    queryFn: fetchVehiclesFromSupabase, // The async function to fetch data
    // Options can be added here, e.g., staleTime, cacheTime
  });

  const canManageVehicles = role === 'admin' || role === 'service_advisor';

  // --- CRUD Handlers ---
  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setSubmissionError(null); // Clear submission error when opening modal
    setIsModalOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setSubmissionError(null); // Clear submission error when opening modal
    setIsModalOpen(true);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    // Consider adding specific loading state for delete button if needed
    // For now, the main loading state isn't suitable here
    setSubmissionError(null); // Clear previous errors
    try {
      const { error: deleteError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (deleteError) throw deleteError;
      
      // Invalidate the vehicles query to trigger a refetch
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      console.log('[Vehicles] Invalidated vehicles query after delete.');

    } catch (err: any) {
      console.error('Error deleting vehicle:', err);
      setSubmissionError(err.message || 'Failed to delete vehicle.');
    }
  };

  const handleFormSubmit = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'> | Vehicle) => {
    setIsSubmitting(true);
    setSubmissionError(null); // Clear previous errors
    try {
      let error: any;
      if (editingVehicle) {
        // Update
        const { error: updateError } = await supabase
          .from('vehicles')
          .update(vehicleData as Partial<Vehicle>)
          .eq('id', editingVehicle.id);
        error = updateError;
      } else {
        // Insert
        const { id, created_at, updated_at, ...insertData } = vehicleData as Vehicle;
        const { error: insertError } = await supabase
          .from('vehicles')
          .insert(insertData);
        error = insertError;
      }

      if (error) throw error;
      
      setIsModalOpen(false); // Close modal on success
      // Invalidate the vehicles query to trigger a refetch
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      console.log('[Vehicles] Invalidated vehicles query after submit.');
      
    } catch (err: any) {
      console.error('Error saving vehicle:', err);
      setSubmissionError(err.message || 'Failed to save vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    setSubmissionError(null); // Clear potential submission errors
  };

  return (
    <div>
      {/* Header and Add Button */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Vehicles Management</h1>
        {canManageVehicles && (
          <button
            onClick={handleAddVehicle}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isLoading} // Optionally disable while initial load
          >
            Add New Vehicle
          </button>
        )}
      </div>

      {/* Loading/Error Messages from useQuery */}
      {/* Show loading only if not in modal, avoid flicker during refetch */}
      {isLoading && !isModalOpen && <p>Loading vehicles...</p>}
      {isError && !isModalOpen && <p className="text-red-600">Error loading vehicles: {queryError?.message}</p>}
      {/* Display submission errors separately */}
      {submissionError && <p className="text-red-600 mb-4">Operation Error: {submissionError}</p>}
      
      {!isLoading && vehicles.length === 0 && !isError && (
        <p className="text-center text-gray-500 py-4">No vehicles found.</p>
      )}

      {/* Vehicle Table (Render if not loading OR if data exists, prevents empty table flash) */}
      {(!isLoading || vehicles.length > 0) && !isError && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VIN</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate</th>
                {canManageVehicles && (
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.year || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.make || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.model || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{vehicle.vin || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{vehicle.license_plate || '-'}</td>
                  {canManageVehicles && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditVehicle(vehicle)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Integration */}
      <Modal isOpen={isModalOpen} onClose={handleCancelForm}>
        <VehicleForm 
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          initialData={editingVehicle}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default Vehicles; 