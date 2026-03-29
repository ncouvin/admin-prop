import React, { useState, useEffect } from 'react';
import { propertyService } from '../services/propertyService';
import { indexService } from '../services/indexService';
import type { RentalContract } from '../types';
import { Save, Calendar } from 'lucide-react';

interface Props {
    propertyId: string;
}

const RentalContractForm: React.FC<Props> = ({ propertyId }) => {
    const [contract, setContract] = useState<RentalContract | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [accumulatedIndex, setAccumulatedIndex] = useState<number>(0);
    
    // Estados para la proyeccion autogenerada (Versión C)
    const [isEstimatedText, setIsEstimatedText] = useState(false);
    const [isAutoCalculating, setIsAutoCalculating] = useState(false);

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
                
                if (active.updateIndex !== 'FIJO') {
                    // Start auto-calculating as requested in version c
                    setIsAutoCalculating(true);
                    try {
                        // The target date is the next actual update date
                        const start = new Date(active.startDate);
                        const today = new Date();
                        let m = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
                        if (today.getDate() < start.getDate()) m--;
                        if (m < 0) m = 0;
                        const pPassed = Math.floor(m / active.updateFrequencyMonths);
                        const nextUpdate = new Date(start);
                        nextUpdate.setMonth(start.getMonth() + (pPassed + 1) * active.updateFrequencyMonths);
                        
                        // We ask the indexService to calculate from start up to nextUpdate
                        const indexStatus = await indexService.calculateAccumulatedIndex(start, nextUpdate);
                        setAccumulatedIndex(indexStatus.accumulatedPercent);
                        setIsEstimatedText(indexStatus.isEstimated);
                    } catch (err) {
                        console.error("Auto calculation failed", err);
                    } finally {
                        setIsAutoCalculating(false);
                    }
                }
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

    const calculateRentStatus = () => {
        if (!contract) return null;
        
        const start = new Date(contract.startDate);
        const today = new Date();
        
        let monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
        if (today.getDate() < start.getDate()) {
            monthsPassed--;
        }
        
        if (monthsPassed < 0) monthsPassed = 0;

        const periodsPassed = Math.floor(monthsPassed / contract.updateFrequencyMonths);
        
        const nextUpdateDate = new Date(start);
        nextUpdateDate.setMonth(start.getMonth() + (periodsPassed + 1) * contract.updateFrequencyMonths);

        let currentAmount = contract.rentAmount;
        let estimatedNextValue = contract.rentAmount;

        const isFixed = contract.updateIndex === 'FIJO';

        if (!isFixed) {
            // Valor actual estimado si ya pasaron periodos y el usuario ingresó un índice
            currentAmount = contract.rentAmount * (1 + (accumulatedIndex / 100));
            // Al ser una proyección básica en MVP, proyectamos el mismo valor calculado para el próximo.
            estimatedNextValue = currentAmount; 
        }

        return {
            nextUpdateDate,
            periodsPassed,
            currentAmount,
            estimatedNextValue,
            isFixed
        };
    };

    const statusObj = calculateRentStatus();

    return (
        <div className="card">
            <h3 style={{ marginBottom: '1.5rem', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} />
                {contract ? 'Contrato Vigente' : 'Configurar Nuevo Contrato'}
            </h3>

            {contract && statusObj && (
                <div style={{ backgroundColor: '#e6f4ea', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #ceead6' }}>
                    <div style={{ color: '#188038', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem' }}>
                        Contrato Activo: {new Date(contract.startDate).toLocaleDateString()} al {new Date(contract.endDate).toLocaleDateString()}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>Próxima Actualización</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#3c4043' }}>
                                {statusObj.nextUpdateDate.toLocaleDateString()}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#5f6368', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                Valor Proyectado ({contract.currency}) 
                                {!statusObj.isFixed && isEstimatedText && <span style={{ color: '#ea8600', fontSize: '0.75rem', fontWeight: 'bold' }}>(Estimativo)</span>}
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a73e8' }}>
                                {isAutoCalculating ? 'Calculando...' : `${contract.currency} ${statusObj.currentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                            </div>
                        </div>
                    </div>

                    {!statusObj.isFixed && (
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: '#3c4043', fontWeight: 500 }}>
                                Índice auto-proyectado de ajuste ({contract.updateIndex}):
                            </label>
                            <input 
                                type="number" 
                                className="input" 
                                style={{ width: '80px', padding: '0.25rem 0.5rem', height: 'auto' }}
                                value={accumulatedIndex.toFixed(2)}
                                onChange={e => {
                                   setIsEstimatedText(false); // They overrode it manually
                                   setAccumulatedIndex(parseFloat(e.target.value) || 0)
                                }}
                                disabled={isAutoCalculating}
                            />
                            <span style={{ color: '#5f6368', fontSize: '0.9rem' }}>% acumulado</span>
                        </div>
                    )}
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
