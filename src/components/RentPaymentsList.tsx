import React, { useState, useEffect } from 'react';
import { propertyService } from '../services/propertyService';
import { uploadToCloudinary } from '../services/cloudinary';
import type { RentPayment } from '../types';
import { CheckCircle, Trash2, ArrowUpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
    propertyId: string;
    contractId: string;
    isTenantView: boolean;
}

const RentPaymentsList: React.FC<Props> = ({ propertyId, contractId, isTenantView }) => {
    const { user } = useAuth();
    const [payments, setPayments] = useState<RentPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form inputs
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const data = await propertyService.getRentPayments(propertyId, contractId);
            // Ordenar por Año y Mes descendente
            data.sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                return b.month - a.month;
            });
            setPayments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, [propertyId, contractId]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isTenantView) return; // Solo el inquilino puede subir pagos de alquiler (según la fase actual)
        if (!amount || month < 1 || month > 12 || year < 2000) return;

        setUploading(true);
        try {
            let receiptUrl = '';
            if (receiptFile) {
                receiptUrl = await uploadToCloudinary(receiptFile);
            }

            await propertyService.addRentPayment(propertyId, contractId, {
                year,
                month,
                amount: parseFloat(amount),
                currency,
                receiptUrl,
                paymentDate: new Date().toISOString(),
                isVerified: false,
                tenantId: user?.id
            });

            setAmount('');
            setReceiptFile(null);
            alert("Pago informado al propietario.");
            await loadPayments();
        } catch (err) {
            console.error(err);
            alert("Error al subir el pago.");
        } finally {
            setUploading(false);
        }
    };

    const handleVerify = async (paymentId: string) => {
        if (isTenantView) return; // Inquilino no puede verificar
        if (window.confirm("¿Confirmar que el dinero ingresó a la cuenta?")) {
            await propertyService.updateRentPayment(propertyId, contractId, paymentId, { isVerified: true });
            await loadPayments();
        }
    };

    const handleDelete = async (paymentId: string) => {
        if (window.confirm("¿Eliminar este registro de pago?")) {
            await propertyService.deleteRentPayment(propertyId, contractId, paymentId);
            await loadPayments();
        }
    };

    const getMonthName = (m: number) => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return months[m - 1] || '';
    };

    if (loading) return <div style={{ fontSize: '0.9rem', color: '#5f6368', padding: '1rem' }}>Cargando pagos...</div>;

    return (
        <div style={{ marginTop: '2rem', borderTop: '2px solid #f1f3f4', paddingTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} /> Registro de Pagos Reales
            </h3>

            {isTenantView && (
                <form onSubmit={handleUpload} className="card" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dadce0', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '2rem' }}>
                    <div style={{ width: '100%', marginBottom: '0.5rem', color: '#5f6368', fontSize: '0.9rem', fontWeight: 500 }}>
                        Informar Nuevo Pago de Alquiler
                    </div>
                    <div>
                        <label className="label">Periodo</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select className="input" style={{ width: '80px', padding: '0.4rem' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <option key={i} value={i + 1}>{getMonthName(i + 1)}</option>
                                ))}
                            </select>
                            <input type="number" className="input" style={{ width: '80px', padding: '0.4rem' }} value={year} onChange={e => setYear(Number(e.target.value))} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Importe Transferido</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select className="input" style={{ width: '70px', padding: '0.4rem' }} value={currency} onChange={e => setCurrency(e.target.value as 'ARS' | 'USD')}>
                                <option value="ARS">ARS</option>
                                <option value="USD">USD</option>
                            </select>
                            <input type="number" step="0.01" className="input" style={{ width: '120px', padding: '0.4rem' }} required placeholder="Monto" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label className="label">Comprobante</label>
                        <input type="file" className="input" style={{ padding: '0.3rem' }} accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} required />
                    </div>
                    <div>
                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                            {uploading ? 'Subiendo...' : 'Registrar Pago'}
                        </button>
                    </div>
                </form>
            )}

            {payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #dadce0', borderRadius: '8px', color: '#5f6368' }}>
                    Aún no hay pagos registrados en este contrato.
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f3f4', borderBottom: '2px solid #dadce0' }}>
                                <th style={{ padding: '1rem', color: '#5f6368' }}>Periodo</th>
                                <th style={{ padding: '1rem', color: '#202124' }}>Importe Pagado</th>
                                <th style={{ padding: '1rem', color: '#202124', textAlign: 'center' }}>Comprobante</th>
                                <th style={{ padding: '1rem', color: '#202124', textAlign: 'center' }}>Estado</th>
                                <th style={{ padding: '1rem', textAlign: 'center', width: '80px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(pay => (
                                <tr key={pay.id} style={{ borderBottom: '1px solid #dadce0', backgroundColor: pay.isVerified ? '#f6fdf6' : '#fff' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        {getMonthName(pay.month)} / {pay.year}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 600, color: '#1a73e8' }}>
                                        {pay.currency} {pay.amount.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {pay.receiptUrl ? (
                                            <a href={pay.receiptUrl} target="_blank" rel="noreferrer" style={{ color: '#1a73e8', textDecoration: 'underline', fontSize: '0.9rem' }}>
                                                Ver Comprobante
                                            </a>
                                        ) : (
                                            <span style={{ color: '#9aa0a6' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {pay.isVerified ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#188038', backgroundColor: '#e6f4ea', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                <CheckCircle size={14} /> Chequeado
                                            </span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#d93025', backgroundColor: '#fce8e6', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                <ArrowUpCircle size={14} /> Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            {!isTenantView && !pay.isVerified && (
                                                <button onClick={() => handleVerify(pay.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#188038' }} title="Dar por Verificado">
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            {((isTenantView && !pay.isVerified) || !isTenantView) && (
                                                <button onClick={() => handleDelete(pay.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368' }} title="Borrar">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RentPaymentsList;
