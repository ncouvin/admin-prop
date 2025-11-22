import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { mockService } from '../services/mockData';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
    user: User | null;
    login: (email: string, password?: string) => Promise<boolean>;
    loginWithGoogle: () => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // Map Firebase user to our app user
                // In a real app, you'd fetch additional user data from your DB here
                const appUser: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'Usuario',
                    email: firebaseUser.email || '',
                    phone: firebaseUser.phoneNumber || '',
                    cuit: '',
                    role: 'owner', // Default role
                    groupId: 'group-' + firebaseUser.uid
                };
                setUser(appUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password?: string): Promise<boolean> => {
        try {
            if (password) {
                await signInWithEmailAndPassword(auth, email, password);
                return true;
            } else {
                // Fallback to mock login if no password provided (for legacy support during migration)
                const mockUser = mockService.login(email);
                if (mockUser) {
                    setUser(mockUser);
                    return true;
                }
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            localStorage.removeItem('admin_prop_active_user');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const loginWithGoogle = async (): Promise<void> => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, isAuthenticated: !!user }}>
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
