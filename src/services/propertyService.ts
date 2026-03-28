import { collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Property } from '../types';

const PROPERTIES_COLLECTION = 'properties';

export const propertyService = {
    async createProperty(propertyData: Omit<Property, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, PROPERTIES_COLLECTION), propertyData);
        return docRef.id;
    },

    async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
        const q = query(
            collection(db, PROPERTIES_COLLECTION),
            where("ownerId", "==", ownerId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Property));
    },

    async getProperty(id: string): Promise<Property | null> {
        const docRef = doc(db, PROPERTIES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Property;
        }
        return null;
    },

    async updateProperty(id: string, propertyData: Partial<Property>): Promise<void> {
        const docRef = doc(db, PROPERTIES_COLLECTION, id);
        await updateDoc(docRef, propertyData);
    },

    async deleteProperty(id: string): Promise<void> {
        const docRef = doc(db, PROPERTIES_COLLECTION, id);
        await deleteDoc(docRef);
    }
};
