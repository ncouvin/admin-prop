export interface User {
    id: string; // Firebase Auth UID
    name: string;
    email: string;
}

export type PropertyType = 'apartment' | 'house' | 'garage' | 'store' | 'warehouse' | 'land' | 'ph' | 'other';

export interface Property {
    id: string; // Generado automáticamente (UUID o Firebase Doc ID)
    ownerId: string; // Ref a User.id
    name: string; // Ej: "Depto Mar del Plata"
    address: string; // Dirección completa
    type: PropertyType;
    estimatedValue: number; // Valor tentativo de compra
    currency: 'USD' | 'ARS';
    features: string; // Ej: "3 ambientes, al frente, balcón, cochera"
    images?: string[]; // Array de URLs de Cloudinary
    isRented: boolean; // Si este toggle está prendido, habilita los campos de abajo
    tenantId?: string; // ID del usuario inquilino vinculado a esta propiedad
}

// Sub-colección o parte de la Propiedad cuando isRented = true
export interface RentalContract {
    id?: string;
    propertyId: string;
    tenantId?: string; // ID del usuario inquilino
    rentAmount: number;
    currency: 'USD' | 'ARS';
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    updateFrequencyMonths: number; // Ej: cada 3, 6, 12 meses
    updateIndex: string; // Ej: "ICL", "IPC", "Fijo"
    active?: boolean;
    tenantName?: string;
    tenantEmail?: string;
    tenantPhone?: string;
}

// Qué servicios tiene enganchados esta propiedad.
export type ServiceFrequency = 'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';

export interface PropertyService {
    id: string;
    propertyId: string;
    name: string; // Ej: "Expensas", "Electricidad", "Gas", "Agua", "ABL"
    providerName?: string; // Ej: "Edenor", "Metrogas"
    accountNumber?: string; // Número de medidor o cliente
    frequency?: ServiceFrequency;
    estimatedDueDate?: number; // 1-31
}

// Cuánto se pagó, cuándo y el comprobante, por cada PropertyService, por cada mes.
export interface ServicePayment {
    id: string;
    serviceId: string; // Ref a PropertyService.id
    propertyId: string;
    year: number; // Ej: 2024
    month: number; // Ej: 1 para Enero
    status: 'paid' | 'pending';
    amount?: number;
    paymentDate?: string; // Cuando se pagó
    receiptUrl?: string; // Foto/PDF del comprobante en Firebase Storage
    invoiceUrl?: string; // Factura Original a Pagar
    isVerified?: boolean; // Confirmado por el Propietario
}

export interface PropertyExpense {
    id: string;
    propertyId: string;
    date: string; // YYYY-MM-DD
    amount: number;
    currency: 'USD' | 'ARS';
    description: string;
    receiptUrl?: string; // Por si suben factura del arreglo
}

export interface RentPayment {
    id: string;
    contractId: string;
    year: number;
    month: number;
    amount: number;
    currency: 'USD' | 'ARS';
    paymentDate: string;
    receiptUrl?: string;
    isVerified: boolean;
    tenantId?: string; // Quién lo subió
}
