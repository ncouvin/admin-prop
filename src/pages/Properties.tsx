import React, { useEffect, useState } from 'react';
import type { Property } from '../types';
import { mockService } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Properties: React.FC = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            const data = mockService.getProperties(user.role === 'owner' ? user.id : undefined);
            setProperties(data);
        }
    }, [user]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Mis Propiedades</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Administra tus inmuebles y contratos</p>
                </div>

                {user?.role === 'owner' && (
                    <button className="btn btn-primary" onClick={() => navigate('/properties/new')}>
                        <Plus size={20} />
                        Nueva Propiedad
                    </button>
                )}
            </div>

            {properties.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>No tienes propiedades registradas.</p>
                    {user?.role === 'owner' && (
                        <button className="btn btn-primary" onClick={() => navigate('/properties/new')}>
                            Agregar mi primera propiedad
                        </button>
                    )}
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
