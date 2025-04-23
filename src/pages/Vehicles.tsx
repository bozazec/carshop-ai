import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import VehicleForm from '../components/VehicleForm'; // Import the form
import Modal from '../components/Modal'; // Import the modal

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

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for modal/form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Optional: Add state for clients list if using client dropdown
  // const [clients, setClients] = useState<Client[]>([]); 

  const { role } = useAuth(); // For permission checks

  // Fetch vehicles function 
  const fetchVehicles = useCallback(async () => {
    console.log('[Vehicles] fetchVehicles called.');
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('vehicles')
        .select('*') 
        .order('make', { ascending: true })
        .order('model', { ascending: true });

      if (fetchError) throw fetchError;

      setVehicles(data || []);
    } catch (err: any) {
      console.error('[Vehicles] Error fetching vehicles:', err);
      setError(err.message || 'Failed to fetch vehicles.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchVehicles();
    // Optional: Fetch clients if needed for dropdown
    // fetchClientsForDropdown(); 
  }, [fetchVehicles]);

  const canManageVehicles = role === 'admin' || role === 'service_advisor';

  // --- CRUD Handlers ---
  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    // Consider adding specific loading state for delete button
    try {
      const { error: deleteError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (deleteError) throw deleteError;
      
      await fetchVehicles(); // Refetch after delete
    } catch (err: any) {
      console.error('Error deleting vehicle:', err);
      setError(err.message || 'Failed to delete vehicle.');
    }
  };

  const handleFormSubmit = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'> | Vehicle) => {
    setIsSubmitting(true);
    setError(null); // Clear previous errors
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
      await fetchVehicles(); // Refetch list
    } catch (err: any) {
      console.error('Error saving vehicle:', err);
      // Display error within the form ideally, but set general error for now
      setError(err.message || 'Failed to save vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    setError(null); // Clear potential submission errors
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
          >
            Add New Vehicle
          </button>
        )}
      </div>

      {/* Loading/Error Messages */}
      {loading && !isModalOpen && <p>Loading vehicles...</p>}
      {error && !isModalOpen && <p className="text-red-600">Error: {error}</p>}
      {!loading && vehicles.length === 0 && !error && (
        <p className="text-center text-gray-500 py-4">No vehicles found.</p>
      )}

      {/* Vehicle Table */} 
      {(!loading || vehicles.length > 0) && !error && (
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
          // Pass clients list if using dropdown: clients={clients}
        />
      </Modal>
    </div>
  );
};

export default Vehicles; 