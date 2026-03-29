import { collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, collectionGroup, orderBy, onSnapshot, or } from 'firebase/firestore';
import { db } from './firebase';
import type { Property, PropertyService, ServicePayment, RentalContract, PropertyExpense, RentPayment, ContractMessage } from '../types';

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
            or(
                where("ownerId", "==", ownerId),
                where("coOwnerIds", "array-contains", ownerId)
            )
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Property));
    },

    async getRentingProperties(tenantId: string): Promise<Property[]> {
        const q = query(
            collection(db, PROPERTIES_COLLECTION),
            where("tenantId", "==", tenantId)
        );
        const snp = await getDocs(q);
        return snp.docs.map(doc => ({ ...doc.data(), id: doc.id } as Property));
    },

    async getProperty(id: string): Promise<Property | null> {
        const docRef = doc(db, PROPERTIES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as Property;
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
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PropertyService));
    },

    async updateService(propertyId: string, serviceId: string, serviceData: Partial<PropertyService>): Promise<void> {
        const docRef = doc(db, `${PROPERTIES_COLLECTION}/${propertyId}/services/${serviceId}`);
        await updateDoc(docRef, serviceData);
    },

    async deleteService(propertyId: string, serviceId: string): Promise<void> {
        const docRef = doc(db, `${PROPERTIES_COLLECTION}/${propertyId}/services/${serviceId}`);
        await deleteDoc(docRef);
    },

    // ---- PAGOS MENSUALES DE SERVICIOS ----
    async saveServicePayment(propertyId: string, serviceId: string, paymentData: ServicePayment): Promise<void> {
        const payload = { ...paymentData } as any;
        if (!payload.id) delete payload.id; // delete empty strings

        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined) delete payload[key];
        });

        const paymentsRef = collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/services/${serviceId}/payments`);
        if (paymentData.id) {
            // Actualizar existente
            const docRef = doc(db, `${PROPERTIES_COLLECTION}/${propertyId}/services/${serviceId}/payments/${paymentData.id}`);
            await updateDoc(docRef, payload);
        } else {
            // Crear nuevo
            await addDoc(paymentsRef, payload);
        }
    },

    async getServicePayments(propertyId: string, serviceId: string, year: number): Promise<ServicePayment[]> {
        const paymentsRef = collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/services/${serviceId}/payments`);
        const q = query(paymentsRef, where("year", "==", year));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ServicePayment));
    },

    async deleteServicePayment(propertyId: string, serviceId: string, paymentId: string): Promise<void> {
        const docRef = doc(db, `${PROPERTIES_COLLECTION}/${propertyId}/services/${serviceId}/payments/${paymentId}`);
        await deleteDoc(docRef);
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
            return { ...doc.data(), id: doc.id } as unknown as RentalContract;
        }
        return null;
    },

    async updateRentalContract(propertyId: string, contractId: string, data: Partial<RentalContract>): Promise<void> {
        const docRef = doc(db, `${PROPERTIES_COLLECTION}/${propertyId}/contracts/${contractId}`);
        await updateDoc(docRef, data);
    },

    async getAllRentalContracts(propertyId: string): Promise<RentalContract[]> {
        const contractsRef = collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/contracts`);
        const snapshot = await getDocs(contractsRef);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as RentalContract));
    },

    async linkTenantToContract(contractId: string, tenantId: string): Promise<boolean> {
        // En Firestore nativo no es fácil buscar documentos subcolección por ID global 
        // sin CollectionGroup queries, hacemos CollectionGroup
        const q = query(collectionGroup(db, 'contracts'));
        const snp = await getDocs(q);
        
        let foundContractDoc: any = null;
        let propertyId: string | null = null;

        snp.forEach(d => {
            if (d.id === contractId) {
                foundContractDoc = d;
                propertyId = d.ref.parent.parent?.id || null; // el path es properties/{id}/contracts
            }
        });

        if (foundContractDoc && propertyId) {
            // Actualizar contrato
            await updateDoc(foundContractDoc.ref, { tenantId });
            // Actualizar Propiedad principal asi es ultra rápido de buscar para el Inquilino
            await updateDoc(doc(db, PROPERTIES_COLLECTION, propertyId), { tenantId });
            return true;
        }
        return false;
    },

    async linkCoOwnerToProperty(propertyId: string, coOwnerId: string): Promise<boolean> {
        const p = await this.getProperty(propertyId);
        if (!p) return false;
        if (p.ownerId === coOwnerId) return true; // Already owner
        const currentCoOwners = p.coOwnerIds || [];
        if (currentCoOwners.includes(coOwnerId)) return true; // Already joined
        
        await updateDoc(doc(db, PROPERTIES_COLLECTION, propertyId), {
            coOwnerIds: [...currentCoOwners, coOwnerId]
        });
        return true;
    },

    async transferPropertyControl(propertyId: string, currentOwnerId: string, newOwnerId: string): Promise<void> {
        const p = await this.getProperty(propertyId);
        if (!p) return;
        const newCoOwners = (p.coOwnerIds || []).filter(id => id !== newOwnerId);
        newCoOwners.push(currentOwnerId); // Old owner becomes co-owner

        await updateDoc(doc(db, PROPERTIES_COLLECTION, propertyId), {
            ownerId: newOwnerId,
            coOwnerIds: newCoOwners,
            transferControlRequestTo: null
        });
    },

    // ---- GASTOS Y ARREGLOS ----
    async addExpense(propertyId: string, expenseData: Omit<PropertyExpense, 'id' | 'propertyId'>): Promise<string> {
        const docRef = await addDoc(collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/expenses`), {
            ...expenseData,
            propertyId
        });
        return docRef.id;
    },

    async getExpenses(propertyId: string): Promise<PropertyExpense[]> {
        const q = query(collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/expenses`));
        const snp = await getDocs(q);
        return snp.docs.map(d => ({ id: d.id, ...d.data() } as PropertyExpense));
    },

    async updateExpense(propertyId: string, expenseId: string, data: Partial<PropertyExpense>): Promise<void> {
        const docRef = doc(db, `${PROPERTIES_COLLECTION}/${propertyId}/expenses/${expenseId}`);
        await updateDoc(docRef, data as any);
    },

    async deleteExpense(propertyId: string, expenseId: string): Promise<void> {
        const docRef = doc(db, `${PROPERTIES_COLLECTION}/${propertyId}/expenses/${expenseId}`);
        await deleteDoc(docRef);
    },

    // ---- PAGOS CUBIERTOS DEL ALQUILER ----
    async addRentPayment(propertyId: string, contractId: string, paymentData: Omit<RentPayment, 'id' | 'contractId'>): Promise<string> {
        const docRef = await addDoc(collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/contracts/${contractId}/payments`), {
            ...paymentData,
            contractId
        });
        return docRef.id;
    },

    async getRentPayments(propertyId: string, contractId: string): Promise<RentPayment[]> {
        const q = query(collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/contracts/${contractId}/payments`));
        const snp = await getDocs(q);
        return snp.docs.map(d => ({ id: d.id, ...d.data() } as RentPayment));
    },

    async updateRentPayment(propertyId: string, contractId: string, paymentId: string, data: Partial<RentPayment>): Promise<void> {
        const docRef = doc(db, `${PROPERTIES_COLLECTION}/${propertyId}/contracts/${contractId}/payments/${paymentId}`);
        await updateDoc(docRef, data);
    },

    async deleteRentPayment(propertyId: string, contractId: string, paymentId: string): Promise<void> {
        const docRef = doc(db, `${PROPERTIES_COLLECTION}/${propertyId}/contracts/${contractId}/payments/${paymentId}`);
        await deleteDoc(docRef);
    },

    // ==========================================
    // MESSAGES
    // ==========================================
    subscribeToContractMessages(propertyId: string, contractId: string, callback: (messages: ContractMessage[]) => void) {
        const q = query(
            collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/contracts/${contractId}/messages`),
            orderBy("createdAt", "asc")
        );
        return onSnapshot(q, (snapshot) => {
            const msgs: ContractMessage[] = [];
            snapshot.forEach(docSnap => {
                msgs.push({ id: docSnap.id, ...docSnap.data() } as ContractMessage);
            });
            callback(msgs);
        });
    },

    async sendContractMessage(propertyId: string, contractId: string, data: Omit<ContractMessage, 'id' | 'propertyId' | 'contractId' | 'createdAt'>): Promise<void> {
        const msgRef = collection(db, `${PROPERTIES_COLLECTION}/${propertyId}/contracts/${contractId}/messages`);
        await addDoc(msgRef, {
            ...data,
            propertyId,
            contractId,
            createdAt: new Date().toISOString()
        });
    },

    async getUserContractsWithChats(userId: string): Promise<{ property: Property, contract: RentalContract, lastMessage?: ContractMessage }[]> {
        const owned = await this.getPropertiesByOwner(userId);
        const rented = await this.getRentingProperties(userId);
        
        const allPropsMap = new Map<string, Property>();
        owned.forEach(p => allPropsMap.set(p.id, p));
        rented.forEach(p => allPropsMap.set(p.id, p));
        
        const allProps = Array.from(allPropsMap.values());
        const results = [];
        
        for (const prop of allProps) {
            const contract = await this.getActiveRentalContract(prop.id);
            if (contract) {
                const qMsg = query(
                    collection(db, `${PROPERTIES_COLLECTION}/${prop.id}/contracts/${contract.id}/messages`),
                    orderBy("createdAt", "asc")
                );
                const msgSnap = await getDocs(qMsg);
                let lastMessage: ContractMessage | undefined;
                if (!msgSnap.empty) {
                    lastMessage = { id: msgSnap.docs[msgSnap.docs.length - 1].id, ...msgSnap.docs[msgSnap.docs.length - 1].data() } as ContractMessage;
                }
                results.push({ property: prop, contract, lastMessage });
            }
        }
        
        return results;
    }
};
