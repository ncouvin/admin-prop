import React, { useState, useEffect } from 'react';
import { propertyService } from '../services/propertyService';
import { uploadToCloudinary } from '../services/cloudinary';
import type { PropertyService, ServicePayment } from '../types';
import { Plus, Trash2, Upload, ExternalLink, CheckCircle, Clock } from 'lucide-react';

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

    // Estado de pagos indexado: pagos[serviceId][month]
    const [payments, setPayments] = useState<{ [serviceId: string]: { [month: number]: ServicePayment } }>({});
    const currentYear = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const loadData = async () => {
        setLoading(true);
        try {
            const fetchedServs = await propertyService.getPropertyServices(propertyId);
            setServices(fetchedServs);

            // Cargar los pagos para cada servicio para el año en curso
            const payDict: { [serviceId: string]: { [month: number]: ServicePayment } } = {};
            
            for (const serv of fetchedServs) {
                payDict[serv.id] = {};
                const sPayments = await propertyService.getServicePayments(propertyId, serv.id, currentYear);
                sPayments.forEach(p => {
                    payDict[serv.id][p.month] = p;
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
                accountNumber: newAccountNumber
            });
            setNewServiceName('');
            setNewProviderName('');
            setNewAccountNumber('');
            await loadData();
        } catch (error) {
            console.error("Error adding service", error);
            alert("Error al guardar el servicio.");
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
            // Refresco local de estado optimista
            setPayments(prev => ({
                ...prev,
                [serviceId]: {
                    ...prev[serviceId],
                    [month]: paymentData
                }
            }));
            if (!paymentData.id) loadData(); // Reload for real IDs if it was new
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
            
        } catch (error) {
            console.error("Upload fail", error);
            alert("Fallo al subir comprobante.");
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
                        <label className="label">Nro de Cliente / Medidor</label>
                        <input type="text" className="input" placeholder="Nro opcional..." value={newAccountNumber} onChange={e => setNewAccountNumber(e.target.value)} />
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
                            {services.map(srv => (
                                <tr key={srv.id} style={{ borderBottom: '1px solid #dadce0' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600, color: '#1a73e8' }}>{srv.name}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#5f6368' }}>
                                        {srv.providerName && <div><span style={{ fontWeight: 500 }}>Prov:</span> {srv.providerName}</div>}
                                        {srv.accountNumber && <div><span style={{ fontWeight: 500 }}>Ref:</span> {srv.accountNumber}</div>}
                                    </td>
                                    
                                    {months.map(m => {
                                        const payment = payments[srv.id]?.[m];
                                        const isPaid = payment?.status === 'paid';
                                        const isUploading = uploading === `${srv.id}-${m}`;

                                        return (
                                            <td key={m} style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                                    {/* Toggle Button */}
                                                    <button 
                                                        onClick={() => handleTogglePaymentStatus(srv.id, m, payment)}
                                                        title={isPaid ? "Marcar Pendiente" : "Marcar Pagado"}
                                                        disabled={isTenantView}
                                                        style={{ background: 'none', border: 'none', cursor: isTenantView ? 'default' : 'pointer', padding: '4px', borderRadius: '50%', backgroundColor: isPaid ? '#e6f4ea' : '#fce8e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        {isPaid ? <CheckCircle size={18} color="#188038" /> : <Clock size={18} color="#d93025" />}
                                                    </button>
                                                    
                                                    {/* Receipt Logic */}
                                                    {payment?.receiptUrl ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <a href={payment.receiptUrl} target="_blank" rel="noreferrer" title="Ver Comprobante" style={{ color: '#1a73e8' }}>
                                                                <ExternalLink size={14} />
                                                            </a>
                                                            {payment.amount !== undefined && (
                                                                <div style={{ fontSize: '0.65rem', color: '#1a73e8', fontWeight: 600 }}>${payment.amount}</div>
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
                                                                onChange={(e) => handleUploadReceipt(srv.id, m, e, payment)}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}

                                    {!isTenantView && (
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button onClick={() => handleDeleteService(srv.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d93025' }} title="Eliminar Servicio">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ServicesList;
