import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import type { Property } from '../types';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            if (user) {
                try {
                    const data = await propertyService.getPropertiesByOwner(user.id);
                    setProperties(data);
                } catch (error) {
                    console.error("Error fetching properties:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchProperties();
    }, [user]);

    if (loading) return <div>Cargando tablero...</div>;

    return (
        <div>
            <h2 style={{ marginBottom: '1rem' }}>Hola, {user?.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Propiedades Administradas</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 600 }}>{properties.length}</p>
                </div>
                <div className="card">
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Propiedades Alquiladas</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-success)' }}>
                        {properties.filter(p => p.isRented).length}
                    </p>
                </div>
                <div className="card">
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Valor Total Estimado</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                        US$ {properties.filter(p => p.currency === 'USD').reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
