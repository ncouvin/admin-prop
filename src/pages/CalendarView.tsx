import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CalendarEvent {
    id: string;
    date: Date;
    title: string;
    type: 'payment' | 'expiration' | 'service';
    propertyId: string;
}

const CalendarView: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const loadEvents = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const owned = await propertyService.getPropertiesByOwner(user.id);
            const rented = await propertyService.getRentingProperties(user.id);
            const allProps = [...owned, ...rented];
            const uniqueProps = Array.from(new Map(allProps.map(p => [p.id, p])).values());

            const newEvents: CalendarEvent[] = [];
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            for (const property of uniqueProps) {
                const contract = await propertyService.getActiveRentalContract(property.id);
                if (contract) {
                    // 1. Payment Due Date
                    const payDay = parseInt(contract.paymentDay || '10');
                    newEvents.push({
                        id: `pay-${property.id}`,
                        date: new Date(year, month, payDay),
                        title: `Vto. Alquiler: ${property.name}`,
                        type: 'payment',
                        propertyId: property.id
                    });

                    // 2. Contract Expiration
                    const endDate = new Date(contract.endDate);
                    if (endDate.getFullYear() === year && endDate.getMonth() === month) {
                        newEvents.push({
                            id: `exp-${property.id}`,
                            date: endDate,
                            title: `Fin Contrato: ${property.name}`,
                            type: 'expiration',
                            propertyId: property.id
                        });
                    }

                    // 3. Rent Increase
                    if (contract.updateIndex !== 'FIJO') {
                        const start = new Date(contract.startDate);
                        let mPassed = (year - start.getFullYear()) * 12 + (month - start.getMonth());
                        if (mPassed > 0 && mPassed % contract.updateFrequencyMonths === 0) {
                            newEvents.push({
                                id: `upd-${property.id}`,
                                date: new Date(year, month, start.getDate()),
                                title: `Aumento (${contract.updateIndex}): ${property.name}`,
                                type: 'expiration', // using red color for increases
                                propertyId: property.id
                            });
                        }
                    }
                }

                // 4. Services
                const services = await propertyService.getPropertyServices(property.id);
                for (const svc of services) {
                    if (svc.estimatedDueDate) {
                        newEvents.push({
                            id: `svc-${svc.id}`,
                            date: new Date(year, month, svc.estimatedDueDate),
                            title: `Vto. ${svc.name} (${property.name})`,
                            type: 'service',
                            propertyId: property.id
                        });
                    }
                }
            }

            setEvents(newEvents);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, [user, currentDate.getMonth(), currentDate.getFullYear()]);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const renderCalendarGrid = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        
        const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => <div key={`blank-${i}`} className="cal-cell empty"></div>);
        
        const days = Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = events.filter(e => e.date.getDate() === dayNum);
            const isToday = dayNum === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
                <div key={dayNum} className={`cal-cell ${isToday ? 'today' : ''}`} style={{ border: '1px solid #dadce0', minHeight: '100px', padding: '0.5rem', backgroundColor: isToday ? '#e8f0fe' : '#fff' }}>
                    <div style={{ fontWeight: isToday ? 600 : 400, color: isToday ? '#1a73e8' : '#202124', marginBottom: '0.5rem' }}>{dayNum}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dayEvents.map(ev => {
                            const bg = ev.type === 'payment' ? '#e6f4ea' : ev.type === 'service' ? '#fef7e0' : '#fce8e6';
                            const color = ev.type === 'payment' ? '#137333' : ev.type === 'service' ? '#b06000' : '#c5221f';
                            return (
                                <div key={ev.id} onClick={() => navigate(`/properties/${ev.propertyId}`)} style={{
                                    backgroundColor: bg, color, fontSize: '0.7rem', padding: '2px 4px', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500
                                }}>
                                    {ev.title}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        });

        return [...blanks, ...days];
    };

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', color: '#202124' }}>Mi Calendario</h2>
                    <p style={{ color: '#5f6368' }}>Vencimientos de contratos, servicios y aumentos</p>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button className="btn btn-secondary" onClick={prevMonth}><ChevronLeft size={20} /></button>
                    <h3 style={{ fontSize: '1.25rem', color: '#202124' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
                    <button className="btn btn-secondary" onClick={nextMonth}><ChevronRight size={20} /></button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#5f6368' }}>
                        <RefreshCw className="spin" size={32} style={{ marginBottom: '1rem', color: '#1a73e8' }} />
                        <p>Sincronizando fechas...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
                        <div style={{ minWidth: '800px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0px', textAlign: 'center', fontWeight: 600, color: '#5f6368', paddingBottom: '0.5rem' }}>
                                <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0px' }}>
                                {renderCalendarGrid()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Adding spin animation globally for calendar via inline style block */}
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .cal-cell:hover { background-color: #f8f9fa !important; }
            `}</style>
        </div>
    );
};

export default CalendarView;
