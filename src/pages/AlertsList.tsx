import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import { AlertTriangle, Clock, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SystemAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    actionLink: string;
    date: Date;
}

const AlertsList: React.FC = () => {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [loading, setLoading] = useState(true);

    const getMonthName = (month: number) => {
        const names = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return names[month - 1];
    };

    useEffect(() => {
        const buildAlerts = async () => {
            if (!user) return;
            try {
                const newAlerts: SystemAlert[] = [];
                const today = new Date();
                const curMonth = today.getMonth() + 1;
                const curYear = today.getFullYear();
                const curDate = today.getDate();

                // ============================================
                // ALERTAS DE PROPIETARIO / CO-PROPIETARIO
                // ============================================
                const ownerProps = await propertyService.getPropertiesByOwner(user.id);
                for (const property of ownerProps) {
                    if (!property.isRented) continue;

                    const activeContract = await propertyService.getActiveRentalContract(property.id);
                    if (!activeContract) continue;

                    const endDate = new Date(activeContract.endDate);
                    const diffTime = endDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays <= 0) {
                        newAlerts.push({
                            id: `exp-${property.id}`,
                            type: 'critical',
                            title: `Contrato Vencido: ${property.name}`,
                            description: `Finalizó hace ${Math.abs(diffDays)} días. Debes renovarlo o crear uno nuevo.`,
                            actionLink: `/properties/${property.id}`,
                            date: endDate
                        });
                    } else if (diffDays <= 30) {
                        newAlerts.push({
                            id: `exp30-${property.id}`,
                            type: 'critical',
                            title: `Vencimiento Inminente: ${property.name}`,
                            description: `Caduca en ${diffDays} días (${endDate.toLocaleDateString()}).`,
                            actionLink: `/properties/${property.id}`,
                            date: endDate
                        });
                    } else if (diffDays <= 60) {
                        newAlerts.push({
                            id: `exp60-${property.id}`,
                            type: 'warning',
                            title: `Próximo Vencimiento: ${property.name}`,
                            description: `El contrato terminará en ${diffDays} días. Tiempo ideal para negociar renovación.`,
                            actionLink: `/properties/${property.id}`,
                            date: endDate
                        });
                    }

                    if (activeContract.updateIndex !== 'FIJO') {
                        const start = new Date(activeContract.startDate);
                        let monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
                        if (today.getDate() < start.getDate()) monthsPassed--;
                        if (monthsPassed < 0) monthsPassed = 0;

                        const periodsPassed = Math.floor(monthsPassed / activeContract.updateFrequencyMonths);
                        const nextUpdateDate = new Date(start);
                        nextUpdateDate.setMonth(start.getMonth() + (periodsPassed + 1) * activeContract.updateFrequencyMonths);

                        const updateDiffTime = nextUpdateDate.getTime() - today.getTime();
                        const updateDiffDays = Math.ceil(updateDiffTime / (1000 * 60 * 60 * 24));

                        if (updateDiffDays <= 15 && updateDiffDays >= 0) {
                            newAlerts.push({
                                id: `upd-${property.id}`,
                                type: 'info',
                                title: `Ajuste de Alquiler: ${property.name}`,
                                description: `Toca aplicar índice en ${updateDiffDays} días (Vigencia: ${nextUpdateDate.toLocaleDateString()}).`,
                                actionLink: `/properties/${property.id}`,
                                date: nextUpdateDate
                            });
                        }
                    }
                }

                // ============================================
                // ALERTAS DE INQUILINO
                // ============================================
                const rentedProps = await propertyService.getRentingProperties(user.id);
                for (const property of rentedProps) {
                    const activeContract = await propertyService.getActiveRentalContract(property.id);
                    if (!activeContract) continue;

                    // 1. Alquiler Impago (Check mes actual)
                    const rentDateInt = parseInt(activeContract.paymentDay || '10');
                    if (curDate > rentDateInt) {
                        const payments = await propertyService.getRentPayments(property.id, activeContract.id!);
                        const pThisMonth = payments.find(p => p.month === curMonth && p.year === curYear);
                        if (!pThisMonth || (!pThisMonth.isVerified && !pThisMonth.receiptUrl)) {
                            newAlerts.push({
                                id: `tenant-rent-${property.id}`,
                                type: 'critical',
                                title: `Alquiler Vencido: ${property.name}`,
                                description: `El periodo de ${getMonthName(curMonth)} está impago o pendiente de subir comprobante.`,
                                actionLink: `/rentals`,
                                date: today
                            });
                        }
                    }

                    // 2. Servicios Impagos
                    const services = await propertyService.getPropertyServices(property.id);
                    for (const s of services) {
                        if (s.estimatedDueDate && curDate > s.estimatedDueDate) {
                            const payments = await propertyService.getServicePayments(property.id, s.id, curYear);
                            const currentPayment = payments.find(pay => pay.month === curMonth);
                            if (!currentPayment || (currentPayment.status === 'pending' && !currentPayment.receiptUrl)) {
                                newAlerts.push({
                                    id: `tenant-svc-${s.id}`,
                                    type: 'warning',
                                    title: `Servicio Vencido: ${s.name}`,
                                    description: `El servicio en ${property.name} venció el ${s.estimatedDueDate} de este mes. Si ya lo pagaste sube el comprobante.`,
                                    actionLink: `/rentals`,
                                    date: today
                                });
                            }
                        }
                    }

                    // 3. Aumento el mes que viene
                    if (activeContract.updateIndex !== 'FIJO') {
                        const start = new Date(activeContract.startDate);
                        let monthsPassedMap = (curYear - start.getFullYear()) * 12 + (curMonth - start.getMonth());
                        // Ver si el mes que viene hay salto de periodo
                        const currentPeriod = Math.floor(monthsPassedMap / activeContract.updateFrequencyMonths);
                        const nextMonthPeriod = Math.floor((monthsPassedMap + 1) / activeContract.updateFrequencyMonths);
                        
                        if (nextMonthPeriod > currentPeriod) {
                            newAlerts.push({
                                id: `tenant-upd-${property.id}`,
                                type: 'info',
                                title: `Próximo Aumento de Alquiler`,
                                description: `El mes que viene toca actualizar el alquiler debido a tu cláusula ${activeContract.updateIndex}. Habla con tu propietario.`,
                                actionLink: `/rentals`,
                                date: today
                            });
                        }
                    }
                }

                // Ordenar por severidad
                const typeWeight = { critical: 3, warning: 2, info: 1 };
                newAlerts.sort((a, b) => {
                    if (typeWeight[b.type] !== typeWeight[a.type]) return typeWeight[b.type] - typeWeight[a.type];
                    return a.date.getTime() - b.date.getTime();
                });

                setAlerts(newAlerts);
            } catch (error) {
                console.error("Error building alerts", error);
            } finally {
                setLoading(false);
            }
        };

        buildAlerts();
    }, [user]);

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ color: '#5f6368', animation: 'pulse 2s infinite' }}>Auditando propiedades y alquileres...</div>
            </div>
        );
    }

    const AlertIcon = ({ type }: { type: string }) => {
        if (type === 'critical') return <AlertTriangle size={24} color="#d93025" />;
        if (type === 'warning') return <Clock size={24} color="#ea8600" />;
        return <Info size={24} color="#1a73e8" />;
    };

    const alertBg = { critical: '#fce8e6', warning: '#fef7e0', info: '#e8f0fe' };
    const alertBorder = { critical: '1px solid #fad2cf', warning: '1px solid #fce8b2', info: '1px solid #d2e3fc' };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#202124' }}>Centro de Alertas</h1>
                <span style={{ backgroundColor: alerts.length > 0 ? '#d93025' : '#188038', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '24px', fontSize: '0.9rem', fontWeight: 600 }}>
                    {alerts.length} Notificaciones
                </span>
            </div>

            {alerts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <CheckCircle2 size={48} color="#188038" style={{ opacity: 0.8 }} />
                    <h3 style={{ fontSize: '1.2rem', color: '#188038' }}>Todo está bajo control</h3>
                    <p style={{ color: '#5f6368', maxWidth: '400px' }}>No hay acciones críticas requeridas ni notificaciones urgentes en este momento. ¡Buen trabajo!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {alerts.map(a => (
                        <div key={a.id} style={{ backgroundColor: alertBg[a.type as keyof typeof alertBg], border: alertBorder[a.type as keyof typeof alertBorder], padding: '1.5rem', borderRadius: '8px', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                            <div style={{ marginTop: '0.25rem' }}>
                                <AlertIcon type={a.type} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#202124', fontSize: '1.1rem' }}>{a.title}</h3>
                                <p style={{ margin: 0, color: '#3c4043', lineHeight: '1.5' }}>{a.description}</p>
                            </div>
                            <div style={{ alignSelf: 'center' }}>
                                <Link to={a.actionLink} className="btn btn-secondary" style={{ backgroundColor: '#fff', padding: '0.5rem 1rem' }}>
                                    Gestionar <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlertsList;
