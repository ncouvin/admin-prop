import React, { useEffect, useState } from 'react';
import type { Property } from '../types';
import { propertyService } from '../services/propertyService';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Properties: React.FC = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const loadProperties = async () => {
            if (user) {
                try {
                    const data = await propertyService.getPropertiesByOwner(user.id);
                    setProperties(data);
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
                        <PropertyCard key={prop.id} property={prop} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Properties;
