import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockService } from '../services/mockData';
import { uploadToCloudinary } from '../services/cloudinary';
import type { Property, Service } from '../types';
import {
    Building, MapPin, Ruler, Bed, Bath, Edit, Trash2,
    ArrowLeft, Zap, Upload, X, Image as ImageIcon, DollarSign, Users
} from 'lucide-react';

const PropertyDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [property, setProperty] = useState<Property | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'expenses' | 'incomes' | 'contracts' | 'services' | 'photos'>('details');
    const [uploading, setUploading] = useState(false);

    // Data states
    const [services, setServices] = useState<Service[]>([]);

    useEffect(() => {
        if (id && user) {
            const props = mockService.getProperties();
            const found = props.find(p => p.id === id);
            if (found) {
                setProperty(found);
                setServices(mockService.getServices(id));
            } else {
                navigate('/properties');
            }
        }
    }, [id, user, navigate]);

    const handleDelete = () => {
        if (window.confirm('¿Está seguro que desea eliminar esta propiedad?')) {
            if (id) {
                mockService.deleteProperty(id);
                navigate('/properties');
            }
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !property) return;

        setUploading(true);
        try {
            const file = e.target.files[0];
            const url = await uploadToCloudinary(file);

            const updatedProperty = {
                ...property,
                images: [...(property.images || []), url]
            };

            setProperty(updatedProperty);
            mockService.updateProperty(updatedProperty);
        } catch (error) {
            console.error("Error uploading image: ", error);
            alert("Error al subir la imagen. Por favor intente nuevamente.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (index: number) => {
        if (!property) return;

        if (window.confirm('¿Eliminar esta imagen?')) {
            const updatedProperty = {
                ...property,
                images: property.images.filter((_, i) => i !== index)
            };
            setProperty(updatedProperty);
            mockService.updateProperty(updatedProperty);
        }
    };

    if (!property) return null;

    return (
        <div className="container fade-in">
            {/* Header */}
            <div className="header-actions">
                <button className="btn btn-secondary" onClick={() => navigate('/properties')}>
                    <ArrowLeft size={20} />
                    Volver
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate(`/properties/${id}/edit`)}>
                        <Edit size={20} />
                        Editar
                    </button>
                    <button className="btn btn-danger" onClick={handleDelete}>
                        <Trash2 size={20} />
                        Eliminar
                    </button>
                </div>
            </div>

            {/* Property Title Card */}
            <div className="card mb-4" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{property.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                            <MapPin size={18} />
                            <span>{property.address.street}, {property.address.city}</span>
                        </div>
                    </div>
                    <div className="badge badge-primary">
                        {property.type.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                >
                    <Building size={18} /> Detalles
                </button>
                <button
                    className={`tab ${activeTab === 'photos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('photos')}
                >
                    <ImageIcon size={18} /> Fotos
                </button>
                <button
                    className={`tab ${activeTab === 'contracts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contracts')}
                >
                    <Users size={18} /> Inquilinos
                </button>
                <button
                    className={`tab ${activeTab === 'expenses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expenses')}
                >
                    <DollarSign size={18} /> Gastos
                </button>
                <button
                    className={`tab ${activeTab === 'services' ? 'active' : ''}`}
                    onClick={() => setActiveTab('services')}
                >
                    <Zap size={18} /> Servicios
                </button>
            </div>

            {/* Content */}
            <div className="tab-content">
                {activeTab === 'details' && (
                    <div className="grid-2">
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Características</h3>
                            <div className="list-group">
                                <div className="list-item">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                        <Ruler size={18} />
                                        <span>Superficie Total</span>
                                    </div>
                                    <strong style={{ fontSize: '1.1rem' }}>{property.features.coveredArea + property.features.uncoveredArea} m²</strong>
                                </div>
                                <div className="list-item">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                        <Bed size={18} />
                                        <span>Ambientes</span>
                                    </div>
                                    <strong style={{ fontSize: '1.1rem' }}>{property.features.rooms}</strong>
                                </div>
                                <div className="list-item">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                        <Bath size={18} />
                                        <span>Baños</span>
                                    </div>
                                    <strong style={{ fontSize: '1.1rem' }}>{property.features.bathrooms}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Valoración</h3>
                            <div className="stat-card">
                                <div className="stat-value">
                                    {property.currency} {property.purchaseValue?.toLocaleString() || '-'}
                                </div>
                                <div className="stat-label">Valor de Compra</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'photos' && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Galería de Fotos</h3>
                            <label className={`btn btn-primary ${uploading ? 'disabled' : ''}`} style={{ cursor: 'pointer' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                    hidden
                                />
                                {uploading ? 'Subiendo...' : (
                                    <>
                                        <Upload size={18} /> Subir Foto
                                    </>
                                )}
                            </label>
                        </div>

                        {property.images && property.images.length > 0 ? (
                            <div className="image-grid">
                                {property.images.map((url, index) => (
                                    <div key={index} className="image-preview">
                                        <img src={url} alt={`Propiedad ${index + 1}`} />
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleRemoveImage(index)}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4rem',
                                border: '2px dashed var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-text-secondary)'
                            }}>
                                <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>No hay fotos cargadas en esta propiedad.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="card">
                        <h3 style={{ marginBottom: '1.5rem' }}>Servicios e Impuestos</h3>
                        {services.length > 0 ? (
                            <div className="list-group">
                                {services.map(service => (
                                    <div key={service.id} className="list-item">
                                        <div>
                                            <strong style={{ fontSize: '1.1rem' }}>{service.name}</strong>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                                Ref: {service.providerId || '-'}
                                            </div>
                                        </div>
                                        <div className="badge badge-secondary">
                                            {service.periodicity === 'monthly' ? 'Mensual' :
                                                service.periodicity === 'bimonthly' ? 'Bimestral' :
                                                    service.periodicity === 'annual' ? 'Anual' : service.periodicity}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                No hay servicios registrados
                            </p>
                        )}
                    </div>
                )}

                {/* Placeholders for other tabs */}
                {activeTab === 'contracts' && (
                    <div className="card">
                        <h3 style={{ marginBottom: '1.5rem' }}>Contratos de Alquiler</h3>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4rem',
                            border: '2px dashed var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-text-secondary)'
                        }}>
                            <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Funcionalidad en desarrollo</p>
                        </div>
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div className="card">
                        <h3 style={{ marginBottom: '1.5rem' }}>Historial de Gastos</h3>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4rem',
                            border: '2px dashed var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-text-secondary)'
                        }}>
                            <DollarSign size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Funcionalidad en desarrollo</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyDetail;
