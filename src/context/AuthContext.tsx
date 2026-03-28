import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
    user: User | null;
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
                const appUser: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'Propietario',
                    email: firebaseUser.email || ''
                };
                setUser(appUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
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
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#666' }}>Cargando administrador...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, loginWithGoogle, logout, isAuthenticated: !!user }}>
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
