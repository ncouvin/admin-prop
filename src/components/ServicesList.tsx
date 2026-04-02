import React, { useState, useEffect } from 'react';
import { propertyService } from '../services/propertyService';
import { uploadToCloudinary } from '../services/cloudinary';
import type { PropertyService, ServiceFrequency, ServicePayment } from '../types';
import { Plus, Trash2, Upload, ExternalLink, CheckCircle, Clock, Edit2, Save, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    propertyId: string;
    isTenantView?: boolean;
}

const ServicesList: React.FC<Props> = ({ propertyId, isTenantView = false }) => {
    const [services, setServices] = useState<PropertyService[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null); // Guardará 'serviceId-month' si sube

    // Estado del formulario para crear un servicio nuevo
    const [newServiceName, setNewServiceName] = useState('');
    const [newProviderName, setNewProviderName] = useState('');
    const [newAccountNumber, setNewAccountNumber] = useState('');
    const [newFrequency, setNewFrequency] = useState<ServiceFrequency>('Mensual');
    const [newDueDate, setNewDueDate] = useState<number | ''>(10);

    const navigate = useNavigate();

    // Estado de Edición Inline
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<PropertyService>>({});

    // Estado de pagos indexado: pagos[serviceId][month]
    const [payments, setPayments] = useState<{ [serviceId: string]: { [month: number]: ServicePayment[] } }>({});
    const currentYear = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const loadData = async () => {
        setLoading(true);
        try {
            const fetchedServs = await propertyService.getPropertyServices(propertyId);
            setServices(fetchedServs);

            // Cargar los pagos para cada servicio para el año en curso
            const payDict: { [serviceId: string]: { [month: number]: ServicePayment[] } } = {};
            
            for (const serv of fetchedServs) {
                payDict[serv.id] = {};
                const sPayments = await propertyService.getServicePayments(propertyId, serv.id, currentYear);
                sPayments.forEach(p => {
                    if (!payDict[serv.id][p.month]) payDict[serv.id][p.month] = [];
                    payDict[serv.id][p.month].push(p);
                });
            }
            setPayments(payDict);
        } catch (error) {
            console.error("Error fetching services", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [propertyId]);

    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newServiceName.trim()) return;

        try {
            await propertyService.addServiceToProperty(propertyId, {
                name: newServiceName,
                providerName: newProviderName,
                accountNumber: newAccountNumber,
                frequency: newFrequency,
                estimatedDueDate: newDueDate ? Number(newDueDate) : undefined
            });
            setNewServiceName('');
            setNewProviderName('');
            setNewAccountNumber('');
            setNewFrequency('Mensual');
            setNewDueDate(10);
            await loadData();
        } catch (error) {
            console.error("Error adding service", error);
            alert("Error al guardar el servicio.");
        }
    };

    const handleSaveEdit = async (serviceId: string) => {
        try {
            await propertyService.updateService(propertyId, serviceId, editForm);
            setEditingId(null);
            await loadData();
        } catch (error) {
            console.error(error);
            alert("Error al actualizar");
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        if (window.confirm("¿Seguro que deseas eliminar este servicio? También se perderá el control de sus pagos.")) {
            await propertyService.deleteService(propertyId, serviceId);
            await loadData();
        }
    };

    const handleTogglePaymentStatus = async (serviceId: string, month: number, currentPayment?: ServicePayment) => {
        if (isTenantView) return; // Inquilinos no pueden cambiar estado manual, solo subiendo fotos
        const newStatus = currentPayment?.status === 'paid' ? 'pending' : 'paid';
        
        const paymentData: ServicePayment = {
            id: currentPayment?.id || '',
            serviceId,
            propertyId,
            year: currentYear,
            month,
            status: newStatus,
            receiptUrl: currentPayment?.receiptUrl
        };

        try {
            await propertyService.saveServicePayment(propertyId, serviceId, paymentData);
            // Hacer full reload es más seguro para obtener los arrays actualizados
            loadData();
        } catch (error) {
            console.error("Error toggle payment", error);
            alert("Error al actualizar pago.");
        }
    };

    const handleUploadReceipt = async (serviceId: string, month: number, e: React.ChangeEvent<HTMLInputElement>, currentPayment?: ServicePayment) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];

        let amountPaid: number | undefined = undefined;
        if (isTenantView) {
            const a = window.prompt("Obligatorio: Ingresa el valor exacto ($) que pagaste en este comprobante:");
            if (!a || isNaN(parseFloat(a))) {
                alert("Debes ingresar un valor numérico válido para subir el comprobante.");
                return;
            }
            amountPaid = parseFloat(a);
        }

        setUploading(`${serviceId}-${month}`);
        
        try {
            const url = await uploadToCloudinary(file);
            
            const paymentData: ServicePayment = {
                id: currentPayment?.id || '',
                serviceId,
                propertyId,
                year: currentYear,
                month,
                status: 'paid', // Asumimos pagado si sube comprobante
                receiptUrl: url,
                paymentDate: new Date().toISOString(),
                amount: amountPaid
            };

            await propertyService.saveServicePayment(propertyId, serviceId, paymentData);
            await loadData(); // Full reload to get DB states
            
        } catch (error: any) {
            console.error("Upload fail", error);
            alert(`Fallo al subir comprobante: ${error.message || "Desconocido"}`);
        } finally {
            setUploading(null);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando grilla de servicios...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Alta de servicio */}
            {!isTenantView && (
                <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#202124', fontSize: '1.2rem' }}>Dar de alta nuevo Servicio / Impuesto</h3>
                    <form onSubmit={handleAddService} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label className="label">Nombre del Servicio</label>
                        <input type="text" className="input" required placeholder="Ej: Expensas, ARBA, AYSA..." value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label className="label">Empresa (Opcional)</label>
                        <input type="text" className="input" placeholder="Ej: Edesur, Metrogas..." value={newProviderName} onChange={e => setNewProviderName(e.target.value)} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label className="label">Nro Cuenta/Ref</label>
                        <input type="text" className="input" placeholder="Nro opcional..." value={newAccountNumber} onChange={e => setNewAccountNumber(e.target.value)} />
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                        <label className="label">Frecuencia</label>
                        <select className="input" value={newFrequency} onChange={e => setNewFrequency(e.target.value as ServiceFrequency)}>
                            <option value="Mensual">Mensual</option>
                            <option value="Bimestral">Bimestral</option>
                            <option value="Trimestral">Trimestral</option>
                            <option value="Semestral">Semestral</option>
                            <option value="Anual">Anual</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '100px' }}>
                        <label className="label">Vto (Día)</label>
                        <input type="number" min="1" max="31" className="input" placeholder="10" value={newDueDate} onChange={e => setNewDueDate(Number(e.target.value) || '')} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 1.5rem' }}>
                        <Plus size={18} /> Agregar
                    </button>
                </form>
            </div>
            )}

            {/* Listado de Servicios y Control Mensual */}
            {services.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#5f6368', border: '1px dashed #dadce0', borderRadius: '8px' }}>
                    Esta propiedad todavía no tiene impuestos ni servicios registrados para controlar.
                </div>
            ) : (
                <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #dadce0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f3f4', borderBottom: '2px solid #dadce0' }}>
                                <th style={{ padding: '1rem', color: '#202124' }}>Servicio</th>
                                <th style={{ padding: '1rem', color: '#5f6368', fontSize: '0.9rem', width: '250px' }}>Detalles de Cuenta</th>
                                <th style={{ padding: '1rem', color: '#202124', textAlign: 'center' }} colSpan={12}>
                                    Control de Pagos ({currentYear})
                                </th>
                                {!isTenantView && <th style={{ padding: '1rem', textAlign: 'center', width: '60px' }}>Acción</th>}
                            </tr>
                            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
                                <th></th>
                                <th></th>
                                {months.map(m => (
                                    <th key={m} style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#5f6368', width: '50px' }}>
                                        {new Date(currentYear, m - 1).toLocaleString('es', { month: 'short' }).toUpperCase()}
                                    </th>
                                ))}
                                {!isTenantView && <th></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {services.map(srv => {
                                const isEditing = editingId === srv.id;
                                return (
                                <tr key={srv.id} style={{ borderBottom: '1px solid #dadce0', backgroundColor: isEditing ? '#f8f9fa' : 'transparent' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600, color: '#1a73e8' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                                            {isEditing ? (
                                                <input type="text" className="input" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ padding: '0.3rem', width: '120px' }} />
                                            ) : (
                                                <span style={{ fontSize: '1.1rem' }}>{srv.name}</span>
                                            )}
                                            
                                            <button onClick={() => navigate(`/properties/${propertyId}/services/${srv.id}`, { state: { isTenantView } })} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem', height: 'auto', backgroundColor: '#e8f0fe', color: '#1a73e8', border: '1px solid #1a73e8' }}>
                                                <FileText size={14} /> Historial y Comprobantes
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#5f6368' }}>
                                        {isEditing ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <input type="text" className="input" placeholder="Proveedor" value={editForm.providerName || ''} onChange={e => setEditForm({...editForm, providerName: e.target.value})} style={{ padding: '0.3rem' }} />
                                                <input type="text" className="input" placeholder="Nro Cuenta" value={editForm.accountNumber || ''} onChange={e => setEditForm({...editForm, accountNumber: e.target.value})} style={{ padding: '0.3rem' }} />
                                                <select className="input" value={editForm.frequency || 'Mensual'} onChange={e => setEditForm({...editForm, frequency: e.target.value as ServiceFrequency})} style={{ padding: '0.3rem' }}>
                                                    <option>Mensual</option><option>Bimestral</option><option>Trimestral</option><option>Anual</option>
                                                </select>
                                                <input type="number" className="input" placeholder="Día Vto" value={editForm.estimatedDueDate || ''} onChange={e => setEditForm({...editForm, estimatedDueDate: Number(e.target.value)})} style={{ padding: '0.3rem' }} />
                                            </div>
                                        ) : (
                                            <>
                                                {srv.providerName && <div><span style={{ fontWeight: 500 }}>Prov:</span> {srv.providerName}</div>}
                                                {srv.accountNumber && <div><span style={{ fontWeight: 500 }}>Ref:</span> {srv.accountNumber}</div>}
                                                <div style={{ marginTop: '0.2rem', color: '#1a73e8', fontWeight: 500 }}>
                                                    {srv.frequency || 'Mensual'} {srv.estimatedDueDate ? `(Vto día ${srv.estimatedDueDate})` : ''}
                                                </div>
                                            </>
                                        )}
                                    </td>
                                    
                                    {months.map(m => {
                                        const monthPayments = payments[srv.id]?.[m] || [];
                                        const isPaid = monthPayments.some(p => p.status === 'paid');
                                        const totalAmount = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                                        const firstReceipt = monthPayments.find(p => p.receiptUrl)?.receiptUrl;
                                        const referencePayment = monthPayments.length > 0 ? monthPayments[0] : undefined;
                                        
                                        const isUploading = uploading === `${srv.id}-${m}`;

                                        return (
                                            <td key={m} style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                                    {/* Toggle Button */}
                                                    <button 
                                                        onClick={() => handleTogglePaymentStatus(srv.id, m, referencePayment)}
                                                        title={isPaid ? "Marcar Pendiente" : "Marcar Pagado"}
                                                        disabled={isTenantView}
                                                        style={{ background: 'none', border: 'none', cursor: isTenantView ? 'default' : 'pointer', padding: '4px', borderRadius: '50%', backgroundColor: isPaid ? '#e6f4ea' : '#fce8e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        {isPaid ? <CheckCircle size={18} color="#188038" /> : <Clock size={18} color="#d93025" />}
                                                    </button>
                                                    
                                                    {/* Receipt Logic */}
                                                    {firstReceipt ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <a href={firstReceipt} target="_blank" rel="noreferrer" title="Ver Comprobante Principal" style={{ color: '#1a73e8' }}>
                                                                <ExternalLink size={14} />
                                                            </a>
                                                            {totalAmount > 0 && (
                                                                <div style={{ fontSize: '0.65rem', color: '#1a73e8', fontWeight: 600 }}>${totalAmount.toLocaleString()}</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <label title="Subir Comprobante" style={{ cursor: isUploading ? 'wait' : 'pointer', color: '#9aa0a6' }}>
                                                            <Upload size={14} style={{ opacity: isUploading ? 0.5 : 1 }} />
                                                            <input 
                                                                type="file" 
                                                                accept="image/*,.pdf" 
                                                                hidden 
                                                                disabled={isUploading}
                                                                onChange={(e) => handleUploadReceipt(srv.id, m, e, referencePayment)}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}

                                    {!isTenantView && (
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                                                {isEditing ? (
                                                    <button onClick={() => handleSaveEdit(srv.id)} style={{ background: '#e6f4ea', border: '1px solid #188038', cursor: 'pointer', color: '#188038', borderRadius: '4px', padding: '6px' }} title="Guardar">
                                                        <Save size={16} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => { setEditingId(srv.id); setEditForm(srv); }} style={{ background: '#f1f3f4', border: '1px solid #dadce0', cursor: 'pointer', color: '#5f6368', borderRadius: '4px', padding: '6px' }} title="Editar">
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                
                                                <button onClick={() => handleDeleteService(srv.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d93025' }} title="Eliminar Servicio">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
};

export default ServicesList;
