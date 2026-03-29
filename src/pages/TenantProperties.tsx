import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import type { Property } from '../types';
import PropertyCard from '../components/PropertyCard';
import { Key } from 'lucide-react';

const TenantProperties: React.FC = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [linking, setLinking] = useState(false);

    const loadRentedProperties = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const props = await propertyService.getRentingProperties(user.id);
            setProperties(props);
        } catch (error) {
            console.error("Error fetching rented properties", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRentedProperties();
    }, [user]);

    const handleLinkContract = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = window.prompt("Ingresa el ID de Contrato que te pasó el propietario:");
        if (!code || !code.trim()) return;

        setLinking(true);
        try {
            const success = await propertyService.linkTenantToContract(code.trim(), user!.id);
            if (success) {
                alert("¡Propiedad vinculada exitosamente!");
                await loadRentedProperties();
            } else {
                alert("ID de contrato no encontrado o inválido. Revisa el código con el propietario.");
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al intentar vincular.");
        } finally {
            setLinking(false);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#202124' }}>Propiedades Alquiladas por Mí</h1>
                <button onClick={handleLinkContract} disabled={linking} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Key size={18} />
                    {linking ? 'Vinculando...' : 'Vincular nuevo alquiler'}
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#5f6368' }}>Cargando tus alquileres...</div>
            ) : properties.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#9aa0a6' }}>
                    <Key size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '1.2rem', color: '#5f6368' }}>Aún no tienes propiedades alquiladas vinculadas.</p>
                    <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>Pídele al propietario el <strong>ID de Vinculación del Contrato</strong> y haz clic en el botón superior derecho.</p>
                </div>
            ) : (
                <div className="grid">
                    {properties.map(property => (
                        <PropertyCard key={property.id} property={property} hasActiveContract={true} /> 
                    ))}
                </div>
            )}
        </div>
    );
};

export default TenantProperties;
