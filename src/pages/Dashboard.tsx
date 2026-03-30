import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import type { Property, RentalContract } from '../types';
import { Home, FileText, BadgeDollarSign, Building, Wrench, Link as LinkIcon } from 'lucide-react';
import { indexService } from '../services/indexService';
import { exchangeService } from '../services/exchangeService';

interface ExtendedProperty extends Property {
    activeContract?: RentalContract | null;
    estimatedRent?: number;
}

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<ExtendedProperty[]>([]);
    const [rentingProperties, setRentingProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        totalArs: 0,
        totalUsd: 0,
        rented: 0,
        available: 0,
        listed: 0,
        totalExpensesArs: 0,
        totalPatrimonioUsd: 0,
        exchangeRate: 1000
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            
            try {
                // 1. Fetch properties
                const userProperties = await propertyService.getPropertiesByOwner(user.id);
                const rProps = await propertyService.getRentingProperties(user.id);
                setRentingProperties(rProps);
                
                // 2. Fetch exchange rate
                const exRate = await exchangeService.getOfficialDollarRate();

                let sumArs = 0;
                let sumUsd = 0;
                let rentedCount = 0;
                let listedCount = 0;
                let patUsd = 0;
                let expensesSumArs = 0;

                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                const enrichedProps = await Promise.all(userProperties.map(async (prop) => {
                    // Calc Patrimonio
                    if (prop.estimatedValue) {
                        if (prop.currency === 'ARS') patUsd += prop.estimatedValue / exRate;
                        else patUsd += prop.estimatedValue;
                    }

                    // Sum Expenses current month
                    const reqExp = await propertyService.getExpenses(prop.id);
                    reqExp.forEach(ex => {
                        const d = new Date(ex.date + 'T00:00:00');
                        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                            if (ex.currency === 'USD') expensesSumArs += ex.amount * exRate;
                            else expensesSumArs += ex.amount;
                        }
                    });
                    let activeContract = null;
                    let currentRent = 0;

                    if (prop.isRented) {
                        listedCount++;
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
                    available: listedCount - rentedCount,
                    listed: listedCount,
                    totalExpensesArs: expensesSumArs,
                    totalPatrimonioUsd: patUsd,
                    exchangeRate: exRate
                });

            } catch (error) {
                console.error("Error building dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const handleLinkCoOwner = async () => {
        const code = window.prompt("Ingresa el ID de Propiedad para vincularte como Copropietario/Socio:");
        if (!code || !code.trim()) return;
        try {
            const success = await propertyService.linkCoOwnerToProperty(code.trim(), user!.id);
            if (success) {
                alert("¡Propiedad vinculada exitosamente! Ahora tienes permisos sobre ella.");
                window.location.reload();
            } else {
                alert("Propiedad no encontrada o vinculación fallida.");
            }
        } catch(e) {
            alert("Error al intentar vincular la propiedad.");
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div style={{ color: '#5f6368', fontSize: '1.2rem', animation: 'pulse 2s infinite' }}>Agrupando tus estados de cuenta...</div>
            </div>
        );
    }

    const totalListed = stats.listed;
    const occupancyRate = totalListed === 0 ? 0 : Math.round((stats.rented / totalListed) * 100);

    const grossIncomeArs = stats.totalArs + (stats.totalUsd * stats.exchangeRate);
    const netIncomeArs = grossIncomeArs; // The user requested to NOT subtract expenses from this projected subtotal

    if (properties.length === 0) {
        if (rentingProperties.length > 0) {
            return (
                <div className="fade-in">
                    <h1 style={{ fontSize: '1.8rem', color: '#202124', marginBottom: '0.5rem' }}>Hola, {user?.name?.split(' ')[0]}</h1>
                    <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Te damos la bienvenida a tu panel principal de Inquilino.</p>

                    <h2 style={{ fontSize: '1.4rem', color: '#1a73e8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Home size={24} /> Tus Alquileres Activos
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        {rentingProperties.map(rp => (
                            <div key={rp.id} className="card" style={{ padding: '0', cursor: 'pointer', overflow: 'hidden', border: '1px solid #dadce0', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }} 
                                 onClick={() => window.location.href = `/rentals`}
                                 onMouseOver={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.15)' }}
                                 onMouseOut={(e) => { e.currentTarget.style.borderColor = '#dadce0'; e.currentTarget.style.boxShadow = 'none' }}
                            >
                                <div style={{ height: '6px', width: '100%', backgroundColor: '#10b981' }}></div>
                                <div style={{ padding: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#202124', fontSize: '1.2rem' }}>{rp.name}</h3>
                                    <p style={{ margin: 0, color: '#5f6368', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Building size={16} /> {rp.address}
                                    </p>
                                </div>
                                <div style={{ marginTop: 'auto', padding: '1rem 1.5rem', backgroundColor: '#f6fdf6', borderTop: '1px solid #f1f3f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>Ingresar al Portal de Alquiler</span>
                                    <FileText size={18} color="#10b981" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '2.5rem', border: '1px dashed #dadce0', backgroundColor: '#fdfdfd' }}>
                        <h3 style={{ fontSize: '1.2rem', color: '#5f6368', marginBottom: '1rem' }}>¿Sos dueño de otras propiedades?</h3>
                        <p style={{ color: '#80868b', marginBottom: '2rem', fontSize: '0.95rem' }}>Si también administrás alquileres podés darlos de alta o vincularte a rentas compartidas desde acá.</p>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={handleLinkCoOwner} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LinkIcon size={18} /> Vincularme como Copropietario
                            </button>
                            <button className="btn btn-secondary" onClick={() => window.location.href = '/properties/new'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                + Alta Inmueble Nuevo
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="fade-in">
                <h1 style={{ fontSize: '1.8rem', color: '#202124', marginBottom: '0.5rem' }}>Hola, {user?.name?.split(' ')[0]}</h1>
                <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Bienvenido a Admin Prop.</p>

                <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem' }}>
                    <Home size={48} color="#1a73e8" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
                    <h2 style={{ fontSize: '1.5rem', color: '#202124', marginBottom: '1rem' }}>No administras propiedades aún</h2>
                    <p style={{ color: '#5f6368', marginBottom: '2rem', lineHeight: 1.5 }}>
                        Para visualizar tus proyecciones financieras y administrar tu rendimiento, da de alta tu primera unidad.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                        <button className="btn btn-primary" onClick={() => window.location.href = '/properties/new'} style={{ width: '100%', maxWidth: '300px' }}>
                            + Alta de Nueva Propiedad
                        </button>
                        <button className="btn btn-secondary" onClick={handleLinkCoOwner} style={{ width: '100%', maxWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <LinkIcon size={18} /> ¿Soy Copropietario? Vincular
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <h1 style={{ fontSize: '1.8rem', color: '#202124', marginBottom: '0.5rem' }}>Hola, {user?.name?.split(' ')[0]}</h1>
            <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Este es el resumen financiero de tu portfolio al día de hoy.</p>

            {/* Top KPI Cards */}
            <h2 style={{ fontSize: '1.2rem', color: '#5f6368', marginBottom: '1rem', borderBottom: '2px solid #dadce0', paddingBottom: '0.5rem' }}>Ingresos Proyectados</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                
                {/* Ingresos ARS */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #1a73e8 0%, #174ea6 100%)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                            <BadgeDollarSign size={20} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingreso mensual alquileres en pesos</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0.4rem 0' }}>
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
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingreso mensual alquileres en dolares</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0.4rem 0' }}>
                            U$D {stats.totalUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                            Suman {properties.filter(p => p.activeContract?.currency === 'USD').length} contratos en Dólares.
                        </div>
                    </div>
                </div>

                {/* Ingresos Netos ARS */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #1e8e3e 0%, #135c28 100%)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                            <BadgeDollarSign size={20} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subtotal de ingreso mensual alquileres</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0.4rem 0' }}>
                            $ {netIncomeArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Oficial: ${stats.exchangeRate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ocupación y Resumen Operativo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Patrimonio */}
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', color: '#202124', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={20} color="#1a73e8" /> 
                        Patrimonio Inmobiliario
                    </h3>
                    
                    <div style={{ fontSize: '0.95rem', color: '#5f6368', marginBottom: '0.2rem' }}>Valor de Mercado Estimado (USD)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#1a73e8', marginBottom: '1.5rem' }}>
                        U$D {stats.totalPatrimonioUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>

                    <div style={{ width: '100%', height: '1px', backgroundColor: '#dadce0', margin: '1rem 0' }}></div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d93025', fontSize: '0.95rem', fontWeight: 500 }}>
                        <Wrench size={16} /> Gastos reportados este mes: $ {stats.totalExpensesArs.toLocaleString()} ARS
                    </div>
                </div>
                
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
