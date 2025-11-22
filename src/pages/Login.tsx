import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../types';
import { mockService } from '../services/mockData';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>('owner');
    const [error, setError] = useState('');
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isLogin) {
            const success = await login(email);
            if (success) {
                navigate('/dashboard');
            } else {
                setError('Usuario no encontrado. Por favor regístrese.');
            }
        } else {
            // Register logic
            const newUser = {
                id: Math.random().toString(36).substr(2, 9),
                name,
                email,
                phone: '',
                cuit: '',
                role,
                groupId: role === 'owner' ? `group-${Math.random().toString(36).substr(2, 9)}` : undefined
            };
            mockService.register(newUser);
            await login(email);
            navigate('/dashboard');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    {isLogin ? 'Bienvenido a Admin Prop' : 'Crear Cuenta'}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!isLogin && (
                        <div>
                            <label className="label">Nombre y Apellido</label>
                            <input
                                type="text"
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="label">Rol</label>
                            <select
                                className="input"
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                            >
                                <option value="owner">Propietario</option>
                                <option value="collaborator">Colaborador</option>
                                <option value="viewer">Revisor</option>
                                <option value="tenant">Inquilino</option>
                            </select>
                        </div>
                    )}

                    {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                        {isLogin ? 'Ingresar' : 'Registrarse'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
                        <span style={{ padding: '0 0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>o</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
                    </div>

                    <button
                        type="button"
                        className="btn"
                        onClick={() => {
                            loginWithGoogle().then(() => navigate('/dashboard'));
                        }}
                        style={{
                            backgroundColor: '#fff',
                            color: '#3c4043',
                            border: '1px solid var(--color-border)',
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                    >
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                        Continuar con Google
                    </button>
                </form>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button
                        className="btn"
                        style={{ color: 'var(--color-secondary)', background: 'none', padding: 0 }}
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Ingresa'}
                    </button>
                </div>

                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <p className="label" style={{ textAlign: 'center' }}>Usuarios Demo:</p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => setEmail('juan@demo.com')}>
                            Propietario
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => setEmail('maria@demo.com')}>
                            Inquilino
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
