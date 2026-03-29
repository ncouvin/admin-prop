import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Building2,
    Bell,
    Calendar,
    Wallet,
    MessageSquare,
    Settings,
    LogOut,
    Key,
    Tag,
    Zap
} from 'lucide-react';
import { APP_VERSION } from '../version';

export const IS_SUPER_ADMIN = (email: string | undefined | null) => email === 'ncouvin@gmail.com';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    const navItemStyle = (path: string) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        color: isActive(path) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        backgroundColor: isActive(path) ? 'var(--color-surface-hover)' : 'transparent',
        fontWeight: isActive(path) ? 600 : 500,
        transition: 'all 0.2s',
        marginBottom: '0.25rem'
    });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                backgroundColor: 'var(--color-surface)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 10
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h1 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>Admin Prop</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{user?.name}</p>
                </div>

                <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    <Link to="/dashboard" style={navItemStyle('/dashboard')}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>

                    <Link to="/properties" style={navItemStyle('/properties')}>
                        <Building2 size={20} />
                        Mis Propiedades
                    </Link>

                    <Link to="/rentals" style={navItemStyle('/rentals')}>
                        <Key size={20} />
                        Alquiladas por Mí
                    </Link>

                    <Link to="/alerts" style={navItemStyle('/alerts')}>
                        <Bell size={20} />
                        Mis Alertas
                    </Link>

                    <Link to="/calendar" style={navItemStyle('/calendar')}>
                        <Calendar size={20} />
                        Mi Calendario
                    </Link>

                    <Link to="/finances" style={navItemStyle('/finances')}>
                        <Wallet size={20} />
                        Gastos e Ingresos
                    </Link>

                    <Link to="/messages" style={navItemStyle('/messages')}>
                        <MessageSquare size={20} />
                        Mis Mensajes
                    </Link>

                    <Link to="/upgrade" style={navItemStyle('/upgrade')}>
                        <Zap size={20} />
                        Mi Suscripción
                    </Link>

                    <div style={{ margin: '1rem 0', borderTop: '1px solid var(--color-border)' }}></div>

                    <Link to="/settings" style={navItemStyle('/settings')}>
                        <Settings size={20} />
                        Configuración
                    </Link>

                    {IS_SUPER_ADMIN(user?.email) && (
                        <>
                            <div style={{ margin: '1rem 0', borderTop: '1px solid var(--color-border)' }}></div>
                            <Link to="/admin/coupons" style={navItemStyle('/admin/coupons')}>
                                <Tag size={20} />
                                Gestión Cupones
                            </Link>
                        </>
                    )}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            ...navItemStyle(''),
                            width: '100%',
                            color: 'var(--color-error)',
                            justifyContent: 'flex-start'
                        }}
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9aa0a6', marginTop: '0.5rem', lineHeight: '1.4' }}>
                        Admin Prop {APP_VERSION}<br />
                        Desarrollado por Nicolás Couvin<br />
                        <a href="mailto:info@malabar.tv" style={{ color: 'inherit', textDecoration: 'underline' }}>info@malabar.tv</a>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: '260px',
                padding: '2rem',
                maxWidth: '100%'
            }}>
                <div className="container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
