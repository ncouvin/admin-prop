import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockService } from '../services/mockData';
import { uploadToCloudinary } from '../services/cloudinary';
import type { Property, Service } from '../types';
import { Save, ArrowLeft, Upload, X, Plus, Trash2 } from 'lucide-react';

const PropertyForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState<Partial<Property>>({
        type: 'apartment',
        currency: 'USD',
        features: {
            rooms: 1,
            bathrooms: 1,
            coveredArea: 0,
            uncoveredArea: 0,
            amenities: []
        },
        images: [],
        documents: [],
        address: {
            street: '',
            city: '',
            country: 'Argentina'
        }
    });

    const [services, setServices] = useState<Partial<Service>[]>([]);

    useEffect(() => {
        if (id) {
            const properties = mockService.getProperties();
            const property = properties.find(p => p.id === id);
            if (property) {
                setFormData(property);
                const propServices = mockService.getServices(id);
                setServices(propServices);
            }
        }
    }, [id]);

    const handleChange = (field: keyof Property, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddressChange = (field: keyof Property['address'], value: string) => {
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address!, [field]: value }
        }));
    };

    const handleFeatureChange = (field: keyof Property['features'], value: any) => {
        setFormData(prev => ({
            ...prev,
            features: { ...prev.features!, [field]: value }
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        try {
            const file = e.target.files[0];
            const url = await uploadToCloudinary(file);

            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), url]
            }));
        } catch (error) {
            console.error("Error uploading image: ", error);
            alert("Error al subir la imagen. Por favor intente nuevamente.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images?.filter((_, i) => i !== index)
        }));
    };

    const handleAddService = () => {
        setServices(prev => [...prev, {
            name: '',
            type: 'other',
            periodicity: 'monthly',
            providerId: ''
        }]);
    };

    const handleServiceChange = (index: number, field: keyof Service, value: any) => {
        const newServices = [...services];
        newServices[index] = { ...newServices[index], [field]: value };
        setServices(newServices);
    };

    const handleRemoveService = (index: number) => {
        setServices(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const propertyData = {
                ...formData,
                ownerId: user.id,
                id: id || Math.random().toString(36).substr(2, 9)
            } as Property;

            if (id) {
                mockService.updateProperty(propertyData);
            } else {
                mockService.addProperty(propertyData);
            }

            // Save services
            // First delete existing services if editing (simplified approach)
            if (id) {
                const existingServices = mockService.getServices(id);
                existingServices.forEach(s => mockService.deleteService(s.id));
            }

            // Add all services
            services.forEach(service => {
                if (service.name) {
                    mockService.addService({
                        ...service,
                        id: Math.random().toString(36).substr(2, 9),
                        propertyId: propertyData.id,
                        type: service.type || 'other',
                        periodicity: service.periodicity || 'monthly'
                    } as Service);
                }
            });

            navigate('/properties');
        } catch (error) {
            console.error('Error saving property:', error);
            alert('Error al guardar la propiedad');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container fade-in">
            <div className="header-actions">
                <button className="btn btn-secondary" onClick={() => navigate('/properties')}>
                    <ArrowLeft size={20} />
                    Volver
                </button>
                <h1>{id ? 'Editar Propiedad' : 'Nueva Propiedad'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="form-grid">
                {/* Sección 1: Información Básica */}
                <section className="card">
                    <h3>Información Básica</h3>
                    <div className="grid-2">
                        <div>
                            <label className="label">Nombre Identificativo</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ej: Depto Mar del Plata"
                                value={formData.name || ''}
                                onChange={e => handleChange('name', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Tipo de Propiedad</label>
                            <select
                                className="input"
                                value={formData.type}
                                onChange={e => handleChange('type', e.target.value)}
                            >
                                <option value="apartment">Departamento</option>
                                <option value="house">Casa</option>
                                <option value="garage">Cochera</option>
                                <option value="store">Local</option>
                                <option value="warehouse">Galpón</option>
                                <option value="land">Terreno</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid-2">
                        <div>
                            <label className="label">Dirección</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Calle y Altura"
                                value={formData.address?.street || ''}
                                onChange={e => handleAddressChange('street', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Ciudad/Zona</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.address?.city || ''}
                                onChange={e => handleAddressChange('city', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div>
                            <label className="label">Piso</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.address?.floor || ''}
                                onChange={e => handleAddressChange('floor', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label">Depto/Unidad</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.address?.apartment || ''}
                                onChange={e => handleAddressChange('apartment', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div>
                            <label className="label">Valor de Compra</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select
                                    className="input"
                                    style={{ width: '80px' }}
                                    value={formData.currency}
                                    onChange={e => handleChange('currency', e.target.value)}
                                >
                                    <option value="USD">USD</option>
                                    <option value="ARS">ARS</option>
                                    <option value="EUR">EUR</option>
                                </select>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.purchaseValue || ''}
                                    onChange={e => handleChange('purchaseValue', parseFloat(e.target.value))}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sección 2: Fotos */}
                <section className="card">
                    <h3>Fotos</h3>
                    <div className="image-upload-container">
                        <div className="image-grid">
                            {formData.images?.map((url, index) => (
                                <div key={index} className="image-preview">
                                    <img src={url} alt={`Propiedad ${index + 1}`} />
                                    <button
                                        type="button"
                                        className="delete-btn"
                                        onClick={() => handleRemoveImage(index)}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            <label className={`upload-btn ${uploading ? 'disabled' : ''}`}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                    hidden
                                />
                                {uploading ? (
                                    <span>Subiendo...</span>
                                ) : (
                                    <>
                                        <Upload size={24} />
                                        <span>Agregar Foto</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>
                </section>

                {/* Sección 3: Características */}
                <section className="card">
                    <h3>Características</h3>
                    <div className="grid-2">
                        <div>
                            <label className="label">Ambientes</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.features?.rooms}
                                onChange={e => handleFeatureChange('rooms', parseInt(e.target.value))}
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="label">Baños</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.features?.bathrooms}
                                onChange={e => handleFeatureChange('bathrooms', parseInt(e.target.value))}
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="label">M2 Cubiertos</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.features?.coveredArea}
                                onChange={e => handleFeatureChange('coveredArea', parseFloat(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="label">M2 Descubiertos</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.features?.uncoveredArea}
                                onChange={e => handleFeatureChange('uncoveredArea', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                </section>

                {/* Sección 4: Impuestos y Servicios */}
                <section className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <h3>Impuestos y Servicios</h3>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }} onClick={handleAddService}>
                            <Plus size={16} /> Agregar
                        </button>
                    </div>

                    {services.length === 0 ? (
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                            No hay servicios registrados.
                        </p>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {services.map((service, index) => (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'center', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Nombre (ej: ABL)"
                                        value={service.name}
                                        onChange={e => handleServiceChange(index, 'name', e.target.value)}
                                    />
                                    <select
                                        className="input"
                                        value={service.periodicity}
                                        onChange={e => handleServiceChange(index, 'periodicity', e.target.value)}
                                    >
                                        <option value="monthly">Mensual</option>
                                        <option value="bimonthly">Bimestral</option>
                                        <option value="annual">Anual</option>
                                    </select>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Nro Ref"
                                        value={service.providerId || ''}
                                        onChange={e => handleServiceChange(index, 'providerId', e.target.value)}
                                    />
                                    <button type="button" onClick={() => handleRemoveService(index)} style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Botones de Acción */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/properties')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
                        <Save size={20} />
                        {loading ? 'Guardando...' : 'Guardar Propiedad'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PropertyForm;
