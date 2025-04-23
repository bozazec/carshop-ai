import React, { useState, Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, Transition, Menu } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const AppBar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const mobileActiveClassName = "bg-gray-700 text-white"; // Slightly different for mobile clarity
  const mobileInactiveClassName = "text-gray-300 hover:bg-gray-700 hover:text-white";

  // Helper function to render nav links for reuse
  const renderNavLinks = (isMobile: boolean) => {
    const linkBaseClass = isMobile
      ? 'block px-3 py-2 rounded-md text-base font-medium'
      : 'px-3 py-2 rounded-md text-sm font-medium';
    const activeClass = isMobile ? mobileActiveClassName : activeClassName;
    const inactiveClass = isMobile ? mobileInactiveClassName : inactiveClassName;

    return navItems.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => isMobile && setMobileMenuOpen(false)} // Close mobile menu on click
        className={({ isActive }) =>
          `${linkBaseClass} ${isActive ? activeClass : inactiveClass}`
        }
      >
        {item.label}
      </NavLink>
    ));
  };

  return (
    <>
      <nav className="bg-gray-800 fixed w-full z-10 top-0 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section: Hamburger & Logo/Title & Desktop Nav */} 
            <div className="flex items-center">
              {/* Hamburger Button (Mobile) */} 
              <div className="flex items-center md:hidden">
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  aria-controls="mobile-menu"
                  aria-expanded={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <span className="sr-only">Open main menu</span>
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Logo/Title */} 
              <div className="flex-shrink-0 ml-3 md:ml-0">
                {/* Optional: Replace text with an actual logo image */}
                <span className="text-white font-semibold text-xl">Car Shop</span>
              </div>

              {/* Desktop Navigation Links */} 
              {user && (
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {renderNavLinks(false)}
                  </div>
                </div>
              )}
            </div>

            {/* Right Section: User Menu (Desktop) */} 
            {user && (
              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="sr-only">Open user menu</span>
                        <UserCircleIcon className="h-8 w-8 rounded-full text-gray-400 hover:text-white" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {profile?.full_name && (
                           <Menu.Item disabled>
                              <span className="block px-4 py-2 text-sm text-gray-700 border-b">{profile.full_name}</span>
                           </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={signOut}
                              className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                            >
                              Logout
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            )}

            {/* Placeholder for Mobile Right side if needed, currently empty */} 
            <div className="-mr-2 flex md:hidden">
              {/* Could add a user icon here for mobile too if desired */} 
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu (Drawer/Dialog) */} 
      <Transition.Root show={mobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setMobileMenuOpen}>
          {/* Overlay */} 
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            {/* Drawer Panel */} 
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-gray-800 pt-5 pb-4">
                {/* Close Button */} 
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>

                {/* Mobile Menu Content */} 
                <div className="flex flex-shrink-0 items-center px-4">
                   <span className="text-white font-semibold text-xl">Car Shop</span>
                </div>
                <div className="mt-5 h-0 flex-1 overflow-y-auto">
                  <nav className="space-y-1 px-2">
                    {renderNavLinks(true)}
                    <hr className="border-gray-700 my-4" />
                    {/* Add Logout to mobile menu */} 
                    {user && (
                      <button 
                         onClick={async () => {
                           await signOut();
                           setMobileMenuOpen(false);
                         }}
                         className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${mobileInactiveClassName}`}
                      >
                        Logout
                      </button>
                    )}
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            {/* Dummy element to force sidebar to shrink to fit close icon */} 
            <div className="w-14 flex-shrink-0" aria-hidden="true"></div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default AppBar; 