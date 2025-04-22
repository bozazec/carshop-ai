import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string; // Optional title for the modal
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    // Backdrop
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4"
      onClick={onClose} // Close modal on backdrop click
    >
      {/* Modal Content */}
      <div 
        className="relative bg-white w-full max-w-md mx-auto p-6 rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside content
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Optional Title */}
        {title && (
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{title}</h3>
        )}

        {/* Modal Body */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 