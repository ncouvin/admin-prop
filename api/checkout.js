// Vercel Serverless Function - api/checkout.js

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { packId, userId, couponCode } = request.body;

    // Aquí irá la lógica de MercadoPago Checkout Pro (SDK)
    // 1. Validar precio según packId
    // 2. Descontar según couponCode usando firebase-admin
    // 3. Crear Preferencia en MP con mercadopago.preferences.create
    // 4. Retornar response.status(200).json({ init_point: preference.init_point })

    return response.status(501).json({
        error: 'Not Implemented Yet',
        message: 'Awaiting Mercado Pago Access Token to complete scaffold.'
    });
}
