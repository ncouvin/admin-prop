import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import type { Property, RentalContract } from '../types';
import { Home, FileText, BadgeDollarSign } from 'lucide-react';
import { indexService } from '../services/indexService';

interface ExtendedProperty extends Property {
    activeContract?: RentalContract | null;
    estimatedRent?: number;
}

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<ExtendedProperty[]>([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        totalArs: 0,
        totalUsd: 0,
        rented: 0,
        available: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            
            try {
                // 1. Fetch properties
                const userProperties = await propertyService.getPropertiesByOwner(user.id);
                
                // 2. Resolve active contracts and simulate current exact rent
                let sumArs = 0;
                let sumUsd = 0;
                let rentedCount = 0;

                const enrichedProps = await Promise.all(userProperties.map(async (prop) => {
                    let activeContract = null;
                    let currentRent = 0;

                    if (prop.isRented) {
                        activeContract = await propertyService.getActiveRentalContract(prop.id);
                        if (activeContract) {
                            rentedCount++;
                            currentRent = activeContract.rentAmount;
                            
                            // Si tiene ajuste, simular el último monto si ya pasó tiempo
                            if (activeContract.updateIndex !== 'FIJO') {
                                const start = new Date(activeContract.startDate);
                                const today = new Date();
                                let m = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
                                if (today.getDate() < start.getDate()) m--;
                                if (m < 0) m = 0;
                                
                                const pPassed = Math.floor(m / activeContract.updateFrequencyMonths);
                                if (pPassed > 0) {
                                    const nextUpdate = new Date(start);
                                    nextUpdate.setMonth(start.getMonth() + pPassed * activeContract.updateFrequencyMonths);
                                    // Calc historical to today
                                    try {
                                        const res = await indexService.calculateAccumulatedIndex(start, nextUpdate);
                                        currentRent = currentRent * (1 + (res.accumulatedPercent / 100));
                                    } catch(e) {}
                                }
                            }

                            if (activeContract.currency === 'ARS') sumArs += currentRent;
                            else sumUsd += currentRent;
                        }
                    }

                    return {
                        ...prop,
                        activeContract,
                        estimatedRent: currentRent
                    };
                }));

                setProperties(enrichedProps);
                setStats({
                    totalArs: sumArs,
                    totalUsd: sumUsd,
                    rented: rentedCount,
                    available: userProperties.length - rentedCount
                });

            } catch (error) {
                console.error("Error building dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div style={{ color: '#5f6368', fontSize: '1.2rem', animation: 'pulse 2s infinite' }}>Agrupando tus estados de cuenta...</div>
            </div>
        );
    }

    const totalProps = properties.length;
    const occupancyRate = totalProps === 0 ? 0 : Math.round((stats.rented / totalProps) * 100);

    return (
        <div className="fade-in">
            <h1 style={{ fontSize: '1.8rem', color: '#202124', marginBottom: '0.5rem' }}>Hola, {user?.name?.split(' ')[0]}</h1>
            <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Este es el resumen financiero de tu portfolio al día de hoy.</p>

            {/* Top KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                
                {/* Ingresos ARS */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #1a73e8 0%, #174ea6 100%)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                            <BadgeDollarSign size={20} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingresos Proyectados Mes (ARS)</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0' }}>
                            $ {stats.totalArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                            Suman {properties.filter(p => p.activeContract?.currency === 'ARS').length} contratos en Pesos.
                        </div>
                    </div>
                </div>

                {/* Ingresos USD */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #0d652d 0%, #0b3d1c 100%)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                            <BadgeDollarSign size={20} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingresos Fijos Mes (USD)</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0' }}>
                            U$D {stats.totalUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                            Suman {properties.filter(p => p.activeContract?.currency === 'USD').length} contratos en Dólares.
                        </div>
                    </div>
                </div>
            </div>

            {/* Ocupación y Resumen Operativo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                
                {/* Occupancy Bar */}
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', color: '#202124', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Home size={20} color="#1a73e8" /> 
                        Estado de Ocupación
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                        <span style={{ color: '#188038' }}>{stats.rented} Alquiladas</span>
                        <span style={{ color: '#d93025' }}>{stats.available} Vacías</span>
                    </div>

                    <div style={{ width: '100%', height: '12px', backgroundColor: '#fce8e6', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${occupancyRate}%`, height: '100%', backgroundColor: '#188038', transition: 'width 1s ease-in-out' }}></div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1rem', color: '#5f6368', fontSize: '1.5rem', fontWeight: 700 }}>
                        {occupancyRate}% Ocupación
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', color: '#202124', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} color="#1a73e8" /> 
                        Opciones Rápidas
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }} onClick={() => window.location.href = '/properties/new'}>
                            + Cargar nueva Propiedad al Portfolio
                        </button>
                        <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }} onClick={() => window.location.href = '/alerts'}>
                            Revisar calendario de vencimientos
                        </button>
                        <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem' }} onClick={() => window.location.href = '/rentals'}>
                            ¿Soy un inquilino? Vincular contrato.
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
