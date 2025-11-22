import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Income, TenantContract } from '../types';
import { mockService } from '../services/mockData';
import { ArrowLeft, Save } from 'lucide-react';

const IncomeForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contracts, setContracts] = useState<TenantContract[]>([]);
    const [formData, setFormData] = useState<Partial<Income>>({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        currency: 'ARS',
        period: '',
        status: 'confirmed',
        tenantId: ''
    });

    useEffect(() => {
        if (id) {
            const propertyContracts = mockService.getContracts(id);
            setContracts(propertyContracts.filter(c => c.isActive));
            // Auto-select active tenant if exists
            const activeContract = propertyContracts.find(c => c.isActive);
            if (activeContract) {
                setFormData(prev => ({
                    ...prev,
                    tenantId: activeContract.tenantId,
                    amount: activeContract.amount,
                    currency: activeContract.currency
                }));
            }
        }
    }, [id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !formData.tenantId) return;

        const income: Income = {
            ...formData,
            id: Math.random().toString(36).substr(2, 9),
            propertyId: id,
        } as Income;

        mockService.addIncome(income);
        navigate(`/properties/${id}`);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(`/properties/${id}`)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: '1.5rem' }}>Registrar Cobro de Alquiler</h2>
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
                        {contracts.map(c => {
                            const tenant = mockService.getUsers().find(u => u.id === c.tenantId);
                            return <option key={c.id} value={c.tenantId}>{tenant?.name} (Contrato Activo)</option>
                        })}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="label">Fecha de Cobro</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Periodo (Mes/Año)</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.period}
                            onChange={e => setFormData({ ...formData, period: e.target.value })}
                            placeholder="Ej: Marzo 2024"
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="label">Monto</label>
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
                    <label className="label">Estado</label>
                    <select
                        className="input"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    >
                        <option value="confirmed">Confirmado</option>
                        <option value="pending">Pendiente</option>
                    </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(`/properties/${id}`)}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                        <Save size={20} />
                        Registrar Cobro
                    </button>
                </div>
            </form>
        </div>
    );
};

export default IncomeForm;
