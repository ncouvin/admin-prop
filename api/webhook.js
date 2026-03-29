import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';

// Credenciales Maestras de Firebase provistas por el usuario
const serviceAccount = {
  type: "service_account",
  project_id: "adminpropauth",
  private_key_id: "b2f2632d5033fc38a9efc4bbe9051705ec24e331",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDVfE5DKe8qhqNb\nhb6kDpcdyJujCXHoXlb5HJGFIwkP30a9+YaFBN7/DtpBSELHSZ6TA1H8Rj2ZRP5D\nb868N223IYLnE4I4f+UdWZR5rSatsABC7RzobnWudP89HgUGRzmnNbKtnuNASiBL\n/McBHKdSZFFcX0fpO1NAT+HYrw/vT3yw6IgjXy/2WGP35WAxBVFZ/UZaSaQM3DgF\nWpDcKra/FRMgj24SSb9CnDtyx31veYnw887ctWagkphHDow52kyBOsfYaiFrh2KC\nZ1quiJ3lgacaqh+3ivpjwbaSd7H/1Rl0SIrmtXkerVpKZbSsCoUFU8+UZy585mKt\nRgsLxfMPAgMBAAECggEAVoHfAsdQ02YodvM8u6Tv5lE+g/PVVQg5bQt/CjiWuPhM\nZbnhoTBGnosptM9vw+qYl9D+HWBnIJ78+12oo8tAKbeqIDHfED7/HAQLLr0T0cji\najxD/QmZpT5imST7ez5MZe3UABfE1W3UJYaCK3itcq0U7P3tGV0BUKuuBEx4BAvv\nr7C3P1AdDS46jYm9bXLmaOJnybtiUaZ2Vp3863+xNpW/EEj0NLG1fbkfjdj/3D9k\nBNSi+w6Cl6RZCVLhsijuHpm7xOb+Hcw+qc/8ByIsN3BCsQMKg8zQgR/jVMwz1WZ+\nsy/jTbvFIzgqJ+POp77a5wnC6EKzdtd+WjLW+JPtRQKBgQDqiX69X5OEhQDEJTg6\n9rGO4T3G/RdY/Bsw+mAwmmgh++H1m5hLu2a4wyzDRG6e9VpWcrdZKfHSns6z9rOJ\nH+KJFfizoedfY0YiIoZAgdfMFl1iFXEdVbGX4ZgiL8WvUEOLoFACCUkD63Xfw/AA\n3IinbTJ24kHt9HLbJ1rK7qqCIwKBgQDpBaLhM4SGNznUhrAHLvpbQV08tA3vppGS\nHalkOA539L5yqbAn/KY0uK4wNKCBYgPcKysV9p0tLWtzFnHveDNiCsAcfMcapzZN\nDh9eDpzNzX+RL9VS2O0+ph18pUqwiMPePKJnI4sEbb3zVzNtm6jN4x8naEFV5jak\nc0w68pKMJQKBgGXjm5q7hcOhYEbWAIqlF1gCBCuJUfZHd6ycaONUgP6ahXyEvvHP\nlP2ZVL3z4bbO0hMSPRLQRQ0CDrxh5Xch0fFKCURIhtKKtzInG3m0rsIryR/OPtjG\nnKNlzwizBkd2MBHdcESiMgUw6oFuhrppFDjgGHdLLecpNih8/VWBv7NPAoGBAINn\nT0OJhrkdGXp0fX1/i2S8hnR94MH8/2gTW/uM9PPGS0Nj11elTKC8aFX8x2pOuHiG\ny2Q2Tso0K7yZsqRk9yzZfR5Tav/nvWJUjXG/8cLImKBqBfUTKS5EBKrOl0DXzwRa\n0wYwb+uOayh3SyQLPHTmGCJj0zw6dyPjdOBk/CkVAoGBAJM1e79HtRl3ylKYvh4i\nIQrNepaZwjp64+QonHM96KRvtQYZE+U8sQkHtfduBJetaCfybggzM7zrgDfgiiaq\n1upcW41b2tRZfTX5jfxti8A0sFCN/XWxMIIHejgK2m3kYqguDxplB+XTFrWlZfE5\nWSanXd6SHfPHHIIqlLz3uROa\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@adminpropauth.iam.gserviceaccount.com",
  client_id: "113611499743593298431",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40adminpropauth.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Inicialización Singleton
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

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
                        
                        const currentSlots = userDoc.data().maxProperties || 1;
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
