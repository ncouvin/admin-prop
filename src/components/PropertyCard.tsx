import React from 'react';
import type { Property } from '../types';
import { MapPin, Home, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PropertyCardProps {
    property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
    const navigate = useNavigate();

    return (
        <div
            className="card"
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => navigate(`/properties/${property.id}`)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{
                height: '160px',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {property.images.length > 0 ? (
                    <img src={property.images[0]} alt={property.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <Home size={48} color="var(--color-text-secondary)" />
                )}
            </div>

            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{property.name}</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <MapPin size={16} />
                <span>{property.address.street}, {property.address.city}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                <UserIcon size={16} />
                <span>{property.tenantId ? 'Alquilado' : 'Disponible'}</span>
            </div>
        </div>
    );
};

export default PropertyCard;
