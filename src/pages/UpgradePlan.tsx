import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { couponService } from '../services/couponService';
import type { Coupon } from '../services/couponService';
import { userService } from '../services/userService';
import { ShieldCheck, Tag, Zap, Building2, ChevronRight } from 'lucide-react';

const PACKAGES = [
    { id: '1', units: 1, basePrice: 4000, title: 'Adicionar 1 Propiedad' },
    { id: '5', units: 5, basePrice: 15000, title: 'Pack 5 Propiedades' },
    { id: '10', units: 10, basePrice: 20000, title: 'Mega Pack 10 Propiedades' }
];

const UpgradePlan: React.FC = () => {
    const { user } = useAuth();
    const [selectedPack, setSelectedPack] = useState(PACKAGES[0]);
    
    // Cupones
    const [couponCode, setCouponCode] = useState('');
    const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
    const [couponError, setCouponError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleApplyCoupon = async () => {
        setCouponError('');
        if (!couponCode) return;
        
        setLoading(true);
        try {
            const coupon = await couponService.getCouponByCode(couponCode);
            if (!coupon) {
                setCouponError('Cupón inválido o agotado.');
                setActiveCoupon(null);
            } else if (coupon.packageType !== selectedPack.id) {
                setCouponError(`Este cupón sólo aplica al paquete de ${coupon.packageType} propiedad(es).`);
                setActiveCoupon(null);
            } else {
                setActiveCoupon(coupon);
            }
        } catch (error) {
            setCouponError('Error al validar cupón.');
        } finally {
            setLoading(false);
        }
    };

    const finalPrice = activeCoupon 
        ? selectedPack.basePrice * (1 - (activeCoupon.discountPercent / 100))
        : selectedPack.basePrice;

    const handleCheckout = async () => {
        if (!user) return;
        
        if (finalPrice === 0 && activeCoupon) {
            // Canje gratuito e instantáneo
            setLoading(true);
            try {
                await couponService.consumeCoupon(activeCoupon.id, activeCoupon.remainingUses);
                await userService.incrementPurchasedSlots(user.id, selectedPack.units);
                alert(`¡Éxito! Has expandido tu cupo máximo. Se sumaron ${selectedPack.units} propiedades a tu cuenta.`);
                
                // Forzamos un reload sutil enviando al usuario al panel con reinicio de cache
                window.location.href = '/dashboard';
            } catch (error) {
                console.error("Error canjeando cupón", error);
                alert("Ocurrió un error al canjear el cupón gratuito.");
            } finally {
                setLoading(false);
            }
            return;
        }

        // Si hay que pagar, por ahora mostramos alerta de Próxima Integración MP.
        // O lo enviamos a /api/checkout pasando el pack y el user.id.
        setLoading(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    packId: selectedPack.id, 
                    userId: user.id, 
                    couponCode: activeCoupon?.code || null 
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                // Redirigir a MercadoPago
                if (data.init_point) {
                    window.location.href = data.init_point;
                } else {
                    alert('Error: Checkout Pro URL no provista.');
                }
            } else {
                alert('El sistema de MercadoPago está en configuración. Por favor intenta más tarde o contáctate con soporte si tienes un comprobante.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('En este momento el Checkout de MercadoPago no está operativo (Falta clave de Producción).');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ padding: '2rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', color: '#202124', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={36} color="#ea8600" />
                    Ampliá tus horizontes
                </h1>
                <p style={{ color: '#5f6368', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    Tu límite actual es de {user?.maxProperties} propiedades. Agrega espacios para seguir profesionalizando tu rentabilidad inmobiliaria.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {PACKAGES.map(pack => (
                    <div 
                        key={pack.id} 
                        className="card"
                        onClick={() => { setSelectedPack(pack); setActiveCoupon(null); setCouponError(''); setCouponCode(''); }}
                        style={{ 
                            padding: '2rem', 
                            cursor: 'pointer', 
                            border: selectedPack.id === pack.id ? '2px solid #1a73e8' : '1px solid #dadce0',
                            transition: 'all 0.2s ease',
                            boxShadow: selectedPack.id === pack.id ? '0 4px 12px rgba(26,115,232,0.15)' : 'none',
                            display: 'flex', flexDirection: 'column', height: '100%'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ backgroundColor: '#e8f0fe', padding: '0.75rem', borderRadius: '50%' }}>
                                <Building2 size={24} color="#1a73e8" />
                            </div>
                            {selectedPack.id === pack.id && <ShieldCheck size={28} color="#1a73e8" />}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#202124' }}>{pack.title}</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1a73e8', marginBottom: '1.5rem' }}>
                            ${pack.basePrice.toLocaleString()} <span style={{ fontSize: '1rem', color: '#5f6368', fontWeight: 400 }}>ARS / único pago</span>
                        </div>
                        <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: 0, color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <ShieldCheck size={18} color="#188038" /> Aumento permanente del límite en {pack.units}
                            </li>
                            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <ShieldCheck size={18} color="#188038" /> Inquilinos asociados ilimitados
                            </li>
                            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <ShieldCheck size={18} color="#188038" /> Acceso vitalicio a reportes y notificaciones
                            </li>
                        </ul>
                    </div>
                ))}
            </div>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', backgroundColor: '#f8f9fa' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#202124', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={20} color="#1a73e8" /> Resumen de Compra
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem' }}>
                    <span>{selectedPack.title}</span>
                    <span style={{ fontWeight: 600 }}>${selectedPack.basePrice.toLocaleString()} ARS</span>
                </div>

                {/* Cupón */}
                <div style={{ borderTop: '1px solid #dadce0', borderBottom: '1px solid #dadce0', padding: '1.5rem 0', margin: '1.5rem 0', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Código de descuento" 
                            value={couponCode} 
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            disabled={loading || !!activeCoupon}
                        />
                        {couponError && <p style={{ color: '#d93025', fontSize: '0.85rem', marginTop: '0.5rem', margin: 0 }}>{couponError}</p>}
                    </div>
                    {activeCoupon ? (
                        <button className="btn btn-secondary" onClick={() => { setActiveCoupon(null); setCouponCode(''); }} style={{ color: '#d93025' }}>
                            Quitar
                        </button>
                    ) : (
                        <button className="btn btn-secondary" onClick={handleApplyCoupon} disabled={!couponCode || loading}>
                            <Tag size={18} style={{ marginRight: '0.25rem' }}/> Aplicar
                        </button>
                    )}
                </div>

                {activeCoupon && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#137333', fontWeight: 600 }}>
                        <span>Descuento ({activeCoupon.discountPercent}%)</span>
                        <span>-${(selectedPack.basePrice * (activeCoupon.discountPercent / 100)).toLocaleString()} ARS</span>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                    <span style={{ fontSize: '1.2rem', color: '#5f6368' }}>Total a pagar</span>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1a73e8' }}>
                        ${finalPrice.toLocaleString()} ARS
                    </span>
                </div>

                <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    onClick={handleCheckout}
                    disabled={loading}
                >
                    {loading ? 'Procesando...' : (finalPrice === 0 ? 'Obtener Beneficio Gratuito' : 'Continuar al Pago')}
                    {!loading && <ChevronRight size={20} />}
                </button>
                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#5f6368' }}>
                    {finalPrice > 0 ? 'Al continuar serás redirigido de forma segura a MercadoPago.' : 'El beneficio se aplicará instantáneamente en tu cuenta.'}
                </div>
            </div>
        </div>
    );
};

export default UpgradePlan;
