import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { TenantContract, User } from '../types';
import { mockService } from '../services/mockData';
import { ArrowLeft, Save } from 'lucide-react';

const TenantForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tenants, setTenants] = useState<User[]>([]);
    const [formData, setFormData] = useState<Partial<TenantContract>>({
        startDate: '',
        endDate: '',
        amount: 0,
        currency: 'ARS',
        updateFrequencyMonths: 6,
        tenantId: ''
    });

    useEffect(() => {
        // Load potential tenants (users with role 'tenant')
        const allUsers = mockService.getUsers();
        setTenants(allUsers.filter(u => u.role === 'tenant'));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !formData.tenantId) return;

        const contract: TenantContract = {
            ...formData,
            id: Math.random().toString(36).substr(2, 9),
            propertyId: id,
            isActive: true,
            nextUpdateDate: '', // Calculate based on start date + frequency
        } as TenantContract;

        mockService.addContract(contract);
        navigate(`/properties/${id}`);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(`/properties/${id}`)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: '1.5rem' }}>Nuevo Contrato de Alquiler</h2>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label className="label">Inquilino</label>
                    <select
                        className="input"
                        value={formData.tenantId}
                        onChange={e => setFormData({ ...formData, tenantId: e.target.value })}
                        required
                    >
                        <option value="">Seleccionar Inquilino</option>
                        {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                        ))}
                    </select>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                        * Solo aparecen usuarios registrados como Inquilinos
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="label">Fecha Inicio</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Fecha Fin</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.endDate}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="label">Monto Alquiler</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Moneda</label>
                        <select
                            className="input"
                            value={formData.currency}
                            onChange={e => setFormData({ ...formData, currency: e.target.value as any })}
                        >
                            <option value="ARS">ARS</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label">Actualización (Meses)</label>
                    <input
                        type="number"
                        className="input"
                        value={formData.updateFrequencyMonths}
                        onChange={e => setFormData({ ...formData, updateFrequencyMonths: parseInt(e.target.value) })}
                        min="1"
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(`/properties/${id}`)}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                        <Save size={20} />
                        Crear Contrato
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TenantForm;
