import React, { useState, useEffect, FormEvent } from 'react';
import { Client } from '../pages/Clients'; // Import Client type

interface ClientFormProps {
  onSubmit: (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'> | Client) => Promise<void>;
  onCancel: () => void;
  initialData?: Client | null; // Pass existing client data for editing
  isSubmitting: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  onSubmit,
  onCancel,
  initialData = null,
  isSubmitting
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = !!initialData;

  // Populate form if initialData is provided (for editing)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '');
      setAddress(initialData.address || '');
    } else {
      // Reset form for creating new client
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic validation
    if (!name.trim()) {
      setFormError('Client name is required.');
      return;
    }

    const clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'> | Client = {
      ...(isEditing && initialData ? { id: initialData.id } : {}), // Include ID if editing
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      // Add/modify fields based on your exact Client type needs
      ...(isEditing && initialData ? { created_at: initialData.created_at, updated_at: initialData.updated_at } : {}),
    };

    try {
      await onSubmit(clientData as any); // Type assertion needed due to conditional id
    } catch (error: any) {
      console.error('Error submitting client form:', error);
      setFormError(error.message || 'Failed to save client.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-white shadow-sm">
      <h2 className="text-lg font-medium">{isEditing ? 'Edit Client' : 'Add New Client'}</h2>
      
      {formError && <p className="text-red-600 text-sm">Error: {formError}</p>}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel" // Use tel type for phone numbers
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
        <textarea
          id="address"
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button" // Important: type="button" to prevent form submission
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Client' : 'Add Client')}
        </button>
      </div>
    </form>
  );
};

export default ClientForm; 