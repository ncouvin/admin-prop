import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquareOff, Cloud, Clock, CheckCircle2 } from 'lucide-react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const { isAuthenticated } = useAuth();

    // Redirigir si ya está logueado
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="landing-container">
            {/* Header */}
            <header className="landing-header">
                <div>
                    <img src="/logo.png" alt="AdminProp" className="landing-logo" />
                </div>
                <nav>
                    <Link to="/login" className="btn-primary-dark">Empezar ahora</Link>
                </nav>
            </header>

            {/* Hero Section */}
            <main>
                <section className="hero-section">
                    <img src="/logo.png" alt="AdminProp Logo Gran Formato" style={{ width: '280px', maxWidth: '80%', height: 'auto', marginBottom: '2rem' }} />
                    <span className="hero-badge">El sistema cloud para consorcios y particulares</span>
                    <h1 className="hero-title">
                        AdminProp: Tu alquiler,<br />
                        <span className="highlight">100% digital</span> y transparente
                    </h1>
                    <p className="hero-subtitle">
                        Transformamos la relación entre propietarios e inquilinos con tecnología de punta.
                        Olvidate de la burocracia, abrazá la eficiencia.
                    </p>
                    <div className="hero-cta-group">
                        <Link to="/login" className="btn-accent">Empezar ahora (Gratis)</Link>
                        {/* <a href="#features" className="btn-outline">Ver demos</a> */}
                    </div>

                    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                        <img 
                            src="/dashboard.jfif" 
                            alt="Dashboard de AdminProp" 
                            style={{ 
                                width: '100%', 
                                height: 'auto', 
                                borderRadius: '12px', 
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                border: '1px solid #e5e7eb'
                            }} 
                        />
                    </div>
                </section>

                {/* Info Text */}
                <div style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0b192c', marginBottom: '0.5rem' }}>El fin de la vieja escuela</h2>
                    <p style={{ color: '#6b7280', fontSize: '1rem' }}>Desarrollado para eliminar las fricciones diarias en la administración de propiedades.</p>
                </div>

                {/* Features Grid */}
                <section id="features" className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon-wrapper" style={{ backgroundColor: '#e6f4ea', color: '#1e8e3e' }}>
                            <MessageSquareOff size={24} />
                        </div>
                        <h3 className="feature-title">Adiós WhatsApp</h3>
                        <p className="feature-text">No más fotos de comprobantes perdidas en chats. Centralizamos la comunicación y los recibos en un solo lugar seguro.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon-wrapper" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                            <Cloud size={24} />
                        </div>
                        <h3 className="feature-title">Todo en la nube</h3>
                        <p className="feature-text">Accedé a tus contratos, recibos y reportes desde cualquier dispositivo, en cualquier momento. Tu oficina en el bolsillo.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                            <Clock size={24} />
                        </div>
                        <h3 className="feature-title">Acceso 24/7</h3>
                        <p className="feature-text">Transparencia total para ambas partes. Un estado de cuenta siempre actualizado sin necesidad de llamadas cruzadas.</p>
                    </div>
                </section>

                <hr style={{ borderTop: '1px solid #e5e7eb', margin: '4rem auto', maxWidth: '800px' }} />

                {/* Beneficios Duales */}
                <section className="split-section">
                    <div>
                        <span className="role-badge">PROPIETARIOS</span>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0b192c', marginBottom: '1.5rem', lineHeight: 1.2 }}>
                            Gestión inteligente para tu patrimonio
                        </h2>
                        <ul className="bullet-list">
                            <li className="bullet-item">
                                <CheckCircle2 className="bullet-icon" size={20} />
                                <div>
                                    <strong style={{ display: 'block', color: '#111827', marginBottom: '0.25rem' }}>Control de Alquileres</strong>
                                    <span style={{ color: '#4b5563', fontSize: '0.95rem' }}>Visualizá todos tus propiedades desde un panel unificado de alto nivel.</span>
                                </div>
                            </li>
                            <li className="bullet-item">
                                <CheckCircle2 className="bullet-icon" size={20} />
                                <div>
                                    <strong style={{ display: 'block', color: '#111827', marginBottom: '0.25rem' }}>Contratos Digitales</strong>
                                    <span style={{ color: '#4b5563', fontSize: '0.95rem' }}>Seguimiento automático de vencimientos y actualizaciones de valores.</span>
                                </div>
                            </li>
                            <li className="bullet-item">
                                <CheckCircle2 className="bullet-icon" size={20} />
                                <div>
                                    <strong style={{ display: 'block', color: '#111827', marginBottom: '0.25rem' }}>Pagos Automáticos</strong>
                                    <span style={{ color: '#4b5563', fontSize: '0.95rem' }}>Seguimiento en tiempo real de expensas y servicios de tus locatarios.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img 
                            src="/propiedades.jfif" 
                            alt="Gestión de propiedades" 
                            style={{ 
                                width: '100%', 
                                maxWidth: '500px', 
                                height: 'auto', 
                                borderRadius: '12px', 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #e5e7eb'
                            }} 
                        />
                    </div>
                </section>

                <section className="split-section" style={{ marginTop: '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', order: 2 }}>
                        <img 
                            src="/gastos.png" 
                            alt="Panel de gastos" 
                            style={{ 
                                width: '100%', 
                                maxWidth: '500px', 
                                height: 'auto', 
                                borderRadius: '12px', 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #e5e7eb'
                            }} 
                        />
                    </div>
                    <div style={{ order: 1 }}>
                        <span className="role-badge tenant">INQUILINOS</span>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0b192c', marginBottom: '1.5rem', lineHeight: 1.2 }}>
                            Una experiencia de alquiler sin fricción
                        </h2>
                        <ul className="bullet-list">
                            <li className="bullet-item">
                                <CheckCircle2 className="bullet-icon" size={20} />
                                <div>
                                    <strong style={{ display: 'block', color: '#111827', marginBottom: '0.25rem' }}>Panel de Pagos</strong>
                                    <span style={{ color: '#4b5563', fontSize: '0.95rem' }}>Visualizá tus facturas, fechas de vencimiento y saldos en tiempo real.</span>
                                </div>
                            </li>
                            <li className="bullet-item">
                                <CheckCircle2 className="bullet-icon" size={20} />
                                <div>
                                    <strong style={{ display: 'block', color: '#111827', marginBottom: '0.25rem' }}>Carga de Comprobantes</strong>
                                    <span style={{ color: '#4b5563', fontSize: '0.95rem' }}>Avisá que pagaste los servicios de forma fácil y guardá el historial respaldado.</span>
                                </div>
                            </li>
                            <li className="bullet-item">
                                <CheckCircle2 className="bullet-icon" size={20} />
                                <div>
                                    <strong style={{ display: 'block', color: '#111827', marginBottom: '0.25rem' }}>Garantías Transparentes</strong>
                                    <span style={{ color: '#4b5563', fontSize: '0.95rem' }}>Descargá los reglamentos del consorcio y consultá tu depósito garantizado en un click.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Call to action */}
                <section className="cta-banner">
                    <h2 className="cta-banner-title">¿Listo para modernizar tu forma de alquilar?</h2>
                    <p className="cta-banner-text">
                        Uníte a cientos de administradores y miles de inquilinos que ya confían en AdminProp.
                    </p>
                    <Link to="/login" className="btn-accent">Empezar ahora (Gratis)</Link>
                </section>

            </main>

            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-column">
                        <div style={{ marginBottom: '1rem' }}>
                            <img src="/logo.png" alt="AdminProp Logo" style={{ height: '32px' }} />
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.5, maxWidth: '250px' }}>
                            El sistema online transparente y colaborativo pensado en propietarios, consorcios e inquilinos.
                        </p>
                    </div>
                    
                    <div className="footer-column">
                        <h4>Plataforma</h4>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/login">Ingresar</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4>Empresa</h4>
                        <ul>
                            <li><Link to="/terms">Términos y Condiciones</Link></li>
                            <li><Link to="/privacy">Privacidad de Datos</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4>Contacto</h4>
                        <ul>
                            <li><a href="mailto:info@malabar.tv">✉️ info@malabar.tv</a></li>
                            <li><span>📍 Buenos Aires, Argentina</span></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    &copy; {new Date().getFullYear()} AdminProp. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
