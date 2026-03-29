import React, { useState } from 'react';
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
    Zap,
    Menu,
    X
} from 'lucide-react';
import { APP_VERSION } from '../version';

export const IS_SUPER_ADMIN = (email: string | undefined | null) => email === 'ncouvin@gmail.com';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

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
            
            {/* Mobile Top Bar */}
            <header className="mobile-topbar">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                        src="/logo.png" 
                        alt="Admin Prop Logo" 
                        style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                    />
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', cursor: 'pointer' }}
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </header>

            {/* Mobile Overlay Backdrop */}
            <div 
                className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
                onClick={closeMobileMenu}
            ></div>

            {/* Sidebar */}
            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <img 
                        src="/logo.png" 
                        alt="Admin Prop Logo" 
                        style={{ width: '160px', height: 'auto', objectFit: 'contain', marginBottom: '0.5rem' }} 
                        onError={(e) => { 
                            e.currentTarget.style.display = 'none';
                            const fallback = document.getElementById('logo-fallback-title');
                            if (fallback) fallback.style.display = 'block';
                        }} 
                    />
                    <h1 id="logo-fallback-title" style={{ fontSize: '1.25rem', color: 'var(--color-primary)', margin: 0, display: 'none' }}>Admin Prop</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>{user?.name}</p>
                </div>

                <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    <Link to="/dashboard" style={navItemStyle('/dashboard')} onClick={closeMobileMenu}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>

                    <Link to="/properties" style={navItemStyle('/properties')} onClick={closeMobileMenu}>
                        <Building2 size={20} />
                        Mis Propiedades
                    </Link>

                    <Link to="/rentals" style={navItemStyle('/rentals')} onClick={closeMobileMenu}>
                        <Key size={20} />
                        Alquiladas por Mí
                    </Link>

                    <Link to="/alerts" style={navItemStyle('/alerts')} onClick={closeMobileMenu}>
                        <Bell size={20} />
                        Mis Alertas
                    </Link>

                    <Link to="/calendar" style={navItemStyle('/calendar')} onClick={closeMobileMenu}>
                        <Calendar size={20} />
                        Mi Calendario
                    </Link>

                    <Link to="/finances" style={navItemStyle('/finances')} onClick={closeMobileMenu}>
                        <Wallet size={20} />
                        Gastos e Ingresos
                    </Link>

                    <Link to="/messages" style={navItemStyle('/messages')} onClick={closeMobileMenu}>
                        <MessageSquare size={20} />
                        Mis Mensajes
                    </Link>

                    <Link to="/upgrade" style={navItemStyle('/upgrade')} onClick={closeMobileMenu}>
                        <Zap size={20} />
                        Mi Suscripción
                    </Link>

                    <div style={{ margin: '1rem 0', borderTop: '1px solid var(--color-border)' }}></div>

                    <Link to="/settings" style={navItemStyle('/settings')} onClick={closeMobileMenu}>
                        <Settings size={20} />
                        Configuración
                    </Link>

                    {IS_SUPER_ADMIN(user?.email) && (
                        <>
                            <div style={{ margin: '1rem 0', borderTop: '1px solid var(--color-border)' }}></div>
                            <Link to="/admin/coupons" style={navItemStyle('/admin/coupons')} onClick={closeMobileMenu}>
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
            <main className="main-content">
                <div className="container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
