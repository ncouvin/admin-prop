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
}

// Sub-colección o parte de la Propiedad cuando isRented = true
export interface RentalContract {
    propertyId: string;
    rentAmount: number;
    currency: 'USD' | 'ARS';
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    updateFrequencyMonths: number; // Ej: cada 3, 6, 12 meses
    updateIndex: string; // Ej: "ICL", "IPC", "Fijo"
}

// Qué servicios tiene enganchados esta propiedad.
export interface PropertyService {
    id: string;
    propertyId: string;
    name: string; // Ej: "Expensas", "Electricidad", "Gas", "Agua", "ABL"
    providerName?: string; // Ej: "Edenor", "Metrogas"
    accountNumber?: string; // Número de medidor o cliente
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
}
