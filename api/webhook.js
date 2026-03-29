import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';

const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountEnv) {
    console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT is missing in environment variables.");
}

// Inicialización Singleton
if (!admin.apps.length && serviceAccountEnv) {
    try {
        const credentials = JSON.parse(serviceAccountEnv);
        admin.initializeApp({
            credential: admin.credential.cert(credentials)
        });
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON", e);
    }
}
const db = admin.apps.length ? admin.firestore() : null;

export default async function handler(req, res) {
    // MercadoPago usa POST genéricamente, pero confirmamos:
    if (req.method !== 'POST') {
        return res.status(405).send('Solo POST permitido');
    }

    try {
        const accessToken = process.env.MP_ACCESS_TOKEN || 'APP_USR-8369466794294561-032916-d51b109fbdb1ce44ab024c0e1978f790-17939630';
        if (!accessToken) return res.status(500).send('No token MP');

        // Extraer id del body o query
        const paymentId = req.query['data.id'] || req.query.id || req.body?.data?.id;
        const topic = req.query.topic || req.query.type || req.body?.type;

        // Sólo reaccionamos ante pagos
        if (topic === 'payment' && paymentId) {
            
            // Consultar M.P para confirmar estado real del pago
            const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
            const paymentClient = new Payment(client);
            const paymentInfo = await paymentClient.get({ id: paymentId });

            if (paymentInfo.status === 'approved') {
                const refString = paymentInfo.external_reference;
                
                if (refString) {
                    const payload = JSON.parse(refString);
                    const unitsToAdd = parseInt(payload.packId, 10);
                    
                    // Incrementamos la base de datos
                    const userRef = db.collection('users').doc(payload.userId);
                    
                    await db.runTransaction(async (transaction) => {
                        const userDoc = await transaction.get(userRef);
                        if (!userDoc.exists) return; // Muerte silenciosa para evitar bloqueos
                        
                        const currentSlots = userDoc.data().maxProperties || 2;
                        const purchased = userDoc.data().purchasedSlots || 0;
                        
                        transaction.update(userRef, { 
                            maxProperties: currentSlots + unitsToAdd,
                            purchasedSlots: purchased + unitsToAdd
                        });
                    });

                    // Descontar uso del cupón si usó uno
                    if (payload.couponCode) {
                        const couponsRef = db.collection('coupons');
                        const snapshot = await couponsRef.where('code', '==', payload.couponCode).get();
                        if (!snapshot.empty) {
                            const cDoc = snapshot.docs[0];
                            const currentUses = cDoc.data().remainingUses;
                            if (currentUses > 0) {
                                await cDoc.ref.update({ remainingUses: currentUses - 1 });
                            }
                        }
                    }
                }
            }
        }
        
        // Retornar siempre 200 OK para que MercadoPago no re-intente eternamente
        return res.status(200).send('OK Webhook Recibido');
    } catch (e) {
        console.error("Webhook Fallido:", e);
        // Retornamos 200 igual en catch para evitar bloqueos si no nos importa el error
        return res.status(200).send('Error mitigado');
    }
}
