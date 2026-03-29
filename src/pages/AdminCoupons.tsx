import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IS_SUPER_ADMIN } from '../components/Layout';
import { couponService } from '../services/couponService';
import type { Coupon, PackageType } from '../services/couponService';
import { Tag, Plus, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminCoupons: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [discount, setDiscount] = useState<number>(100);
    const [packageType, setPackageType] = useState<PackageType>('1');
    const [uses, setUses] = useState<number>(1);
    const [editingId, setEditingId] = useState<string | null>(null);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const data = await couponService.getAllCoupons();
            setCoupons(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || !IS_SUPER_ADMIN(user.email)) {
            navigate('/dashboard');
            return;
        }
        loadCoupons();
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !name) return alert('Debes completar nombre y código');

        const payload = {
            code,
            name,
            discountPercent: discount,
            packageType,
            remainingUses: uses,
            active: true
        };

        try {
            if (editingId) {
                await couponService.updateCoupon(editingId, payload);
            } else {
                await couponService.createCoupon(payload);
            }
            setIsFormOpen(false);
            resetForm();
            loadCoupons();
        } catch (error) {
            alert("Error al guardar cupón.");
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar este cupón?")) {
            await couponService.deleteCoupon(id);
            loadCoupons();
        }
    };

    const handleEdit = (c: Coupon) => {
        setEditingId(c.id);
        setCode(c.code);
        setName(c.name);
        setDiscount(c.discountPercent);
        setPackageType(c.packageType);
        setUses(c.remainingUses);
        setIsFormOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setCode('');
        setName('');
        setDiscount(100);
        setPackageType('1');
        setUses(1);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando Panel Super Admin...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', color: '#202124' }}>Gestión de Cupones</h2>
                    <p style={{ color: '#5f6368' }}>Sólo Súper Admin (ncouvin@gmail.com)</p>
                </div>
                {!isFormOpen && (
                    <button className="btn btn-primary" onClick={() => { resetForm(); setIsFormOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} />
                        Nuevo Cupón
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1a73e8' }}>{editingId ? 'Editar Cupón' : 'Crear Cupón'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Nombre Oculto (Referencia)</label>
                                <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej: Amigos de Malabar" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">CÓDIGO (Texto Público)</label>
                                <input type="text" className="form-control" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required placeholder="Ej: MALABAR100" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Aplica al Paquete de:</label>
                                <select className="form-control" value={packageType} onChange={e => setPackageType(e.target.value as PackageType)}>
                                    <option value="1">1 Propiedad ($2.000)</option>
                                    <option value="5">5 Propiedades ($8.000)</option>
                                    <option value="10">10 Propiedades ($15.000)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">% de Descuento (0-100)</label>
                                <input type="number" min="0" max="100" className="form-control" value={discount} onChange={e => setDiscount(Number(e.target.value))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cant. Máx Usos Restantes</label>
                                <input type="number" min="1" className="form-control" value={uses} onChange={e => setUses(Number(e.target.value))} required />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Tag size={20} /> Guardar Cupón
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dadce0' }}>
                            <th style={{ padding: '1rem', color: '#5f6368', fontWeight: 600 }}>CÓDIGO</th>
                            <th style={{ padding: '1rem', color: '#5f6368', fontWeight: 600 }}>Campaña</th>
                            <th style={{ padding: '1rem', color: '#5f6368', fontWeight: 600 }}>Paquete / Dto.</th>
                            <th style={{ padding: '1rem', color: '#5f6368', fontWeight: 600 }}>Usos Restantes</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#5f6368', fontWeight: 600 }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#5f6368' }}>No hay cupones activos.</td>
                            </tr>
                        ) : coupons.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #dadce0' }}>
                                <td style={{ padding: '1rem', fontWeight: 600, color: '#1a73e8' }}>{c.code}</td>
                                <td style={{ padding: '1rem', color: '#202124' }}>{c.name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, marginRight: '0.5rem' }}>
                                        PACK {c.packageType}
                                    </span>
                                    <span style={{ color: c.discountPercent === 100 ? '#137333' : '#ea8600', fontWeight: 600 }}>
                                        -{c.discountPercent}%
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: c.remainingUses > 0 ? '#137333' : '#d93025', fontWeight: 600 }}>
                                    {c.remainingUses}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button className="btn btn-secondary" onClick={() => handleEdit(c)} style={{ padding: '0.4rem', marginRight: '0.5rem' }}>
                                        <Edit size={16} />
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(c.id)} style={{ padding: '0.4rem', color: '#d93025' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminCoupons;
