export const exchangeService = {
    /**
     * Obtiene la cotización del dólar oficial desde DolarAPI.
     * Si falla, devuelve un fallback fijo de mercado aproxs.
     */
    async getOfficialDollarRate(): Promise<number> {
        try {
            const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
            if (!response.ok) throw new Error("Fallo API Dolar");
            const data = await response.json();
            // Data shape: { compra: 880, venta: 920, casa: 'oficial', fechaActualizacion: ... }
            return data.venta || 1000;
        } catch (error) {
            console.error("Error fetching Exchange Rate", error);
            return 1000; // Fallback hardcoded para resiliencia
        }
    }
};
