export type UserRole = 'owner' | 'collaborator' | 'viewer' | 'tenant';

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    cuit: string;
    role: UserRole;
    groupId?: string; // ID del grupo al que pertenece
}

export interface Property {
    id: string;
    name: string; // Nombre identificativo (ej: "Depto Mar del Plata")
    address: Address;
    type: PropertyType;
    purchaseValue?: number;
    currency: 'USD' | 'ARS' | 'EUR';
    features: PropertyFeatures;
    ownerId: string;
    tenantId?: string; // Inquilino actual
    images: string[]; // URLs
    documents: Document[];
}

export interface Address {
    street: string;
    city: string; // Provincia/Ciudad
    country: string;
    floor?: string;
    apartment?: string;
}

export type PropertyType = 'apartment' | 'house' | 'garage' | 'store' | 'warehouse' | 'land' | 'other';

export interface PropertyFeatures {
    rooms: number;
    bathrooms: number;
    coveredArea: number;
    uncoveredArea: number;
    amenities: string[];
}

export interface Document {
    id: string;
    name: string;
    url: string;
    type: 'deed' | 'regulation' | 'contract' | 'other';
}

export interface Service {
    id: string;
    propertyId: string;
    name: string; // ABL, Expensas, Luz
    type: ServiceType;
    providerId?: string; // Nro partida/medidor
    periodicity: PaymentPeriodicity;
}

export type ServiceType = 'electricity' | 'gas' | 'water' | 'internet' | 'cable' | 'taxes' | 'expenses' | 'other';

export type PaymentPeriodicity = 'daily' | 'weekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'four_monthly' | 'semiannual' | 'annual' | 'one_time';

export interface Expense {
    id: string;
    propertyId: string;
    date: string;
    category: 'maintenance' | 'repair' | 'service' | 'tax' | 'other';
    amount: number;
    currency: 'USD' | 'ARS';
    description: string;
    receiptUrl?: string;
    isPaid: boolean;
}

export interface Income {
    id: string;
    propertyId: string;
    tenantId: string;
    date: string;
    amount: number;
    currency: 'USD' | 'ARS';
    period: string; // Ej: "Enero 2024"
    receiptUrl?: string;
    status: 'confirmed' | 'pending';
}

export interface TenantContract {
    id: string;
    propertyId: string;
    tenantId: string;
    startDate: string;
    endDate: string;
    updateFrequencyMonths: number;
    nextUpdateDate: string;
    amount: number;
    currency: 'USD' | 'ARS';
    isActive: boolean;
}
