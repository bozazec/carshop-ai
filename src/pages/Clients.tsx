import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ClientForm from '../components/ClientForm';
import Modal from '../components/Modal';

// Define the structure of the Client data based on your Supabase table
export interface Client {
  id: string; // UUID
  created_at: string;
  updated_at: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { role } = useAuth();

  console.log('[Clients] Component Rendered. Initial Loading:', loading, 'Role:', role);

  // Function to fetch clients (memoized with useCallback)
  const fetchClients = useCallback(async () => {
    console.log('[Clients] fetchClients called.');
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      console.log('[Clients] Supabase fetch response:', { data, fetchError });

      if (fetchError) throw fetchError;
      
      setClients(data || []);
      console.log('[Clients] fetchClients success. Clients count:', (data || []).length);
    } catch (err: any) {
      console.error('[Clients] Error fetching clients:', err);
      setError(err.message || 'Failed to fetch clients. Please try again.');
    } finally {
      console.log('[Clients] fetchClients finally block. Setting loading false.');
      setLoading(false);
    }
  }, []); // Empty dependency array means this function instance doesn't change

  // Fetch clients on component mount
  useEffect(() => {
    console.log('[Clients] useEffect running.');
    fetchClients();
  }, [fetchClients]); // Depend on the memoized fetchClients function

  // Determine if the current user has write permissions (Admin or Advisor)
  const canManageClients = role === 'admin' || role === 'service_advisor';

  // --- CRUD Handlers ---
  const handleAddClient = () => {
    setEditingClient(null); // Ensure we are in create mode
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }
    setLoading(true); // Use main loading state or a specific delete loading state
    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (deleteError) throw deleteError;
      
      // Refresh client list after delete
      // Option 1: Refetch all
      await fetchClients(); 
      // Option 2: Remove from state locally (faster UI, but less robust)
      // setClients(prevClients => prevClients.filter(c => c.id !== clientId));

    } catch (err: any) {
      console.error('Error deleting client:', err);
      setError(err.message || 'Failed to delete client.');
      setLoading(false); // Ensure loading resets on error
    }
    // setLoading(false); // fetchClients will handle setting loading to false
  };

  const handleFormSubmit = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'> | Client) => {
    setIsSubmitting(true);
    setError(null);
    try {
      let error: any;
      if (editingClient) {
        // Update existing client
        const { error: updateError } = await supabase
          .from('clients')
          .update(clientData as Partial<Client>) // Pass only changed fields potentially
          .eq('id', editingClient.id);
        error = updateError;
      } else {
        // Create new client
        // We need to omit id, created_at, updated_at potentially, depending on form data structure
        const { id, created_at, updated_at, ...insertData } = clientData as Client;
        const { error: insertError } = await supabase
          .from('clients')
          .insert(insertData);
        error = insertError;
      }

      if (error) throw error;
      
      setIsModalOpen(false); // Close modal on success
      await fetchClients(); // Refetch clients to show the new/updated one
    } catch (err: any) {
      console.error('Error saving client:', err);
      setError(err.message || 'Failed to save client.');
      // Keep modal open on error so user can see the issue/retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setError(null); // Clear form-related errors on cancel
  };

  console.log('[Clients] Returning JSX. Loading:', loading, 'Error:', error, 'Clients Count:', clients.length);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Clients Management</h1>
        {canManageClients && (
          <button
            onClick={handleAddClient}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add New Client
          </button>
        )}
      </div>

      {loading && !isModalOpen && <p>Loading clients...</p>}
      {error && !isModalOpen && <p className="text-red-600">Error: {error}</p>}

      {!loading && clients.length === 0 && !error && (
        <p className="text-center text-gray-500 py-4">No clients found.</p>
      )}

      {(!loading || clients.length > 0) && !error && (
        <div className="bg-white shadow overflow-x-auto sm:rounded-lg pb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                {canManageClients && (
                   <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.address || '-'}</td>
                    {canManageClients && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditClient(client)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
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

      <Modal isOpen={isModalOpen} onClose={handleCancelForm}>
        <ClientForm 
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          initialData={editingClient}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default Clients; 