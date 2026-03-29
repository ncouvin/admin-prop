import { MercadoPagoConfig, Payment } from 'mercadopago';
// import * as admin from 'firebase-admin';

// Reemplaza esto con tu llave Service Account de Firebase Config
/*
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();
*/

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Solo POST permitido');
    }

    try {
        const accessToken = process.env.MP_ACCESS_TOKEN || 'APP_USR-8369466794294561-032916-d51b109fbdb1ce44ab024c0e1978f790-17939630';
        if (!accessToken) return res.status(500).send('No token');

        // MP manda `topic=payment` y `id=12345` en la URL usualmente
        const query = req.query;
        if (query.type === 'payment' || query.topic === 'payment') {
            const paymentId = query['data.id'] || query.id;
            
            // Consultar a la API de MP para verificar que sea real y APROBADO
            const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
            const paymentClient = new Payment(client);
            const payment = await paymentClient.get({ id: paymentId });

            if (payment.status === 'approved') {
                // Nuestro payload secreto con el User ID
                const refString = payment.external_reference;
                if (refString) {
                    const payload = JSON.parse(refString);
                    // EJECUCIÓN (Requiere Configuración de Firebase Admin Listada Arriba)
                    /*
                    const userRef = db.collection('users').doc(payload.userId);
                    const docSnap = await userRef.get();
                    if (docSnap.exists) {
                       const current = docSnap.data().maxProperties;
                       await userRef.update({ maxProperties: current + parseInt(payload.packId, 10) });

                       // Si usó cupón descontar remainingUses
                       if (payload.couponCode) {
                           const cRef = await db.collection('coupons').where('code','==',payload.couponCode).get();
                           if (!cRef.empty) {
                               const cId = cRef.docs[0].id;
                               const uses = cRef.docs[0].data().remainingUses;
                               await db.collection('coupons').doc(cId).update({ remainingUses: uses - 1 });
                           }
                       }
                    }
                    */
                }
            }
        }
        return res.status(200).send('OK');
    } catch (e) {
        console.error("Webhook MP Fallido:", e);
        return res.status(500).send('Error');
    }
}
