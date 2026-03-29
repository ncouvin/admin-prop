import React from 'react';
import type { Property } from '../types';
import { MapPin, Home, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PropertyCardProps {
    property: Property;
    hasActiveContract?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, hasActiveContract }) => {
    const navigate = useNavigate();

    return (
        <div
            className="card"
            style={{ cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
            onClick={() => navigate(`/properties/${property.id}`)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{
                height: '160px',
                backgroundColor: '#f1f3f4',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {property.images && property.images.length > 0 ? (
                    <img src={property.images[0]} alt={property.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <Home size={48} color="#bdc1c6" />
                )}
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#202124', fontWeight: 600 }}>{property.name}</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#5f6368', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <MapPin size={16} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.address}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid #f1f3f4', paddingTop: '1rem' }}>
                <span style={{ 
                    fontSize: '0.85rem', 
                    color: !property.isRented ? '#5f6368' : (hasActiveContract ? '#188038' : '#d93025'), 
                    backgroundColor: !property.isRented ? '#f8f9fa' : (hasActiveContract ? '#e6f4ea' : '#fce8e6'),
                    padding: '0.2rem 0.6rem',
                    borderRadius: '16px',
                    fontWeight: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem' 
                }}>
                    <Key size={14} />
                    {!property.isRented ? 'USO PERSONAL' : (hasActiveContract ? 'ALQUILADA' : 'DISPONIBLE PARA ALQUILAR')}
                </span>
                
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#202124' }}>
                    {property.currency} {property.estimatedValue?.toLocaleString()}
                </span>
            </div>
        </div>
    );
};

export default PropertyCard;
