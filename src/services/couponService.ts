import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

export type PackageType = '1' | '5' | '10';

export interface Coupon {
    id: string;
    code: string;
    name: string;
    discountPercent: number; // 0 to 100
    packageType: PackageType;
    remainingUses: number;
    active: boolean;
    createdAt: string;
}

const COUPONS_COLLECTION = 'coupons';

export const couponService = {
    async getAllCoupons(): Promise<Coupon[]> {
        const q = query(collection(db, COUPONS_COLLECTION));
        const snp = await getDocs(q);
        return snp.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
    },

    async createCoupon(data: Omit<Coupon, 'id' | 'createdAt'>): Promise<string> {
        // Enforce uppercase code
        data.code = data.code.toUpperCase().trim();
        const docRef = await addDoc(collection(db, COUPONS_COLLECTION), {
            ...data,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    },

    async updateCoupon(id: string, data: Partial<Coupon>): Promise<void> {
        if (data.code) data.code = data.code.toUpperCase().trim();
        await updateDoc(doc(db, COUPONS_COLLECTION, id), data);
    },

    async deleteCoupon(id: string): Promise<void> {
        await deleteDoc(doc(db, COUPONS_COLLECTION, id));
    },

    async getCouponByCode(code: string): Promise<Coupon | null> {
        if (!code) return null;
        const q = query(
            collection(db, COUPONS_COLLECTION),
            where("code", "==", code.toUpperCase().trim()),
            where("active", "==", true)
        );
        const snp = await getDocs(q);
        if (snp.empty) return null;
        
        const coupon = { id: snp.docs[0].id, ...snp.docs[0].data() } as Coupon;
        if (coupon.remainingUses <= 0) return null; // Used up

        return coupon;
    },

    async consumeCoupon(id: string, currentUses: number): Promise<void> {
        const docRef = doc(db, COUPONS_COLLECTION, id);
        await updateDoc(docRef, {
            remainingUses: currentUses - 1
        });
    }
};
