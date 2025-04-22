import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AppBar: React.FC = () => {
  const { user, signOut } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/clients', label: 'Clients' },
    { path: '/vehicles', label: 'Vehicles' },
    { path: '/inventory', label: 'Inventory' },
    { path: '/services', label: 'Services' },
    { path: '/reminders', label: 'Reminders' },
  ];

  const activeClassName = "bg-gray-900 text-white";
  const inactiveClassName = "text-gray-300 hover:bg-gray-700 hover:text-white";

  return (
    <nav className="bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-white font-semibold text-xl mr-4">Car Shop</span>
            {user && (
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium ${
                          isActive ? activeClassName : inactiveClassName
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>

          {user && (
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <span className="text-gray-400 mr-4 text-sm">{user.email}</span>
                <button
                  onClick={signOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AppBar; 