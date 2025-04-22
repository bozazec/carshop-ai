import React from 'react';
import { Outlet } from 'react-router-dom';
import AppBar from './AppBar';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <AppBar />
      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>
      {/* Footer could go here */}
    </div>
  );
};

export default Layout; 