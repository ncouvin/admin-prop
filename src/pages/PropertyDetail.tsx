import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Property, Service } from '../types';
import { mockService } from '../services/mockData';
import { Edit, ArrowLeft, MapPin, Home, DollarSign, Wrench, Users, Image as ImageIcon, Plus } from 'lucide-react';

const PropertyDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState<Property | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        if (id) {
            const props = mockService.getProperties();
            const found = props.find(p => p.id === id);
            if (found) {
                setProperty(found);
                setServices(mockService.getServices(id));
            }
        }
    }, [id]);

    if (!property) return <div>Cargando...</div>;

    const tabs = [
        { id: 'info', label: 'Info General', icon: <Home size={18} /> },
        { id: 'services', label: 'Impuestos y Servicios', icon: <DollarSign size={18} /> },
        { id: 'expenses', label: 'Arreglos y Gastos', icon: <Wrench size={18} /> },
        { id: 'incomes', label: 'Ingresos', icon: <DollarSign size={18} /> },
        { id: 'tenants', label: 'Inquilinos', icon: <Users size={18} /> },
        { id: 'photos', label: 'Fotos', icon: <ImageIcon size={18} /> },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/properties')} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{property.name}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            <MapPin size={16} />
                            <span>{property.address.street}, {property.address.city}</span>
                        </div>
                    </div>
                </div>

                <button className="btn btn-primary" onClick={() => navigate(`/properties/${property.id}/edit`)}>
                    <Edit size={18} />
                    Editar
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem', overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            fontWeight: activeTab === tab.id ? 600 : 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="card">
                {activeTab === 'info' && (
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <p className="label">Tipo</p>
                                <p style={{ textTransform: 'capitalize' }}>{property.type}</p>
                            </div>
                            <div>
                                <p className="label">Moneda</p>
                                <p>{property.currency}</p>
                            </div>
                            <div>
                                <p className="label">Ambientes</p>
                                <p>{property.features.rooms}</p>
                            </div>
                            <div>
                                <p className="label">Baños</p>
                                <p>{property.features.bathrooms}</p>
                            </div>
                            <div>
                                <p className="label">Sup. Cubierta</p>
                                <p>{property.features.coveredArea} m²</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'services' && (
                    <div>
                        <h3 style={{ marginBottom: '1.5rem' }}>Servicios e Impuestos</h3>
                        {services.length === 0 ? (
                            <p style={{ color: 'var(--color-text-secondary)' }}>No hay servicios configurados.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {services.map(service => (
                                    <div key={service.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        <div>
                                            <p style={{ fontWeight: 500 }}>{service.name}</p>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {service.providerId ? `Ref: ${service.providerId}` : 'Sin referencia'}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                backgroundColor: 'var(--color-surface-hover)',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '1rem',
                                                textTransform: 'capitalize'
                                            }}>
                                                {service.periodicity === 'monthly' ? 'Mensual' : service.periodicity}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Historial de Arreglos y Gastos</h3>
                            <button className="btn btn-secondary" style={{ fontSize: '0.875rem' }} onClick={() => navigate(`/properties/${property.id}/expenses/new`)}>
                                <Plus size={16} /> Nuevo Gasto
                            </button>
                        </div>

                        {mockService.getExpenses(property.id).length === 0 ? (
                            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                No hay gastos registrados aún.
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {mockService.getExpenses(property.id).map(expense => (
                                    <div key={expense.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontWeight: 500 }}>{expense.description}</p>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {expense.date} - <span style={{ textTransform: 'capitalize' }}>{expense.category}</span>
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: 600, color: 'var(--color-error)' }}>
                                                - ${expense.amount} {expense.currency}
                                            </p>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.1rem 0.4rem',
                                                borderRadius: '1rem',
                                                backgroundColor: expense.isPaid ? 'var(--color-success)' : 'var(--color-warning)',
                                                color: '#fff'
                                            }}>
                                                {expense.isPaid ? 'Pagado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'incomes' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Historial de Ingresos (Alquileres)</h3>
                            <button className="btn btn-secondary" style={{ fontSize: '0.875rem' }} onClick={() => navigate(`/properties/${property.id}/incomes/new`)}>
                                <Plus size={16} /> Registrar Cobro
                            </button>
                        </div>

                        {mockService.getIncomes(property.id).length === 0 ? (
                            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                No hay ingresos registrados aún.
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {mockService.getIncomes(property.id).map(income => (
                                    <div key={income.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontWeight: 500 }}>{income.period}</p>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {income.date}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                                                + ${income.amount} {income.currency}
                                            </p>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.1rem 0.4rem',
                                                borderRadius: '1rem',
                                                backgroundColor: income.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-warning)',
                                                color: '#fff'
                                            }}>
                                                {income.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'tenants' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Inquilinos</h3>
                            <button className="btn btn-secondary" style={{ fontSize: '0.875rem' }} onClick={() => navigate(`/properties/${property.id}/tenants/new`)}>
                                <Plus size={16} /> Asignar Inquilino
                            </button>
                        </div>

                        {mockService.getContracts(property.id).length === 0 ? (
                            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                Propiedad actualmente vacante.
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {mockService.getContracts(property.id).map(contract => {
                                    const tenant = mockService.getUsers().find(u => u.id === contract.tenantId);
                                    return (
                                        <div key={contract.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 600 }}>{tenant?.name || 'Inquilino Desconocido'}</span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '1rem',
                                                    backgroundColor: contract.isActive ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                                    color: '#fff'
                                                }}>
                                                    {contract.isActive ? 'Activo' : 'Finalizado'}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                Desde: {contract.startDate} - Hasta: {contract.endDate}
                                            </p>
                                            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '0.5rem' }}>
                                                ${contract.amount} {contract.currency}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'photos' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Galería de Fotos</h3>
                            <button className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
                                <Plus size={16} /> Subir Fotos
                            </button>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                            No hay fotos cargadas.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyDetail;
