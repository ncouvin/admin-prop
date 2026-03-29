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

    useEffect(() => {
        const buildAlerts = async () => {
            if (!user) return;
            try {
                const props = await propertyService.getPropertiesByOwner(user.id);
                const newAlerts: SystemAlert[] = [];
                const today = new Date();

                for (const property of props) {
                    if (!property.isRented) continue;

                    const activeContract = await propertyService.getActiveRentalContract(property.id);
                    if (!activeContract) continue;

                    // 1. Chequeo de vencimiento de contrato
                    const endDate = new Date(activeContract.endDate);
                    const diffTime = endDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays <= 0) {
                        newAlerts.push({
                            id: `exp-${property.id}`,
                            type: 'critical',
                            title: `Contrato Vencido: ${property.name}`,
                            description: `El contrato finalizó hace ${Math.abs(diffDays)} días. Debes renovarlo o crear uno nuevo.`,
                            actionLink: `/properties/${property.id}`,
                            date: endDate
                        });
                    } else if (diffDays <= 30) {
                        newAlerts.push({
                            id: `exp30-${property.id}`,
                            type: 'critical',
                            title: `Vencimiento Inminente: ${property.name}`,
                            description: `El contrato caduca en ${diffDays} días (${endDate.toLocaleDateString()}).`,
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

                    // 2. Chequeo de actualización por inflación
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
                                description: `Toca aplicar índice ${activeContract.updateIndex} en ${updateDiffDays} días (Vigencia: ${nextUpdateDate.toLocaleDateString()}). Envía el aviso al inquilino.`,
                                actionLink: `/properties/${property.id}`,
                                date: nextUpdateDate
                            });
                        }
                    }
                }

                // Ordenar por severidad y cercanía en el tiempo
                const typeWeight = { critical: 3, warning: 2, info: 1 };
                newAlerts.sort((a, b) => {
                    if (typeWeight[b.type] !== typeWeight[a.type]) {
                        return typeWeight[b.type] - typeWeight[a.type];
                    }
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
                <div style={{ color: '#5f6368', animation: 'pulse 2s infinite' }}>Auditando propiedades...</div>
            </div>
        );
    }

    const AlertIcon = ({ type }: { type: string }) => {
        if (type === 'critical') return <AlertTriangle size={24} color="#d93025" />;
        if (type === 'warning') return <Clock size={24} color="#ea8600" />;
        return <Info size={24} color="#1a73e8" />;
    };

    const alertBg = {
        critical: '#fce8e6',
        warning: '#fef7e0',
        info: '#e8f0fe'
    };

    const alertBorder = {
        critical: '1px solid #fad2cf',
        warning: '1px solid #fce8b2',
        info: '1px solid #d2e3fc'
    };

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
                    <p style={{ color: '#5f6368', maxWidth: '400px' }}>No tienes contratos próximos a vencer ni ajustes de inflación que realizar este mes. ¡Relájate!</p>
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
