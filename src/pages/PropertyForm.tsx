import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import { uploadToCloudinary } from '../services/cloudinary';
import type { Property } from '../types';
import { Save, ArrowLeft, Upload, X, FileText } from 'lucide-react';

const PropertyForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState<Partial<Property>>({
        type: 'apartment',
        currency: 'USD',
        features: '',
        images: [],
        name: '',
        address: '',
        estimatedValue: 0,
        isRented: false,
        notes: ''
    });

    useEffect(() => {
        if (id) {
            const fetchProperty = async () => {
                const property = await propertyService.getProperty(id);
                if (property) {
                    setFormData(property);
                } else {
                    alert('Propiedad no encontrada');
                    navigate('/dashboard');
                }
            };
            fetchProperty();
        } else {
            const checkLimit = async () => {
                if (!user) return;
                const owned = await propertyService.getPropertiesByOwner(user.id);
                const masterOwned = owned.filter(p => p.ownerId === user.id);
                
                if (masterOwned.length >= user.maxProperties) {
                    alert('Límite de propiedades activas alcanzado. Serás redirigido a la tienda para ampliar tu cupo.');
                    navigate('/upgrade');
                }
            };
            checkLimit();
        }
    }, [id, user, navigate]);

    const handleChange = (field: keyof Property, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
            alert("Error al subir la imagen a Cloudinary. Revisa la configuración en `.env`.");
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

    const handleFileUpload = async (field: 'deedUrl' | 'currentContractUrl' | 'coownershipRulebookUrl' | 'internalRulebookUrl', e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        try {
            const file = e.target.files[0];
            const url = await uploadToCloudinary(file);
            handleChange(field, url);
        } catch (error) {
            console.error("Error uploading file: ", error);
            alert("Error al subir archivo a Cloudinary.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            if (id) {
                await propertyService.updateProperty(id, formData);
            } else {
                const newProperty: Omit<Property, 'id'> = {
                    ownerId: user.id,
                    coOwnerIds: [],
                    name: formData.name || '',
                    address: formData.address || '',
                    type: formData.type || 'apartment',
                    estimatedValue: formData.estimatedValue || 0,
                    currency: formData.currency || 'USD',
                    features: formData.features || '',
                    isRented: formData.isRented || false,
                    images: formData.images || [],
                    notes: formData.notes || '',
                    deedUrl: formData.deedUrl || undefined,
                    currentContractUrl: formData.currentContractUrl || undefined
                };
                await propertyService.createProperty(newProperty);
            }

            navigate('/dashboard');
        } catch (error) {
            console.error('Error saving property:', error);
            alert('Error al guardar la propiedad en Firestore.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container fade-in">
            <div className="header-actions">
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={20} />
                    Volver al Tablero
                </button>
                <h1>{id ? 'Editar Propiedad' : 'Nueva Propiedad'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="form-grid">
                <section className="card">
                    <h3>Identificación Básica</h3>
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
                                <option value="ph">PH</option>
                                <option value="garage">Cochera</option>
                                <option value="store">Local</option>
                                <option value="warehouse">Galpón</option>
                                <option value="land">Terreno</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label className="label">Dirección Completa</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Ej: Av. Colón 1234, 4to B, Mar del Plata"
                            value={formData.address || ''}
                            onChange={e => handleChange('address', e.target.value)}
                            required
                        />
                    </div>
                </section>

                <section className="card">
                    <h3>Valor e Información Extra</h3>
                    <div className="grid-2">
                        <div>
                            <label className="label">Valor de Compra Estimado</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select
                                    className="input"
                                    style={{ width: '80px' }}
                                    value={formData.currency}
                                    onChange={e => handleChange('currency', e.target.value)}
                                >
                                    <option value="USD">USD</option>
                                    <option value="ARS">ARS</option>
                                </select>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.estimatedValue || ''}
                                    onChange={e => handleChange('estimatedValue', parseFloat(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label className="label">Características</label>
                        <textarea
                            className="input"
                            rows={3}
                            placeholder="Ej: 3 ambientes, al frente, balcón, cochera, parrilla integrada..."
                            value={formData.features || ''}
                            onChange={e => handleChange('features', e.target.value)}
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label className="label">Anotaciones Privadas y Documentos</label>
                        <textarea
                            className="input"
                            rows={4}
                            placeholder="Notas generales: códigos de puerto, información de vecinos, detalles privados..."
                            value={formData.notes || ''}
                            onChange={e => handleChange('notes', e.target.value)}
                        />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label className="label">Adjuntar Escritura (PDF/Foto)</label>
                            {formData.deedUrl ? (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <a href={formData.deedUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
                                        <FileText size={18} /> Ver Documento Actual
                                    </a>
                                    <button type="button" className="btn btn-danger" onClick={() => handleChange('deedUrl', null)}>
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <label className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', width: '100%' }}>
                                    <Upload size={18} />
                                    {uploading ? 'Subiendo...' : 'Subir Archivo'}
                                    <input type="file" accept=".pdf,image/*" hidden onChange={e => handleFileUpload('deedUrl', e)} disabled={uploading}/>
                                </label>
                            )}
                        </div>

                        <div>
                            <label className="label">Contrato de Alquiler Vigente</label>
                            {formData.currentContractUrl ? (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <a href={formData.currentContractUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
                                        <FileText size={18} /> Ver Contrato Actual
                                    </a>
                                    <button type="button" className="btn btn-danger" onClick={() => handleChange('currentContractUrl', null)}>
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <label className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', width: '100%' }}>
                                    <Upload size={18} />
                                    {uploading ? 'Subiendo...' : 'Subir Archivo'}
                                    <input type="file" accept=".pdf,image/*" hidden onChange={e => handleFileUpload('currentContractUrl', e)} disabled={uploading}/>
                                </label>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label className="label">Reglamento de Copropiedad (PDF)</label>
                            {formData.coownershipRulebookUrl ? (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <a href={formData.coownershipRulebookUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', backgroundColor: '#eef2ff', borderColor: '#c7d2fe', color: '#4f46e5' }}>
                                        <FileText size={18} /> Ver Copropiedad
                                    </a>
                                    <button type="button" className="btn btn-danger" onClick={() => handleChange('coownershipRulebookUrl', null)}>
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <label className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', width: '100%' }}>
                                    <Upload size={18} />
                                    {uploading ? 'Subiendo...' : 'Subir Reglamento'}
                                    <input type="file" accept=".pdf,image/*" hidden onChange={e => handleFileUpload('coownershipRulebookUrl', e)} disabled={uploading}/>
                                </label>
                            )}
                        </div>

                        <div>
                            <label className="label">Reglamento Interno (PDF)</label>
                            {formData.internalRulebookUrl ? (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <a href={formData.internalRulebookUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', backgroundColor: '#eef2ff', borderColor: '#c7d2fe', color: '#4f46e5' }}>
                                        <FileText size={18} /> Ver Reg. Interno
                                    </a>
                                    <button type="button" className="btn btn-danger" onClick={() => handleChange('internalRulebookUrl', null)}>
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <label className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', width: '100%' }}>
                                    <Upload size={18} />
                                    {uploading ? 'Subiendo...' : 'Subir Reglamento'}
                                    <input type="file" accept=".pdf,image/*" hidden onChange={e => handleFileUpload('internalRulebookUrl', e)} disabled={uploading}/>
                                </label>
                            )}
                        </div>
                    </div>
                </section>

                <section className="card">
                    <h3>Contactos del Edificio / Consorcio</h3>
                    
                    {/* ENCARGADO / PORTERO */}
                    <div style={{ marginTop: '1rem', border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                                type="checkbox" 
                                id="hasJanitor" 
                                checked={formData.hasJanitor || false}
                                onChange={e => handleChange('hasJanitor', e.target.checked)}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <label htmlFor="hasJanitor" style={{ fontWeight: 600, color: '#374151' }}>
                                El edificio cuenta con Encargado / Portero
                            </label>
                        </div>
                        
                        {formData.hasJanitor && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <div>
                                    <label className="label" style={{ fontSize: '0.85rem' }}>Nombre del Encargado</label>
                                    <input type="text" className="input" placeholder="Ej: Raúl" value={formData.janitorName || ''} onChange={e => handleChange('janitorName', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label" style={{ fontSize: '0.85rem' }}>Teléfono / Celular</label>
                                    <input type="text" className="input" placeholder="11 4444 5555" value={formData.janitorPhone || ''} onChange={e => handleChange('janitorPhone', e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SEGURIDAD */}
                    <div style={{ marginTop: '1rem', border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                                type="checkbox" 
                                id="hasSecurity" 
                                checked={formData.hasSecurity || false}
                                onChange={e => handleChange('hasSecurity', e.target.checked)}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <label htmlFor="hasSecurity" style={{ fontWeight: 600, color: '#374151' }}>
                                El edificio cuenta con Seguridad (Totem / Ojo de Halcón / Presencial)
                            </label>
                        </div>
                        
                        {formData.hasSecurity && (
                            <div style={{ marginTop: '1rem' }}>
                                <label className="label" style={{ fontSize: '0.85rem' }}>Contacto de Seguridad</label>
                                <input type="text" className="input" placeholder="Nombre completo, teléfono o instrucciones" value={formData.securityContact || ''} onChange={e => handleChange('securityContact', e.target.value)} />
                            </div>
                        )}
                    </div>

                    {/* CONSORCIO */}
                    <div style={{ marginTop: '1rem', border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '0.5rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontWeight: 600, color: '#374151' }}>
                                Administración del Consorcio
                            </label>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label" style={{ fontSize: '0.85rem' }}>Teléfono / Contacto</label>
                                <input type="text" className="input" placeholder="Ej: 4444-5555" value={formData.buildingAdminContact || ''} onChange={e => handleChange('buildingAdminContact', e.target.value)} />
                            </div>
                            <div>
                                <label className="label" style={{ fontSize: '0.85rem' }}>Email</label>
                                <input type="email" className="input" placeholder="consorcio@edificio.com" value={formData.buildingAdminEmail || ''} onChange={e => handleChange('buildingAdminEmail', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </section>
                
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                            type="checkbox" 
                            id="isRented" 
                            checked={formData.isRented || false}
                            onChange={e => handleChange('isRented', e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <label htmlFor="isRented" style={{ fontWeight: 500 }}>
                            Habilitar Opciones de Alquiler para esta Propiedad
                        </label>
                    </div>
                    {formData.isRented && (
                         <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                             Una vez creada la propiedad, podrás configurar el Contrato de Alquiler en el Tablero de la Propiedad.
                         </div>
                    )}
                </section>

                <section className="card">
                    <h3>Fotos (Cloudinary)</h3>
                    <div className="image-upload-container">
                        <div className="image-grid">
                            {formData.images?.map((url, index) => (
                                <div key={index} className="image-preview" style={{ position: 'relative' }}>
                                    <img src={url} alt={`Foto ${index + 1}`} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                                    <button
                                        type="button"
                                        style={{ position: 'absolute', top: 5, right: 5, background: 'red', color: 'white', borderRadius: '50%', border: 'none', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        onClick={() => handleRemoveImage(index)}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', height: '150px', borderRadius: '8px', cursor: 'pointer', background: '#f9f9f9' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                    hidden
                                />
                                {uploading ? (
                                    <span style={{ color: '#666' }}>Subiendo...</span>
                                ) : (
                                    <>
                                        <Upload size={24} style={{ color: '#666', marginBottom: '8px' }} />
                                        <span style={{ color: '#666' }}>Agregar Foto</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
                        <Save size={20} />
                        {loading ? 'Guardando en Firestore...' : 'Guardar Propiedad'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PropertyForm;
