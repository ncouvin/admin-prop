import React, { useEffect, useState } from 'react';
import type { Property } from '../types';
import { propertyService } from '../services/propertyService';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { indexService } from '../services/indexService';

interface ExtendedProperty extends Property {
    hasActiveContract?: boolean;
    currentRentAmount?: number;
    rentCurrency?: 'USD' | 'ARS';
    hasUnpaidServices?: boolean;
}

const Properties: React.FC = () => {
    const [properties, setProperties] = useState<ExtendedProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const loadProperties = async () => {
            if (user) {
                try {
                    const data = await propertyService.getPropertiesByOwner(user.id);
                    
                    const enriched = await Promise.all(data.map(async (p) => {
                        let hasContract = false;
                        let currentRentAmount = 0;
                        let rentCurrency: 'USD'|'ARS' = 'USD';
                        let hasUnpaidServices = false;

                        if (p.isRented) {
                            const c = await propertyService.getActiveRentalContract(p.id);
                            if (c) {
                                hasContract = true;
                                currentRentAmount = c.rentAmount;
                                rentCurrency = c.currency;

                                if (c.updateIndex !== 'FIJO') {
                                    const start = new Date(c.startDate);
                                    const today = new Date();
                                    let m = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
                                    if (today.getDate() < start.getDate()) m--;
                                    if (m < 0) m = 0;
                                    
                                    const pPassed = Math.floor(m / c.updateFrequencyMonths);
                                    if (pPassed > 0) {
                                        const nextUpdate = new Date(start);
                                        nextUpdate.setMonth(start.getMonth() + pPassed * c.updateFrequencyMonths);
                                        try {
                                            const res = await indexService.calculateAccumulatedIndex(start, nextUpdate);
                                            currentRentAmount = currentRentAmount * (1 + (res.accumulatedPercent / 100));
                                        } catch(e) {}
                                    }
                                }
                            }
                        }

                        // Chequeo de Servicios Impagos Vencidos
                        const services = await propertyService.getPropertyServices(p.id);
                        const curYear = new Date().getFullYear();
                        const curMonth = new Date().getMonth() + 1; // 1-12
                        const curDate = new Date().getDate();

                        for (const s of services) {
                            if (s.estimatedDueDate && curDate > s.estimatedDueDate) {
                                const payments = await propertyService.getServicePayments(p.id, s.id, curYear);
                                const currentPayment = payments.find(pay => pay.month === curMonth);
                                // Si no hay pago cargado, o está pendiente sin siquiera un comprobante subido
                                if (!currentPayment || (currentPayment.status === 'pending' && !currentPayment.receiptUrl)) {
                                    hasUnpaidServices = true;
                                    break;
                                }
                            }
                        }

                        return { ...p, hasActiveContract: hasContract, currentRentAmount, rentCurrency, hasUnpaidServices };
                    }));

                    enriched.sort((a, b) => {
                        const getWeight = (p: ExtendedProperty) => {
                            if (p.isRented && !p.hasActiveContract) return 1; // Disponible para alquilar
                            if (p.isRented && p.hasActiveContract) return 2; // Alquilada
                            return 3; // Uso Personal
                        };
                        const weightA = getWeight(a);
                        const weightB = getWeight(b);
                        if (weightA !== weightB) return weightA - weightB;
                        return a.name.localeCompare(b.name);
                    });

                    setProperties(enriched);
                } catch (error) {
                    console.error("Error al cargar propiedades de Firebase:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadProperties();
    }, [user]);

    if (loading) return <div>Cargando tus propiedades...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', color: '#202124' }}>Tus Propiedades</h2>
                    <p style={{ color: '#5f6368' }}>El corazón financiero de tu sistema</p>
                </div>

                <button className="btn btn-primary" onClick={() => navigate('/properties/new')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1a73e8', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    <Plus size={20} />
                    Alta de Propiedad
                </button>
            </div>

            {properties.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', border: '2px dashed #dadce0', backgroundColor: '#f8f9fa' }}>
                    <p style={{ color: '#5f6368', marginBottom: '1.5rem', fontSize: '1.1rem' }}>No tienes ninguna propiedad dada de alta aún.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/properties/new')} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        Agregar mi primera propiedad
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {properties.map(prop => (
                        <PropertyCard 
                            key={prop.id} 
                            property={prop} 
                            hasActiveContract={prop.hasActiveContract} 
                            currentRentAmount={prop.currentRentAmount}
                            rentCurrency={prop.rentCurrency}
                            hasUnpaidServices={prop.hasUnpaidServices}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Properties;
