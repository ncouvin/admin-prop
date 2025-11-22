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
    Users,
    LogOut
} from 'lucide-react';

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
                    <span style={{
                        fontSize: '0.75rem',
                        backgroundColor: 'var(--color-surface-hover)',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '1rem',
                        textTransform: 'capitalize'
                    }}>
                        {user?.role}
                    </span>
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

                    <div style={{ margin: '1rem 0', borderTop: '1px solid var(--color-border)' }}></div>

                    <Link to="/settings" style={navItemStyle('/settings')}>
                        <Settings size={20} />
                        Configuración
                    </Link>

                    {user?.role === 'owner' && (
                        <Link to="/users" style={navItemStyle('/users')}>
                            <Users size={20} />
                            Admin Usuarios
                        </Link>
                    )}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
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
