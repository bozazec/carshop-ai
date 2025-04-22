import React from 'react';
import AppBar from './AppBar';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <AppBar />
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      {/* Footer could go here */}
    </div>
  );
};

export default Layout; 