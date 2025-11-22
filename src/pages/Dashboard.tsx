import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <div>
            <h2 style={{ marginBottom: '1rem' }}>Hola, {user?.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Propiedades Activas</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 600 }}>1</p>
                </div>
                <div className="card">
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Ingresos del Mes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-success)' }}>$0</p>
                </div>
                <div className="card">
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Alertas Pendientes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-warning)' }}>0</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
