import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Link to="/" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 'bold' }}>&larr; Volver al inicio</Link>
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#0b192c', fontWeight: 800 }}>Privacidad de Datos</h1>
                <p style={{ color: '#666', marginBottom: '2rem' }}>Última actualización: {new Date().toLocaleDateString('es-AR')}</p>
                
                <h2 style={{ marginTop: '2rem', color: '#0b192c', fontWeight: 600 }}>1. Información Primaria que recopilamos</h2>
                <p style={{ color: '#4b5563' }}>Recopilamos la dirección de correo electrónico, nombre y foto de perfil provenientes exclusivamente de la autenticación de Google de forma automatizada y segura para crear su perfil de usuario y validar su identidad. Adicionalmente, resguardamos la información operativa que decida volcar (ej. contratos, recibos, fotos, montos e información de propiedades).</p>
                
                <h2 style={{ marginTop: '2rem', color: '#0b192c', fontWeight: 600 }}>2. Uso de la Información Exclusivo</h2>
                <p style={{ color: '#4b5563' }}>Utilizamos sus datos puramente para la provisión operativa del servicio AdminProp. Esto incluye la emisión de alertas configuradas por el usuario, emparejamiento entre inquilino-propietario, reportes e integridad base de la plataforma tecnológica. <strong>Bajo ningún concepto vendemos, extraemos ni comerciamos sus datos con empresas de terceros con fines publicitarios.</strong></p>

                <h2 style={{ marginTop: '2rem', color: '#0b192c', fontWeight: 600 }}>3. Almacenamiento, Infraestructura y Seguridad</h2>
                <p style={{ color: '#4b5563' }}>Sus datos documentales y registros operacionales son procesados a través de bases de datos seguras en la nube operadas por proveedores de infraestructura líderes a nivel mundial (Firebase de Google Cloud Platform). Implementamos bloqueos de lectura para asegurar que sus documentos, comprobantes y montos sean estrictamente accesibles solo a las partes interesadas y configuradas para verlos (dueños o inquilinos vigentes).</p>
                
                <h2 style={{ marginTop: '2rem', color: '#0b192c', fontWeight: 600 }}>4. Derechos del Usuario Informático (Ley 25.326 AR)</h2>
                <p style={{ color: '#4b5563' }}>Conforme a la legislación vigente de Protección de Datos Personales de la República Argentina, usted mantiene el derecho inalienable a acceder, actualizar, corregir o solicitar la eliminación total de sus datos personales. Si desea que su perfil o datos sean expuestos o extinguidos permanentemente de los registros de AdminProp, puede realizar la solicitud técnica y formal a través del correo de contacto informado al final de esta plataforma o mediante mecanismos proporcionados en su perfil de cuenta personal.</p>
            </div>
        </div>
    );
};

export default Privacy;
