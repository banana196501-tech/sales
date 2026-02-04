import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/sales';
import { db } from '@/lib/database';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  refreshUsers: () => Promise<void>;
  updateProfile: (updates: { name?: string; email?: string; avatar?: string }) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load users from database
  const loadUsers = async () => {
    try {
      const fetchedUsers = await db.users.getAll();
      setUsers(fetchedUsers);
      return fetchedUsers;
    } catch (error) {
      console.error('Failed to load users:', error);
      return [];
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // Load users from database
      const fetchedUsers = await loadUsers();

      // Check for existing session
      const storedUser = localStorage.getItem('salesapp_user');
      const storedToken = localStorage.getItem('salesapp_token');

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Verify user still exists in database
          const dbUser = fetchedUsers.find(u => u.id === parsedUser.id);
          if (dbUser) {
            setUser(dbUser);
          } else {
            localStorage.removeItem('salesapp_user');
            localStorage.removeItem('salesapp_token');
          }
        } catch (e) {
          localStorage.removeItem('salesapp_user');
          localStorage.removeItem('salesapp_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const refreshUsers = async () => {
    await loadUsers();
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Find user in database
      const foundUser = await db.users.getByEmail(email);

      const isValidPassword = foundUser && (
        foundUser.password
          ? foundUser.password === password
          : password.length >= 4
      );

      if (foundUser && isValidPassword) {
        // Generate mock JWT token
        const mockToken = btoa(JSON.stringify({ userId: foundUser.id, exp: Date.now() + 86400000 }));

        localStorage.setItem('salesapp_user', JSON.stringify(foundUser));
        localStorage.setItem('salesapp_token', mockToken);
        setUser(foundUser);
        setIsLoading(false);

        toast({
          title: 'Welcome back!',
          description: `Logged in as ${foundUser.name}`,
        });

        return true;
      }

      setIsLoading(false);
      toast({
        title: 'Login failed',
        description: 'Invalid email or password',
        variant: 'destructive',
      });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      toast({
        title: 'Login failed',
        description: 'An error occurred during login',
        variant: 'destructive',
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('salesapp_user');
    localStorage.removeItem('salesapp_token');
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const updateProfile = async (updates: { name?: string; email?: string; avatar?: string }) => {
    if (!user) return;
    try {
      const updatedUser = await db.users.update(user.id, updates);
      setUser(updatedUser);
      localStorage.setItem('salesapp_user', JSON.stringify(updatedUser));
      toast({ title: 'Profile updated', description: 'Your profile has been updated successfully.' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
      throw error;
    }
  };

  const updatePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) return;

    // In a real app, we would verify oldPassword hash. 
    // Here we check against stored password if it exists.
    if (user.password && user.password !== oldPassword) {
      throw new Error('Current password incorrect');
    }

    try {
      const updatedUser = await db.users.update(user.id, { password: newPassword });
      setUser(updatedUser);
      localStorage.setItem('salesapp_user', JSON.stringify(updatedUser));
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
    } catch (error) {
      console.error('Failed to update password:', error);
      toast({ title: 'Error', description: 'Failed to update password', variant: 'destructive' });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        refreshUsers,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
