import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Link to="/" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 'bold' }}>&larr; Volver al inicio</Link>
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#0b192c', fontWeight: 800 }}>Términos y Condiciones</h1>
                <p style={{ color: '#666', marginBottom: '2rem' }}>Última actualización: {new Date().toLocaleDateString('es-AR')}</p>
                
                <h2 style={{ marginTop: '2rem', color: '#0b192c', fontWeight: 600 }}>1. Aceptación de los Términos</h2>
                <p style={{ color: '#4b5563' }}>Al acceder y utilizar AdminProp, usted acepta estar sujeto a estos Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de los términos, no podrá acceder a la plataforma.</p>
                
                <h2 style={{ marginTop: '2rem', color: '#0b192c', fontWeight: 600 }}>2. Descripción del Servicio</h2>
                <p style={{ color: '#4b5563' }}>AdminProp es una plataforma colaborativa de gestión de propiedades en la nube, diseñada para conectar a locadores y locatarios, permitiendo la visibilidad transparente de contratos, pagos y vencimientos de carácter administrativo.</p>

                <h2 style={{ marginTop: '2rem', color: '#0b192c', fontWeight: 600 }}>3. Responsabilidad de la Información</h2>
                <p style={{ color: '#4b5563' }}>La veracidad de la información ingresada (montos, comprobantes, datos de contacto) es responsabilidad exclusiva de los usuarios (propietarios e inquilinos). AdminProp actúa únicamente como plataforma informática proveedora del servicio técnico de organización y no garantiza, supervisa ni intermedia legalmente en disputas financieras, veracidad documental, cobros o transferencias bancarias entre partes.</p>
                
                <h2 style={{ marginTop: '2rem', color: '#0b192c', fontWeight: 600 }}>4. Cuentas de Usuario</h2>
                <p style={{ color: '#4b5563' }}>Para utilizar ciertas funciones de la plataforma, debe registrarse mediante su cuenta de Google. Usted es responsable de salvaguardar su cuenta y de toda actividad que ocurra bajo su sesión de identificación.</p>
                
                <h2 style={{ marginTop: '2rem', color: '#0b192c', fontWeight: 600 }}>5. Modificaciones</h2>
                <p style={{ color: '#4b5563' }}>Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. El uso continuado de la aplicación después de cualquier cambio constituye su aceptación de los nuevos Términos.</p>
            </div>
        </div>
    );
};

export default Terms;
