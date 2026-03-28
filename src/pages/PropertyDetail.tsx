import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import type { Property } from '../types';
import {
    Building, MapPin, Edit, Trash2,
    ArrowLeft, Zap, Image as ImageIcon, Key, HelpCircle
} from 'lucide-react';

const PropertyDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [property, setProperty] = useState<Property | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'services' | 'contracts' | 'photos'>('details');

    useEffect(() => {
        if (id && user) {
            const loadProperty = async () => {
                const fetchedProp = await propertyService.getProperty(id);
                if (fetchedProp) {
                    setProperty(fetchedProp);
                } else {
                    navigate('/dashboard');
                }
            };
            loadProperty();
        }
    }, [id, user, navigate]);

    const handleDelete = async () => {
        if (window.confirm('¿Está seguro que desea eliminar esta propiedad y todos sus datos relacionados?')) {
            if (id) {
                await propertyService.deleteProperty(id);
                navigate('/dashboard');
            }
        }
    };

    if (!property) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando detalles...</div>;

    return (
        <div className="container fade-in">
            <div className="header-actions">
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={20} />
                    Volver
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate(`/properties/${id}/edit`)}>
                        <Edit size={20} />
                        Editar Propiedad
                    </button>
                    <button className="btn btn-danger" onClick={handleDelete} style={{ color: 'red' }}>
                        <Trash2 size={20} />
                        Eliminar Propiedad
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#fff', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1a73e8' }}>{property.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#5f6368', fontSize: '1.1rem' }}>
                            <MapPin size={18} />
                            <span>{property.address}</span>
                        </div>
                    </div>
                    <div style={{ padding: '0.5rem 1rem', backgroundColor: property.isRented ? '#e6f4ea' : '#fce8e6', color: property.isRented ? '#188038' : '#d93025', borderRadius: '24px', fontWeight: 600, fontSize: '0.9rem' }}>
                        {property.isRented ? 'ACTIVA PARA ALQUILER' : 'SOLO ADMINISTRACIÓN'}
                    </div>
                </div>
            </div>

            <div className="tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #f1f3f4', marginBottom: '2rem' }}>
                <button
                    style={{ background: 'none', border: 'none', padding: '1rem', cursor: 'pointer', borderBottom: activeTab === 'details' ? '2px solid #1a73e8' : 'none', color: activeTab === 'details' ? '#1a73e8' : '#5f6368', fontWeight: activeTab === 'details' ? 600 : 400, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => setActiveTab('details')}
                >
                    <Building size={18} /> Datos Generales
                </button>
                <button
                    style={{ background: 'none', border: 'none', padding: '1rem', cursor: 'pointer', borderBottom: activeTab === 'services' ? '2px solid #1a73e8' : 'none', color: activeTab === 'services' ? '#1a73e8' : '#5f6368', fontWeight: activeTab === 'services' ? 600 : 400, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => setActiveTab('services')}
                >
                    <Zap size={18} /> Impuestos & Expensas
                </button>
                {property.isRented && (
                    <button
                        style={{ background: 'none', border: 'none', padding: '1rem', cursor: 'pointer', borderBottom: activeTab === 'contracts' ? '2px solid #1a73e8' : 'none', color: activeTab === 'contracts' ? '#1a73e8' : '#5f6368', fontWeight: activeTab === 'contracts' ? 600 : 400, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => setActiveTab('contracts')}
                    >
                        <Key size={18} /> Contrato de Alquiler
                    </button>
                )}
                <button
                    style={{ background: 'none', border: 'none', padding: '1rem', cursor: 'pointer', borderBottom: activeTab === 'photos' ? '2px solid #1a73e8' : 'none', color: activeTab === 'photos' ? '#1a73e8' : '#5f6368', fontWeight: activeTab === 'photos' ? 600 : 400, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => setActiveTab('photos')}
                >
                    <ImageIcon size={18} /> Fotos
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'details' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(250px, 1fr)', gap: '2rem' }}>
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem', color: '#202124' }}>Características</h3>
                            <p style={{ whiteSpace: 'pre-line', lineHeight: '1.6', color: '#3c4043' }}>
                                {property.features || 'No hay características descriptivas detalladas.'}
                            </p>
                        </div>
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem', color: '#202124' }}>Finanzas Básicas</h3>
                            <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #dadce0' }}>
                                <div style={{ fontSize: '0.9rem', color: '#5f6368', marginBottom: '0.25rem' }}>Valor de Mercado Estimado</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a73e8' }}>
                                    {property.currency} {property.estimatedValue?.toLocaleString() || '0'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'photos' && (
                    <div className="card">
                        <h3 style={{ marginBottom: '1.5rem', color: '#202124' }}>Galería</h3>
                        {property.images && property.images.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {property.images.map((url, index) => (
                                    <div key={index} style={{ height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #dadce0' }}>
                                        <img src={url} alt={`Property ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#9aa0a6' }}>
                                No hay fotos adjuntas a esta propiedad.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#9aa0a6' }}>
                         <HelpCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                         <p style={{ fontSize: '1.2rem', color: '#5f6368' }}>Módulo de Impuestos en Construcción (Fase 4)</p>
                         <p style={{ marginTop: '0.5rem' }}>Aquí podrás añadir Luz, Expensas, Aguas, y subir los comprobantes de pago de cada mes.</p>
                    </div>
                )}

                {activeTab === 'contracts' && (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#9aa0a6' }}>
                         <HelpCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                         <p style={{ fontSize: '1.2rem', color: '#5f6368' }}>Módulo de Alquiler en Construcción (Fase 4)</p>
                         <p style={{ marginTop: '0.5rem' }}>Aquí configurarás las fechas del contrato, el monto de alquiler y su índice de actualización.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyDetail;
