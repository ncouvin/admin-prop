import React, { useState, useEffect } from 'react';
import { propertyService } from '../services/propertyService';
import { indexService } from '../services/indexService';
import { uploadToCloudinary } from '../services/cloudinary';
import type { RentalContract } from '../types';
import { Save, Calendar, StickyNote, Upload, FileText, X } from 'lucide-react';

import RentPaymentsList from './RentPaymentsList';
import ContractMessages from './ContractMessages';

interface Props {
    propertyId: string;
    isTenantView?: boolean;
}

const RentalContractForm: React.FC<Props> = ({ propertyId, isTenantView = false }) => {
    const [contract, setContract] = useState<RentalContract | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [accumulatedIndex, setAccumulatedIndex] = useState<number>(0);
    
    // Estados para la proyeccion autogenerada (Versión C)
    const [isEstimatedText, setIsEstimatedText] = useState(false);
    const [isAutoCalculating, setIsAutoCalculating] = useState(false);

    const [allContracts, setAllContracts] = useState<RentalContract[]>([]);
    const [viewingOldContractId, setViewingOldContractId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState<Partial<RentalContract>>({
        currency: 'USD',
        updateFrequencyMonths: "6" as any,
        updateIndex: 'ICL',
        startDate: '',
        endDate: '',
        rentAmount: 0,
        notes: ''
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
            } else {
                setContract(null); // Explicit reset if no active found
            }

            const all = await propertyService.getAllRentalContracts(propertyId);
            setAllContracts(all);
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        try {
            const file = e.target.files[0];
            const url = await uploadToCloudinary(file);
            handleChange('guaranteeUrl', url);
        } catch (error) {
            console.error("Error uploading file: ", error);
            alert("Error al subir archivo a Cloudinary.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const contractData: Partial<RentalContract> = {
                rentAmount: formData.rentAmount || 0,
                currency: formData.currency || 'USD',
                startDate: formData.startDate || '',
                endDate: formData.endDate || '',
                updateFrequencyMonths: Number(formData.updateFrequencyMonths) || 12,
                updateIndex: formData.updateIndex || 'Fijo',
                tenantName: formData.tenantName || '',
                tenantPhone: formData.tenantPhone || '',
                tenantEmail: formData.tenantEmail || '',
                securityDepositAmount: Number(formData.securityDepositAmount) || 0,
                guaranteeUrl: formData.guaranteeUrl || '',
                notes: formData.notes || ''
            };

            if (contract && contract.id) {
                await propertyService.updateRentalContract(propertyId, contract.id, contractData);
                alert("Cambios guardados exitosamente en el contrato vigente.");
            } else {
                await propertyService.saveRentalContract(propertyId, contractData as Omit<RentalContract, 'propertyId'>);
                alert("Nuevo alquiler activado exitosamente.");
            }
            await loadContract();
        } catch (error) {
            console.error("Error saving contract", error);
            alert("Error al guardar el contrato.");
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async () => {
        if (!contract || !contract.id) return;
        if (!window.confirm("¿Seguro que deseas dar de baja este contrato?\nPasará al historial antiguo, dejando el espacio libre para cargar un nuevo alquiler.")) return;
        
        setSaving(true);
        try {
            await propertyService.updateRentalContract(propertyId, contract.id, { active: false });
            setContract(null);
            setFormData({ currency: 'USD', updateFrequencyMonths: 6, updateIndex: 'ICL', startDate: '', endDate: '', rentAmount: 0, tenantName: '', tenantPhone: '', tenantEmail: '', notes: '' });
            await loadContract();
        } catch (err) {
            console.error(err);
            alert("Error al archivar.");
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
            <h3 style={{ marginBottom: '1.5rem', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} />
                    {contract ? 'Contrato Vigente' : 'Configurar Nuevo Contrato'}
                </div>
                {contract && contract.id && !isTenantView && (
                    <button 
                        onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(contract.id!); alert("ID de contrato copiado al portapapeles (" + contract.id + ")"); }}
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', height: 'auto', backgroundColor: '#e8f0fe', color: '#1a73e8' }}
                        title="Dile a tu inquilino que ingrese este ID en su cuenta para vincular el alquiler."
                    >
                        Copiar ID de Vinculación para Inquilino
                    </button>
                )}
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
                        
                        {(contract.securityDepositAmount || contract.guaranteeUrl) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid #ceead6', paddingLeft: '1rem' }}>
                                {contract.securityDepositAmount && (
                                    <>
                                        <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>Depósito en Garantía Original</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#3c4043' }}>
                                            {contract.currency} {contract.securityDepositAmount.toLocaleString()}
                                        </div>
                                    </>
                                )}
                                {contract.guaranteeUrl && (
                                    <div style={{ marginTop: '0.2rem' }}>
                                        <a href={contract.guaranteeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <FileText size={14} /> Ver Caución / Seguro
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
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

            {!isTenantView && (
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label className="label" style={{ color: '#1a73e8' }}>Nombre y Apellido (Inquilino)</label>
                            <input type="text" className="input" placeholder="Nombre completo..." value={formData.tenantName || ''} onChange={e => handleChange('tenantName', e.target.value)} />
                        </div>
                        <div>
                            <label className="label" style={{ color: '#1a73e8' }}>Teléfono / WhatsApp</label>
                            <input type="text" className="input" placeholder="Ej: +54 9 11..." value={formData.tenantPhone || ''} onChange={e => handleChange('tenantPhone', e.target.value)} />
                        </div>
                        <div>
                            <label className="label" style={{ color: '#1a73e8' }}>Email Secundario</label>
                            <input type="email" className="input" placeholder="correo@ejemplo.com" value={formData.tenantEmail || ''} onChange={e => handleChange('tenantEmail', e.target.value)} />
                        </div>
                    </div>

                    {!isTenantView && (
                        <div style={{ marginBottom: '1.5rem', backgroundColor: '#fff8e1', padding: '1rem', borderRadius: '8px', border: '1px solid #fde293' }}>
                            <label className="label" style={{ color: '#ea8600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <StickyNote size={18} />
                                Notas del Propietario (Privado)
                            </label>
                            <textarea
                                className="input"
                                rows={3}
                                placeholder="Escribe anotaciones solo visibles para ti..."
                                value={formData.notes || ''}
                                onChange={e => handleChange('notes', e.target.value)}
                                style={{ backgroundColor: '#fff', border: '1px solid #fde293', resize: 'vertical' }}
                            ></textarea>
                            <div style={{ fontSize: '0.75rem', color: '#ea8600', marginTop: '0.5rem' }}>
                                El inquilino nunca verá este recuadro ni su contenido.
                            </div>
                        </div>
                    )}

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
                        <label className="label">Depósito en Garantía Inicial</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                           <div className="input" style={{ width: '80px', backgroundColor: '#f1f3f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{formData.currency}</div>
                           <input 
                               type="number" 
                               className="input" 
                               placeholder="0.00"
                               value={formData.securityDepositAmount || ''}
                               onChange={e => handleChange('securityDepositAmount', parseFloat(e.target.value))}
                           />
                        </div>
                    </div>
                    <div>
                        <label className="label">Garantía / Seguro de Caución (PDF/Foto)</label>
                        {formData.guaranteeUrl ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <a href={formData.guaranteeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', backgroundColor: '#eef2ff', borderColor: '#c7d2fe', color: '#4f46e5' }}>
                                    <FileText size={18} /> Ver Garantía
                                </a>
                                <button type="button" className="btn btn-danger" onClick={() => handleChange('guaranteeUrl', null)}>
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <label className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', width: '100%' }}>
                                <Upload size={18} />
                                {uploading ? 'Subiendo...' : 'Subir Documento'}
                                <input type="file" accept=".pdf,image/*" hidden onChange={handleFileUpload} disabled={uploading}/>
                            </label>
                        )}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                    {contract ? (
                        <button type="button" onClick={handleArchive} className="btn btn-secondary" style={{ backgroundColor: '#fce8e6', color: '#d93025', borderColor: '#fce8e6' }} disabled={saving}>
                            Finalizar y Archivar Contrato
                        </button>
                    ) : <div></div>}

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        <Save size={18} />
                        {saving ? 'Guardando...' : (contract ? 'Guardar Cambios Editados' : 'Activar Nuevo Alquiler')}
                    </button>
                </div>
            </form>
            )}

            {contract && contract.id && (
                <>
                    <RentPaymentsList 
                        propertyId={propertyId} 
                        contractId={contract.id} 
                        isTenantView={isTenantView} 
                    />
                    <ContractMessages 
                        propertyId={propertyId} 
                        contractId={contract.id} 
                    />
                </>
            )}

            {!isTenantView && allContracts.filter(c => c.id !== contract?.id).length > 0 && (
                <div style={{ marginTop: '3rem' }}>
                    <h3 style={{ color: '#5f6368', fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #dadce0', paddingBottom: '0.5rem' }}>
                        📜 Historial de Contratos Finalizados
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {allContracts.filter(c => c.id !== contract?.id).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(old => (
                            <div key={old.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dadce0' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#3c4043' }}>{old.tenantName || 'Inquilino S/N'}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>Desde {new Date(old.startDate).toLocaleDateString()} al {new Date(old.endDate).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#1a73e8' }}>{old.currency} {old.rentAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <button onClick={() => setViewingOldContractId(old.id!)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                                        Ver Auditar Pagos Viejos
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewingOldContractId && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
                    <div className="card fade-in" style={{ backgroundColor: '#fff', width: '100%', maxWidth: '900px', borderRadius: '8px', position: 'relative' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#1a73e8' }}>Auditoría de Pagos Viejos</h2>
                        <button onClick={() => setViewingOldContractId(null)} className="btn btn-secondary" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                            Cerrar Historial
                        </button>
                        {/* Renderizamos la grilla de pagos pero para el contrato antiguo */}
                        <RentPaymentsList propertyId={propertyId} contractId={viewingOldContractId} isTenantView={false} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default RentalContractForm;
