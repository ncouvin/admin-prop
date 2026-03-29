import React, { useState, useEffect } from 'react';
import { propertyService } from '../services/propertyService';
import { uploadToCloudinary } from '../services/cloudinary';
import type { PropertyService, ServicePayment } from '../types';
import { X, CheckCircle, ArrowUpCircle, FileText } from 'lucide-react';

interface Props {
    propertyId: string;
    service: PropertyService;
    isTenantView: boolean;
    onClose: () => void;
}

const ServicePaymentsModal: React.FC<Props> = ({ propertyId, service, isTenantView, onClose }) => {
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

    const loadPayments = async () => {
        setLoading(true);
        try {
            // Buscamos pagos en todos los años guardados (como MVP buscaremos del año actual y pasado si hiciera falta, 
            // pero para no hacer query complejas, buscamos los de currentYear y year anterior)
            const py1 = await propertyService.getServicePayments(propertyId, service.id, currentYear);
            const py2 = await propertyService.getServicePayments(propertyId, service.id, currentYear - 1);
            
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
        loadPayments();
    }, [propertyId, service.id]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
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

            // Verificamos si ya existe ese periodo para actualizarlo (fusionar facturas/comprobantes)
            const existing = payments.find(p => p.month === month && p.year === year);

            const paymentData: ServicePayment = {
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

            await propertyService.saveServicePayment(propertyId, service.id, paymentData);
            
            setAmount('');
            setInvoiceFile(null);
            setReceiptFile(null);
            alert("Documentación de servicio guardada exitosamente.");
            await loadPayments();
        } catch (err) {
            console.error(err);
            alert("Error al subir el archivo.");
        } finally {
            setUploading(false);
        }
    };

    const handleVerify = async (payment: ServicePayment) => {
        if (isTenantView) return; 
        if (!payment.receiptUrl) {
            alert("No se puede verificar si el inquilino aún no subió el comprobante de pago.");
            return;
        }
        if (window.confirm("¿Confirmar que este servicio ha sido pagado y el dinero cuadra?")) {
            await propertyService.saveServicePayment(propertyId, service.id, { ...payment, isVerified: true });
            await loadPayments();
        }
    };

    const getMonthName = (m: number) => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return months[m - 1] || '';
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div className="card fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368' }}>
                    <X size={24} />
                </button>
                
                <h2 style={{ fontSize: '1.4rem', color: '#1a73e8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={22} /> Documentación: {service.name}
                </h2>
                <div style={{ color: '#5f6368', marginBottom: '2rem', fontSize: '0.95rem' }}>
                    Referencia: {service.accountNumber || 'N/A'} | Proveedor: {service.providerName || 'N/A'}
                </div>

                {/* Formulario de Carga (Factura o Pago) */}
                <form onSubmit={handleUpload} style={{ backgroundColor: '#fcf8e3', padding: '1.5rem', borderRadius: '8px', border: '1px solid #faebcc', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div style={{ width: '100%', color: '#8a6d3b', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Adjuntar Factura a pagar / Comprobante de pago realizado
                    </div>
                    <div>
                        <label className="label">Periodo</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select className="input" style={{ width: '90px' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <option key={i} value={i + 1}>{getMonthName(i + 1)}</option>
                                ))}
                            </select>
                            <input type="number" className="input" style={{ width: '80px' }} value={year} onChange={e => setYear(Number(e.target.value))} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Monto Exacto Pagado ($)</label>
                        <input type="number" step="0.01" className="input" style={{ width: '140px' }} placeholder="Opcional..." value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                        <label className="label" style={{ color: '#d93025' }}>[1] Subir Factura / Boleto emitido</label>
                        <input type="file" className="input" style={{ padding: '0.3rem' }} accept="image/*,.pdf" onChange={e => setInvoiceFile(e.target.files?.[0] || null)} />
                    </div>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                        <label className="label" style={{ color: '#188038' }}>[2] Subir Ticket de Pago (Transf.)</label>
                        <input type="file" className="input" style={{ padding: '0.3rem' }} accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                    </div>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                            {uploading ? 'Procesando archivos...' : 'Guardar y Anexar al Periodo'}
                        </button>
                    </div>
                </form>

                {/* Historial */}
                <h3 style={{ fontSize: '1.1rem', color: '#202124', marginBottom: '1rem' }}>Estado de Cuenta Histórico</h3>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#5f6368' }}>Cargando registros...</div>
                ) : payments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #dadce0', borderRadius: '8px', color: '#5f6368' }}>
                        No hay archivos registrados para este servicio últimamente.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f3f4', borderBottom: '2px solid #dadce0' }}>
                                <th style={{ padding: '1rem', color: '#5f6368' }}>Periodo</th>
                                <th style={{ padding: '1rem', color: '#202124' }}>Monto Pagado</th>
                                <th style={{ padding: '1rem', color: '#202124', textAlign: 'center' }}>Factura Recibida</th>
                                <th style={{ padding: '1rem', color: '#202124', textAlign: 'center' }}>Comprob. de Pago</th>
                                <th style={{ padding: '1rem', color: '#202124', textAlign: 'center' }}>Auditoría Gral.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(pay => (
                                <tr key={pay.id} style={{ borderBottom: '1px solid #dadce0', backgroundColor: pay.isVerified ? '#f6fdf6' : '#fff' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{getMonthName(pay.month)} / {pay.year}</td>
                                    <td style={{ padding: '1rem', fontWeight: 600, color: '#1a73e8' }}>
                                        {pay.amount ? `$ ${pay.amount.toLocaleString()}` : '-'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {pay.invoiceUrl ? (
                                            <a href={pay.invoiceUrl} target="_blank" rel="noreferrer" style={{ color: '#d93025', textDecoration: 'underline', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'center' }}>
                                                <FileText size={16} /> Ver Factura
                                            </a>
                                        ) : <span style={{ color: '#9aa0a6' }}>Pendiente</span>}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {pay.receiptUrl ? (
                                            <a href={pay.receiptUrl} target="_blank" rel="noreferrer" style={{ color: '#188038', textDecoration: 'underline', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'center' }}>
                                                <CheckCircle size={16} /> Ver Pago
                                            </a>
                                        ) : <span style={{ color: '#9aa0a6' }}>Impago / Sin ticket</span>}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {pay.isVerified ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#188038', backgroundColor: '#e6f4ea', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                <CheckCircle size={14} /> Ok Propietario
                                            </span>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#d93025', backgroundColor: '#fce8e6', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    <ArrowUpCircle size={14} /> Sin Verificar
                                                </span>
                                                {!isTenantView && (
                                                    <button onClick={() => handleVerify(pay)} style={{ background: '#ceead6', border: '1px solid #188038', cursor: 'pointer', color: '#188038', borderRadius: '4px', padding: '4px' }} title="Dar ok final">
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ServicePaymentsModal;
