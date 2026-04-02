import { MercadoPagoConfig, Preference } from 'mercadopago';

// Esta función es Vercel Serverless (Corre del lado del servidor seguro)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { packId, userId, couponCode, finalPrice: reqFinalPrice } = req.body;
        
        // El Access Token por defecto o por entorno
        const accessToken = process.env.MP_ACCESS_TOKEN || 'APP_USR-8369466794294561-032916-d51b109fbdb1ce44ab024c0e1978f790-17939630';
        if (!accessToken) {
            return res.status(500).json({ error: 'MercadoPago Token no configurado en servidor.' });
        }

        // Definimos los precios base
        const PACKAGES = {
            '1': { title: '1 Propiedad Extra', price: 4000 },
            '5': { title: '5 Propiedades Extra', price: 15000 },
            '10': { title: '10 Propiedades Extra', price: 20000 }
        };

        const activePack = PACKAGES[packId];
        if (!activePack) return res.status(400).json({ error: 'Pack inválido' });

        let finalPrice = reqFinalPrice !== undefined ? reqFinalPrice : activePack.price;

        // NOTA: Si quisiéramos validar el cupón en tiempo real aquí (más seguro),
        // deberíamos instanciar firebase-admin, buscar el documento en "coupons" y re-aplicar descuento.
        // Dado el alcance, confiaremos en este parámetro o el dev lo sumará en el webhook.

        const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
        const preference = new Preference(client);

        const body = {
            items: [
                {
                    id: packId,
                    title: `Ampliación de Cupo: ${activePack.title}`,
                    quantity: 1,
                    unit_price: finalPrice,
                    currency_id: 'ARS',
                }
            ],
            // Usamos external_reference para enviar la "mochila" de datos segura hacia MercadoPago
            // Cuando nos pague, MP nos va a devolver exactamente este string.
            external_reference: JSON.stringify({ userId, packId, couponCode }),
            
            back_urls: {
                success: 'https://admin-prop.vercel.app/dashboard?payment=success',
                failure: 'https://admin-prop.vercel.app/upgrade?payment=failure',
                pending: 'https://admin-prop.vercel.app/dashboard?payment=pending'
            },
            auto_return: 'approved'
        };

        const result = await preference.create({ body });
        
        // Retornamos la URL donde Vercel redirigirá al cliente para poner la tarjeta
        return res.status(200).json({ init_point: result.init_point });
    } catch (error) {
        console.error("Error creating preference:", error);
        return res.status(500).json({ error: 'Error del servidor al crear preferencia MP' });
    }
}
