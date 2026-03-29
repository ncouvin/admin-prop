import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import { uploadToCloudinary } from '../services/cloudinary';
import type { PropertyService, ServicePayment } from '../types';
import { CheckCircle, ArrowUpCircle, FileText, Trash2, ArrowLeft } from 'lucide-react';

const ServicePaymentsPage: React.FC = () => {
    const { id: propertyId, serviceId } = useParams<{ id: string; serviceId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    
    const isTenantView = location.state?.isTenantView || false;

    const [service, setService] = useState<PropertyService | null>(null);
    const [payments, setPayments] = useState<ServicePayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Formulario de Carga
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [amount, setAmount] = useState('');
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    const loadData = async () => {
        if (!propertyId || !serviceId) return;
        setLoading(true);
        try {
            // Cargar el servicio base
            const allSrvs = await propertyService.getPropertyServices(propertyId);
            const foundSrv = allSrvs.find(s => s.id === serviceId);
            if (!foundSrv) {
                alert("No se encontró el servicio.");
                navigate(-1);
                return;
            }
            setService(foundSrv);

            // Cargar pagos
            const py1 = await propertyService.getServicePayments(propertyId, serviceId, currentYear);
            const py2 = await propertyService.getServicePayments(propertyId, serviceId, currentYear - 1);
            
            const allP = [...py1, ...py2];
            allP.sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                return b.month - a.month;
            });
            
            setPayments(allP);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [propertyId, serviceId]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!propertyId || !service) return;
        if (month < 1 || month > 12 || year < 2000) return;
        if (!invoiceFile && !receiptFile) {
            alert("Debes adjuntar al menos la FACTURA o el COMPROBANTE de pago.");
            return;
        }

        setUploading(true);
        try {
            let invUrl = '';
            let recUrl = '';
            
            if (invoiceFile) invUrl = await uploadToCloudinary(invoiceFile);
            if (receiptFile) recUrl = await uploadToCloudinary(receiptFile);

            const existing = payments.find(p => p.month === month && p.year === year);

            const rawData: Partial<ServicePayment> = {
                id: existing?.id || '',
                serviceId: service.id,
                propertyId,
                year,
                month,
                status: (recUrl || existing?.receiptUrl) ? 'paid' : 'pending',
                amount: amount ? parseFloat(amount) : existing?.amount,
                invoiceUrl: invUrl || existing?.invoiceUrl,
                receiptUrl: recUrl || existing?.receiptUrl,
                paymentDate: (recUrl && !existing?.receiptUrl) ? new Date().toISOString() : existing?.paymentDate,
                isVerified: existing?.isVerified || false
            };

            const paymentData = { ...rawData } as ServicePayment;
            Object.keys(paymentData).forEach(key => {
                const k = key as keyof ServicePayment;
                if (paymentData[k] === undefined) delete paymentData[k];
            });

            await propertyService.saveServicePayment(propertyId, service.id, paymentData);
            
            setAmount('');
            setInvoiceFile(null);
            setReceiptFile(null);
            alert("Documentación de servicio guardada exitosamente.");
            await loadData();
        } catch (err: any) {
            console.error("Upload Error:", err);
            alert(`Error de Servidor: ${err.message || "Error al subir el archivo"}`);
        } finally {
            setUploading(false);
        }
    };

    const handleVerify = async (payment: ServicePayment) => {
        if (!propertyId || !service) return;
        if (isTenantView) return; 
        if (!payment.receiptUrl) {
            alert("No se puede verificar si el inquilino aún no subió el comprobante de pago.");
            return;
        }
        if (window.confirm("¿Confirmar que este servicio ha sido pagado y el dinero cuadra?")) {
            await propertyService.saveServicePayment(propertyId, service.id, { ...payment, isVerified: true });
            await loadData();
        }
    };

    const handleDelete = async (paymentId: string) => {
        if (!propertyId || !service) return;
        if (isTenantView) return;
        if (window.confirm("¿Estás seguro de que quieres eliminar completamente este mes? Se perderán las fotos asociadas.")) {
            try {
                await propertyService.deleteServicePayment(propertyId, service.id, paymentId);
                await loadData();
            } catch (err: any) {
                console.error("Delete Error:", err);
                alert(`Error al borrar: ${err.message}`);
            }
        }
    };

    const getMonthName = (m: number) => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return months[m - 1] || '';
    };

    if (loading || !service) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando información del servicio...</div>;
    }

    return (
        <div className="fade-in" style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            
            <button 
                onClick={() => navigate(-1)} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 500, padding: 0 }}
            >
                <ArrowLeft size={20} /> Volver a la Propiedad
            </button>
            
            <div className="card" style={{ backgroundColor: '#fff', padding: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', color: '#1a73e8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={28} /> Documentación de Servicio: {service.name}
                </h2>
                <div style={{ color: '#5f6368', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                    <strong>Referencia:</strong> {service.accountNumber || 'N/A'} &nbsp;|&nbsp; <strong>Proveedor:</strong> {service.providerName || 'N/A'}
                </div>

                {/* Formulario de Carga */}
                <form onSubmit={handleUpload} style={{ backgroundColor: '#fcf8e3', padding: '2rem', borderRadius: '12px', border: '1px solid #faebcc', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '3rem' }}>
                    <div style={{ width: '100%', color: '#8a6d3b', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        📥 Subir Factura Paga o Ticket de Transferencia al Historial
                    </div>
                    
                    <div>
                        <label className="label">Periodo Mensual</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select className="input" style={{ width: '100px' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <option key={i} value={i + 1}>{getMonthName(i + 1)}</option>
                                ))}
                            </select>
                            <input type="number" className="input" style={{ width: '90px' }} value={year} onChange={e => setYear(Number(e.target.value))} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="label">Monto ($)</label>
                        <input type="number" step="0.01" className="input" style={{ width: '150px' }} placeholder="Opcional..." value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: '220px' }}>
                        <label className="label" style={{ color: '#d93025' }}>[A] Subir Factura Física / Boleto</label>
                        <input type="file" className="input" style={{ padding: '0.4rem' }} accept="image/*,.pdf" onChange={e => setInvoiceFile(e.target.files?.[0] || null)} />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: '220px' }}>
                        <label className="label" style={{ color: '#188038' }}>[B] Subir Ticket (HomeBanking)</label>
                        <input type="file" className="input" style={{ padding: '0.4rem' }} accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                    </div>
                    
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={uploading} style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem' }}>
                            {uploading ? '🗜️ Procesando archivos...' : 'Guardar y Anexar al Periodo'}
                        </button>
                    </div>
                </form>

                {/* Historial en Grilla */}
                <h3 style={{ fontSize: '1.4rem', color: '#202124', marginBottom: '1.5rem', borderBottom: '2px solid #f1f3f4', paddingBottom: '0.5rem' }}>
                    Grilla de Pagos y Auditoría
                </h3>
                
                {payments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed #dadce0', borderRadius: '12px', color: '#5f6368', fontSize: '1.1rem' }}>
                        Aquí se irán enlistando mes a mes los recibos que carguen vos o tu inquilino.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f3f4', borderBottom: '2px solid #dadce0' }}>
                                    <th style={{ padding: '1.2rem 1rem', color: '#5f6368' }}>Periodo</th>
                                    <th style={{ padding: '1.2rem 1rem', color: '#202124' }}>Costo Pagado</th>
                                    <th style={{ padding: '1.2rem 1rem', color: '#202124', textAlign: 'center' }}>Factura PDF/Foto</th>
                                    <th style={{ padding: '1.2rem 1rem', color: '#202124', textAlign: 'center' }}>Ticket PDF/Foto</th>
                                    <th style={{ padding: '1.2rem 1rem', color: '#202124', textAlign: 'center' }}>Firma Autorizada</th>
                                    {!isTenantView && <th style={{ padding: '1.2rem 1rem', color: '#202124', textAlign: 'center' }}>Borrar</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(pay => (
                                    <tr key={pay.id} style={{ borderBottom: '1px solid #dadce0', backgroundColor: pay.isVerified ? '#f6fdf6' : '#fff', transition: 'background-color 0.2s' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600, fontSize: '1.1rem' }}>{getMonthName(pay.month)} / {pay.year}</td>
                                        <td style={{ padding: '1rem', fontWeight: 600, color: '#1a73e8', fontSize: '1.1rem' }}>
                                            {pay.amount ? `$ ${pay.amount.toLocaleString()}` : '-'}
                                        </td>
                                        
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            {pay.invoiceUrl ? (
                                                <a href={pay.invoiceUrl} target="_blank" rel="noreferrer" style={{ color: '#d93025', textDecoration: 'underline', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', backgroundColor: '#fce8e6', borderRadius: '4px' }}>
                                                    <FileText size={18} /> Ver Documento
                                                </a>
                                            ) : <span style={{ color: '#9aa0a6' }}>Pendiente</span>}
                                        </td>
                                        
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            {pay.receiptUrl ? (
                                                <a href={pay.receiptUrl} target="_blank" rel="noreferrer" style={{ color: '#188038', textDecoration: 'underline', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', backgroundColor: '#e6f4ea', borderRadius: '4px' }}>
                                                    <CheckCircle size={18} /> Ver Documento
                                                </a>
                                            ) : <span style={{ color: '#9aa0a6' }}>Sin declarar</span>}
                                        </td>
                                        
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            {pay.isVerified ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#188038', backgroundColor: '#e6f4ea', padding: '0.4rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                    <CheckCircle size={16} /> Aprobado OK
                                                </span>
                                            ) : (
                                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#d93025', backgroundColor: '#fce8e6', padding: '0.4rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                        <ArrowUpCircle size={16} /> Revisión
                                                    </span>
                                                    {!isTenantView && (
                                                        <button onClick={() => handleVerify(pay)} style={{ background: '#ceead6', border: '1px solid #188038', cursor: 'pointer', color: '#188038', borderRadius: '6px', padding: '6px' }} title="Autorizar e invisibilizar a inquilino">
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        
                                        {!isTenantView && (
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => handleDelete(pay.id)} 
                                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #dadce0', cursor: 'pointer', color: '#d93025', borderRadius: '6px', padding: '0.6rem', transition: 'all 0.2s' }} 
                                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fce8e6'; e.currentTarget.style.borderColor = '#d93025'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#dadce0'; }}
                                                    title="Eliminar periodo y fotos permanentemente"
                                                >
                                                    <Trash2 size={20} />
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
        </div>
    );
};

export default ServicePaymentsPage;
