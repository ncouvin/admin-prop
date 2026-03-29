// Vercel Serverless Function - api/webhook.js

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // MercadoPago Webhook URL endpoint
    // 1. Recibe 'data.id' de MercadoPago (El ID del pago)
    // 2. Hace un GET a mercadopago /v1/payments/{data.id} para verificar que esté APROBADO
    // 3. Extrae el `external_reference` (Donde guardaremos el userId y packId)
    // 4. Instancia Firebase-Admin para escribir en Firestore usando credenciales de Servicio
    // 5. Aumenta maxProperties + pack.units a external_reference.userId
    // 6. Retorna Status 200 OK a MercadoPago

    return response.status(200).send('Webhook Endpoint Ready');
}
