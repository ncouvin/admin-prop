import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import { indexService } from '../services/indexService';
import type { Property } from '../types';
import PropertyCard from '../components/PropertyCard';
import { Key, Search } from 'lucide-react';

interface ExtendedProperty extends Property {
    currentRentAmount?: number;
    rentCurrency?: 'USD' | 'ARS';
    hasUnpaidServices?: boolean;
}

const TenantProperties: React.FC = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<ExtendedProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [linking, setLinking] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const loadRentedProperties = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const props = await propertyService.getRentingProperties(user.id);
            
            const enriched = await Promise.all(props.map(async (p) => {
                let currentRentAmount = 0;
                let rentCurrency: 'USD'|'ARS' = 'USD';
                let hasUnpaidServices = false;

                const c = await propertyService.getActiveRentalContract(p.id);
                if (c) {
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

                const services = await propertyService.getPropertyServices(p.id);
                const curYear = new Date().getFullYear();
                const curMonth = new Date().getMonth() + 1;
                const curDate = new Date().getDate();

                for (const s of services) {
                    if (s.estimatedDueDate && curDate > s.estimatedDueDate) {
                        const payments = await propertyService.getServicePayments(p.id, s.id, curYear);
                        const currentPayment = payments.find(pay => pay.month === curMonth);
                        if (!currentPayment || (currentPayment.status === 'pending' && !currentPayment.receiptUrl)) {
                            hasUnpaidServices = true;
                            break;
                        }
                    }
                }

                return { ...p, currentRentAmount, rentCurrency, hasUnpaidServices };
            }));

            setProperties(enriched);
        } catch (error) {
            console.error("Error fetching rented properties", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRentedProperties();
    }, [user]);

    const handleLinkContract = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = window.prompt("Ingresa el ID de Contrato que te pasó el propietario:");
        if (!code || !code.trim()) return;

        setLinking(true);
        try {
            const success = await propertyService.linkTenantToContract(code.trim(), user!.id);
            if (success) {
                alert("¡Propiedad vinculada exitosamente!");
                await loadRentedProperties();
            } else {
                alert("ID de contrato no encontrado o inválido. Revisa el código con el propietario.");
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al intentar vincular.");
        } finally {
            setLinking(false);
        }
    };

    const filteredProperties = properties.filter(p => {
        const term = searchTerm.toLowerCase();
        return !term || p.name.toLowerCase().includes(term) || p.address.toLowerCase().includes(term);
    });

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#202124', margin: 0 }}>Propiedades Alquiladas por Mí</h1>
                <button onClick={handleLinkContract} disabled={linking} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Key size={18} />
                    {linking ? 'Vinculando...' : 'Vincular nuevo alquiler'}
                </button>
            </div>

            <div className="card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} color="#9aa0a6" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text" 
                        className="input" 
                        placeholder="Buscar por calle, barrio, nombre..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.5rem', width: '100%', margin: 0 }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#5f6368' }}>Cargando tus alquileres...</div>
            ) : properties.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#9aa0a6' }}>
                    <Key size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '1.2rem', color: '#5f6368' }}>Aún no tienes propiedades alquiladas vinculadas.</p>
                    <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>Pídele al propietario el <strong>ID de Vinculación del Contrato</strong> y haz clic en el botón superior derecho.</p>
                </div>
            ) : filteredProperties.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#5f6368', fontSize: '1.1rem' }}>
                    No se encontraron alquileres que coincidan con tu búsqueda.
                </div>
            ) : (
                <div className="grid">
                    {filteredProperties.map(property => (
                        <PropertyCard 
                            key={property.id} 
                            property={property} 
                            hasActiveContract={true} 
                            currentRentAmount={property.currentRentAmount}
                            rentCurrency={property.rentCurrency}
                            hasUnpaidServices={property.hasUnpaidServices}
                            isTenantView={true}
                        /> 
                    ))}
                </div>
            )}
        </div>
    );
};

export default TenantProperties;
