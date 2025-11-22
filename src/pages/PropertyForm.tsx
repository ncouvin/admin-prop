import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Property, PropertyType, Service } from '../types';
import { mockService } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';

const PropertyForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEdit = !!id;

    const [formData, setFormData] = useState<Partial<Property>>({
        name: '',
        address: { street: '', city: '', country: 'Argentina', floor: '', apartment: '' },
        type: 'apartment',
        currency: 'USD',
        features: { rooms: 1, bathrooms: 1, coveredArea: 0, uncoveredArea: 0, amenities: [] },
        images: [],
        documents: []
    });

    const [services, setServices] = useState<Partial<Service>[]>([]);

    useEffect(() => {
        if (isEdit && id) {
            const props = mockService.getProperties();
            const found = props.find(p => p.id === id);
            if (found) {
                setFormData(found);
                const propServices = mockService.getServices(id);
                setServices(propServices);
            }
        }
    }, [isEdit, id]);

    const handleAddService = () => {
        setServices([...services, { name: '', type: 'other', periodicity: 'monthly', providerId: '' }]);
    };

    const handleRemoveService = (index: number) => {
        const newServices = [...services];
        newServices.splice(index, 1);
        setServices(newServices);
    };

    const handleServiceChange = (index: number, field: keyof Service, value: any) => {
        const newServices = [...services];
        newServices[index] = { ...newServices[index], [field]: value };
        setServices(newServices);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const propertyData = {
            ...formData,
            id: isEdit ? id! : Math.random().toString(36).substr(2, 9),
            ownerId: user.id,
        } as Property;

        if (isEdit) {
            mockService.updateProperty(propertyData);
            // Update services: delete all and recreate (simple approach for mock)
            const existingServices = mockService.getServices(id!);
            existingServices.forEach(s => mockService.deleteService(s.id));
            services.forEach(s => {
                mockService.addService({ ...s, id: Math.random().toString(36).substr(2, 9), propertyId: id! } as Service);
            });
        } else {
            const newProp = mockService.addProperty(propertyData);
            services.forEach(s => {
                mockService.addService({ ...s, id: Math.random().toString(36).substr(2, 9), propertyId: newProp.id } as Service);
            });
        }
        navigate('/properties');
        navigate('/properties');
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

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/properties')} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: '1.5rem' }}>{isEdit ? 'Editar Propiedad' : 'Nueva Propiedad'}</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Sección 1: Información General */}
                <section className="card">
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        Información General
                    </h3>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label className="label">Nombre de la Propiedad (Alias)</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Depto Mar del Plata"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Tipo de Propiedad</label>
                                <select
                                    className="input"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as PropertyType })}
                                >
                                    <option value="apartment">Departamento</option>
                                    <option value="house">Casa</option>
                                    <option value="ph">PH</option>
                                    <option value="garage">Cochera</option>
                                    <option value="store">Local</option>
                                    <option value="warehouse">Galpón</option>
                                    <option value="land">Lote/Campo</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Moneda</label>
                                <select
                                    className="input"
                                    value={formData.currency}
                                    onChange={e => setFormData({ ...formData, currency: e.target.value as any })}
                                >
                                    <option value="USD">Dólar (USD)</option>
                                    <option value="ARS">Peso Arg (ARS)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="label">Dirección</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.address?.street}
                                onChange={e => handleAddressChange('street', e.target.value)}
                                placeholder="Calle y Altura"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Ciudad/Provincia</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.address?.city}
                                    onChange={e => handleAddressChange('city', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Piso</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.address?.floor}
                                    onChange={e => handleAddressChange('floor', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="label">Depto</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.address?.apartment}
                                    onChange={e => handleAddressChange('apartment', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sección 2: Características */}
                <section className="card">
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        Características
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

                {/* Sección 3: Impuestos y Servicios */}
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
                    <button type="submit" className="btn btn-primary">
                        <Save size={20} />
                        Guardar Propiedad
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PropertyForm;
