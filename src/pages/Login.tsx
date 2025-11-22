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
    const { login } = useAuth();
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
