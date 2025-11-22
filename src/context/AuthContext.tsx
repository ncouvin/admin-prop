import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { mockService } from '../services/mockData';

interface AuthContextType {
    user: User | null;
    login: (email: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check local storage for active session (simplified)
        const storedUser = localStorage.getItem('admin_prop_active_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('admin_prop_active_user');
            }
        }
    }, []);

    const login = async (email: string): Promise<boolean> => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        const foundUser = mockService.login(email);
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('admin_prop_active_user', JSON.stringify(foundUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('admin_prop_active_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
