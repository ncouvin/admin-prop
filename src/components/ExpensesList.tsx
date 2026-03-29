import React, { useState, useEffect } from 'react';
import { propertyService } from '../services/propertyService';
import type { PropertyExpense } from '../types';
import { Plus, Trash2, Wrench, CheckCircle, Edit2, X, Save } from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAuth } from '../context/AuthContext';

interface Props {
    propertyId: string;
    isTenantView?: boolean;
}

const ExpensesList: React.FC<Props> = ({ propertyId, isTenantView = false }) => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<PropertyExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<PropertyExpense>>({});

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const data = await propertyService.getExpenses(propertyId);
            // Ordenamos los más recientes primero
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setExpenses(data);
        } catch (error) {
            console.error("Error fetching expenses", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExpenses();
    }, [propertyId]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc.trim() || !amount) return;

        setUploading(true);
        try {
            let receiptUrl = '';
            if (receiptFile) {
                receiptUrl = await uploadToCloudinary(receiptFile);
            }

            await propertyService.addExpense(propertyId, {
                date,
                amount: parseFloat(amount),
                currency,
                description: desc,
                receiptUrl,
                isVerified: !isTenantView, // Si es dueño, pre-aprobado. Si es inquilino, false
                tenantId: isTenantView ? user?.id : undefined
            });

            setDesc('');
            setAmount('');
            setReceiptFile(null);
            await loadExpenses();
        } catch (error) {
            console.error("Error adding expense", error);
            alert("Hubo un error al guardar el arreglo.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Eliminar este gasto o reporte?")) {
            await propertyService.deleteExpense(propertyId, id);
            await loadExpenses();
        }
    };

    const handleVerify = async (id: string) => {
        if (window.confirm("¿Aprobar este gasto reportado?")) {
            await propertyService.updateExpense(propertyId, id, { isVerified: true });
            await loadExpenses();
        }
    };

    const startEditing = (exp: PropertyExpense) => {
        setEditingId(exp.id);
        setEditForm({ ...exp });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        if (!editingId || !editForm.description || !editForm.amount) return;
        try {
            await propertyService.updateExpense(propertyId, editingId, {
                description: editForm.description,
                amount: Number(editForm.amount),
                currency: editForm.currency,
                date: editForm.date
            });
            setEditingId(null);
            await loadExpenses();
        } catch (error) {
            console.error("Error al actualizar", error);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando lista de arreglos...</div>;

    if (isTenantView && expenses.length === 0) {
         return (
             <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#5f6368' }}>
                 No hay arreglos o gastos reportados por el propietario para ver.
             </div>
         );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Formulario alta */}
            <div className="card" style={{ backgroundColor: isTenantView ? '#f8f9fa' : '#fcf8e3' }}>
                <h3 style={{ marginBottom: '1rem', color: isTenantView ? '#202124' : '#8a6d3b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wrench size={20} />
                    Reportar Nuevo Arreglo o Gasto Inmobiliario
                </h3>
                <p style={{ fontSize: '0.85rem', color: isTenantView ? '#5f6368' : '#8a6d3b', marginBottom: '1.5rem', opacity: 0.8 }}>
                    {isTenantView 
                        ? 'Registra gastos autorizados de mantenimiento. El propietario principal deberá aprobarlos y revisarlos.' 
                        : 'Los gastos reportados aquí impactarán restando al Ingreso Neto en las Finanzas. Se asuminen cubiertos por el dueño.'}
                </p>
                    <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ flex: 2, minWidth: '200px' }}>
                            <label className="label">¿Qué se arregló o pagó?</label>
                            <input type="text" className="input" required placeholder="Ej: Cambio de termotanque, Pintura..." value={desc} onChange={e => setDesc(e.target.value)} />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label className="label">Costo</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select className="input" style={{ width: '80px', padding: '0.5rem' }} value={currency} onChange={e => setCurrency(e.target.value as 'ARS' | 'USD')}>
                                    <option value="ARS">ARS</option>
                                    <option value="USD">USD</option>
                                </select>
                                <input type="number" step="0.01" className="input" required placeholder="15000" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <label className="label">Fecha</label>
                            <input type="date" className="input" required value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                            <label className="label">Recibo / Factura</label>
                            <input type="file" className="input" style={{ padding: '0.4rem' }} accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                        </div>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={uploading}>
                                <Plus size={18} /> {uploading ? 'Guardando...' : 'Añadir Gasto'}
                            </button>
                        </div>
                    </form>
            </div>

            {/* Listado */}
            {expenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#5f6368', border: '1px dashed #dadce0', borderRadius: '8px' }}>
                    Sin gastos extraordinarios registrados.
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f3f4', borderBottom: '2px solid #dadce0' }}>
                                <th style={{ padding: '1rem', color: '#5f6368' }}>Fecha</th>
                                <th style={{ padding: '1rem', color: '#202124' }}>Detalle del Arreglo</th>
                                <th style={{ padding: '1rem', color: '#202124' }}>Costo Reportado</th>
                                <th style={{ padding: '1rem', color: '#202124', textAlign: 'center' }}>Comprobante</th>
                                <th style={{ padding: '1rem', textAlign: 'center', width: '60px' }}>Estado</th>
                                <th style={{ padding: '1rem', textAlign: 'center', width: '100px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                                {expenses.map(exp => {
                                    const isEditing = editingId === exp.id;
                                    const canEditOrDelete = !exp.isVerified && (!isTenantView || exp.tenantId === user?.id);

                                    return (
                                        <tr key={exp.id} style={{ borderBottom: '1px solid #dadce0', backgroundColor: exp.isVerified ? '#f8fafd' : '#fff' }}>
                                            <td style={{ padding: '1rem', color: '#5f6368' }}>
                                                {isEditing ? (
                                                    <input type="date" className="input" style={{ width: '130px', padding: '0.3rem' }} value={editForm.date || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                                                ) : (
                                                    new Date(exp.date + 'T00:00:00').toLocaleDateString()
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>
                                                {isEditing ? (
                                                    <input type="text" className="input" style={{ padding: '0.3rem' }} value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                                                ) : (
                                                    exp.description
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: exp.currency === 'USD' ? '#0d652d' : '#202124' }}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                                                        <select className="input" style={{ padding: '0.3rem' }} value={editForm.currency} onChange={e => setEditForm({ ...editForm, currency: e.target.value as 'ARS' | 'USD' })}>
                                                            <option value="ARS">ARS</option>
                                                            <option value="USD">USD</option>
                                                        </select>
                                                        <input type="number" step="0.01" className="input" style={{ padding: '0.3rem', width: '90px' }} value={editForm.amount || ''} onChange={e => setEditForm({ ...editForm, amount: Number(e.target.value) })} />
                                                    </div>
                                                ) : (
                                                    `${exp.currency} ${exp.amount.toLocaleString()}`
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {exp.receiptUrl ? (
                                                    <a href={exp.receiptUrl} target="_blank" rel="noreferrer" style={{ color: '#1a73e8', textDecoration: 'underline' }}>
                                                        Ver Recibo
                                                    </a>
                                                ) : (
                                                    <span style={{ color: '#9aa0a6' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {exp.isVerified ? (
                                                    <span title="Aprobado">
                                                        <CheckCircle size={20} color="#10b981" style={{ display: 'inline-block' }} />
                                                    </span>
                                                ) : (
                                                    !isTenantView ? (
                                                        <button onClick={() => handleVerify(exp.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} title="Aprobar Arreglo">
                                                            Aprobar
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>Pendiente</span>
                                                    )
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button onClick={saveEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }} title="Guardar">
                                                            <Save size={18} />
                                                        </button>
                                                        <button onClick={cancelEditing} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368' }} title="Cancelar">
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    canEditOrDelete && (
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button onClick={() => startEditing(exp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a73e8' }} title="Editar">
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button onClick={() => handleDelete(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d93025' }} title="Borrar">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                            </td>
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

export default ExpensesList;
