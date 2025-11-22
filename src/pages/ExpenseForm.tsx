import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Expense } from '../types';
import { mockService } from '../services/mockData';
import { ArrowLeft, Save } from 'lucide-react';

const ExpenseForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Partial<Expense>>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        currency: 'ARS',
        category: 'maintenance',
        isPaid: false
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        const expense: Expense = {
            ...formData,
            id: Math.random().toString(36).substr(2, 9),
            propertyId: id,
        } as Expense;

        mockService.addExpense(expense);
        navigate(`/properties/${id}`);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(`/properties/${id}`)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: '1.5rem' }}>Registrar Nuevo Gasto</h2>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="label">Fecha</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Categoría</label>
                        <select
                            className="input"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                        >
                            <option value="maintenance">Mantenimiento</option>
                            <option value="repair">Reparación</option>
                            <option value="tax">Impuesto</option>
                            <option value="service">Servicio</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label">Descripción</label>
                    <input
                        type="text"
                        className="input"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ej: Reparación de cañería baño"
                        required
                    />
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="checkbox"
                        id="isPaid"
                        checked={formData.isPaid}
                        onChange={e => setFormData({ ...formData, isPaid: e.target.checked })}
                        style={{ width: 'auto' }}
                    />
                    <label htmlFor="isPaid" className="label" style={{ marginBottom: 0, cursor: 'pointer' }}>Marcar como Pagado</label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(`/properties/${id}`)}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                        <Save size={20} />
                        Guardar Gasto
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExpenseForm;
