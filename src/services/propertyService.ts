import { collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Property, PropertyService, ServicePayment, RentalContract } from '../types';

const PROPERTIES_COLLECTION = 'properties';

export const propertyService = {
    // ---- PROPIEDADES BASE ----
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
    },

    // ---- SERVICIOS E IMPUESTOS ----
    async addServiceToProperty(propertyId: string, serviceData: Omit<PropertyService, 'id' | 'propertyId'>): Promise<string> {
        const servicesRef = collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/services`);
        const newService = { ...serviceData, propertyId };
        const docRef = await addDoc(servicesRef, newService);
        return docRef.id;
    },

    async getPropertyServices(propertyId: string): Promise<PropertyService[]> {
        const servicesRef = collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/services`);
        const snapshot = await getDocs(servicesRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropertyService));
    },

    async deleteService(propertyId: string, serviceId: string): Promise<void> {
        const docRef = doc(db, `${PROPERTIES_COLLECTION}/${propertyId}/services/${serviceId}`);
        await deleteDoc(docRef);
    },

    // ---- PAGOS MENSUALES DE SERVICIOS ----
    async saveServicePayment(propertyId: string, serviceId: string, paymentData: ServicePayment): Promise<void> {
        const paymentsRef = collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/services/${serviceId}/payments`);
        if (paymentData.id) {
            // Actualizar existente
            const docRef = doc(db, `${PROPERTIES_COLLECTION}/${propertyId}/services/${serviceId}/payments/${paymentData.id}`);
            await updateDoc(docRef, { ...paymentData });
        } else {
            // Crear nuevo
            await addDoc(paymentsRef, paymentData);
        }
    },

    async getServicePayments(propertyId: string, serviceId: string, year: number): Promise<ServicePayment[]> {
        const paymentsRef = collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/services/${serviceId}/payments`);
        const q = query(paymentsRef, where("year", "==", year));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServicePayment));
    },

    // ---- CONTRATOS DE ALQUILER ----
    async saveRentalContract(propertyId: string, contractData: Omit<RentalContract, 'propertyId'>): Promise<void> {
        const contractsRef = collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/contracts`);
        await addDoc(contractsRef, { ...contractData, propertyId, active: true, createdAt: new Date().toISOString() });
    },

    async getActiveRentalContract(propertyId: string): Promise<RentalContract | null> {
        const contractsRef = collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/contracts`);
        const q = query(contractsRef, where("active", "==", true));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as unknown as RentalContract;
        }
        return null;
    }
};
