import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface AppUser {
    id: string;
    email: string;
    name: string;
    maxProperties: number;
    purchasedSlots: number;
    createdAt: string;
}

const USERS_COLLECTION = 'users';

export const userService = {
    async getOrCreateUser(firebaseUser: any): Promise<AppUser> {
        const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() } as AppUser;
        } else {
            // New User Registration
            const newUser: AppUser = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'Propietario',
                maxProperties: firebaseUser.email === 'ncouvin@gmail.com' ? 9999 : 2, // Súper Admin tiene límite infinito
                purchasedSlots: 0,
                createdAt: new Date().toISOString()
            };
            
            await setDoc(userRef, newUser);
            return newUser;
        }
    },

    async getUser(userId: string): Promise<AppUser | null> {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() } as AppUser;
        }
        return null;
    },

    async incrementPurchasedSlots(userId: string, additionalSlots: number): Promise<void> {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data() as AppUser;
            await setDoc(userRef, {
                maxProperties: data.maxProperties + additionalSlots,
                purchasedSlots: (data.purchasedSlots || 0) + additionalSlots
            }, { merge: true });
        }
    }
};
