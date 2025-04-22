import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

// Define the structure of the profile data we expect from the 'profiles' table
// Ensure this matches the columns in your Supabase 'profiles' table
export interface UserProfile {
  id: string; // UUID, matches auth.users.id
  role: 'admin' | 'service_advisor' | 'mechanic' | 'inventory_clerk'; // Use the ENUM type defined in SQL
  full_name?: string;
  // Add other profile fields as needed
}

// Define the shape of the context data
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null; // Add profile state
  role: UserProfile['role'] | null; // Convenience access to role
  loading: boolean;
  signOut: () => Promise<void>;
}

// Create the context with a default undefined value initially
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null); // Add profile state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const fetchProfile = async (userId: string) => {
      try {
        // Restore original profile fetch logic
        const { data, error, status } = await supabase
          .from('profiles')
          .select(`id, role, full_name`)
          .eq('id', userId)
          .single(); // <-- Restore .single()
        

        if (error && status !== 406) {
          // 406 status means no rows found, which is fine if profile not created yet
          setProfile(null); 
        } else if (data) {
          setProfile(data as UserProfile);
        } else {
          // No data found (status 406 or null data)
          setProfile(null);
        }
      } catch (error) {
        console.error('[AuthProvider] EXCEPTION during profile fetch:', error);
        setProfile(null);
      } finally {
        setLoading(false); 
      }
    };


    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setSession(session);
        setUser(currentUser);
        // Only fetch profile on SIGNED_IN event from listener for now
        if (_event === 'SIGNED_IN' && currentUser) {
          setLoading(true); // Set loading true before profile fetch
          fetchProfile(currentUser.id); // fetchProfile still sets loading false in its finally
        } else if (!currentUser) {
          setProfile(null);
          setLoading(false); // Ensure loading is false if not fetching profile
        } else {
          // Handle other events if needed, ensure loading becomes false
          setLoading(false);
        }
      }
    );

    // Cleanup listener
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Keep dependency array empty

  // Sign out function
  const signOut = async () => {
    setLoading(true); // Indicate loading state
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      setLoading(false); // Stop loading on error
    } else {
      // Profile state will be cleared by the onAuthStateChange listener
      // Loading will be set to false by the onAuthStateChange listener after profile fetch/clear
    }
  };

  const value = {
    session,
    user,
    profile,
    role: profile?.role ?? null, // Get role from profile
    loading,
    signOut,
  };

  // Don't render children until loading is false
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 