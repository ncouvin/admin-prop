import React, { useState, useEffect } from 'react';
import { propertyService } from '../services/propertyService';
import type { RentalContract } from '../types';
import { Save, Calendar } from 'lucide-react';

interface Props {
    propertyId: string;
}

const RentalContractForm: React.FC<Props> = ({ propertyId }) => {
    const [contract, setContract] = useState<RentalContract | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<Partial<RentalContract>>({
        currency: 'USD',
        updateFrequencyMonths: "6" as any,
        updateIndex: 'ICL',
        startDate: '',
        endDate: '',
        rentAmount: 0
    });

    const loadContract = async () => {
        setLoading(true);
        try {
            const active = await propertyService.getActiveRentalContract(propertyId);
            if (active) {
                setContract(active);
                setFormData(active);
            }
        } catch (error) {
            console.error("Error loading contract", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContract();
    }, [propertyId]);

    const handleChange = (field: keyof RentalContract, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const contractData: Omit<RentalContract, 'propertyId'> = {
                rentAmount: formData.rentAmount || 0,
                currency: formData.currency || 'USD',
                startDate: formData.startDate || '',
                endDate: formData.endDate || '',
                updateFrequencyMonths: Number(formData.updateFrequencyMonths) || 12,
                updateIndex: formData.updateIndex || 'Fijo'
            };

            await propertyService.saveRentalContract(propertyId, contractData);
            alert("Contrato guardado exitosamente");
            await loadContract();
        } catch (error) {
            console.error("Error saving contract", error);
            alert("Error al guardar el contrato.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando contrato...</div>;

    return (
        <div className="card">
            <h3 style={{ marginBottom: '1.5rem', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} />
                {contract ? 'Contrato Vigente' : 'Configurar Nuevo Contrato'}
            </h3>

            {contract && (
                <div style={{ backgroundColor: '#e6f4ea', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#188038', fontWeight: 500 }}>
                    Contrato Activo: Inició {new Date(contract.startDate).toLocaleDateString()}, finaliza el {new Date(contract.endDate).toLocaleDateString()}
                </div>
            )}

            <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label className="label">Valor Inicial Mensual</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                           <select 
                               className="input" 
                               style={{ width: '80px' }}
                               value={formData.currency}
                               onChange={e => handleChange('currency', e.target.value)}
                           >
                               <option value="USD">USD</option>
                               <option value="ARS">ARS</option>
                           </select>
                           <input 
                               type="number" 
                               className="input" 
                               required
                               placeholder="0.00"
                               value={formData.rentAmount || ''}
                               onChange={e => handleChange('rentAmount', parseFloat(e.target.value))}
                           />
                        </div>
                    </div>
                    <div>
                        <label className="label">Índice de Actualización</label>
                        <select 
                           className="input"
                           value={formData.updateIndex}
                           onChange={e => handleChange('updateIndex', e.target.value)}
                        >
                            <option value="ICL">ICL (Índice para Contratos BCRA)</option>
                            <option value="IPC">IPC (Inflación INDEC)</option>
                            <option value="FIJO">Valor Fijo sin ajuste</option>
                            <option value="OTRO">Otro pactado</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label className="label">Fecha de Inicio</label>
                        <input 
                            type="date" 
                            className="input" 
                            required
                            value={formData.startDate}
                            onChange={e => handleChange('startDate', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">Fecha de Finalización</label>
                        <input 
                            type="date" 
                            className="input" 
                            required
                            value={formData.endDate}
                            onChange={e => handleChange('endDate', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">Frecuencia de Ajuste</label>
                        <select 
                           className="input"
                           value={formData.updateFrequencyMonths}
                           onChange={e => handleChange('updateFrequencyMonths', parseInt(e.target.value))}
                        >
                            <option value={3}>Cada 3 meses (Trimestral)</option>
                            <option value={4}>Cada 4 meses (Cuatrimestral)</option>
                            <option value={6}>Cada 6 meses (Semestral)</option>
                            <option value={12}>Cada 12 meses (Anual)</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        <Save size={18} />
                        {saving ? 'Guardando...' : (contract ? 'Renovar / Pisar Contrato' : 'Activar Alquiler')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RentalContractForm;
