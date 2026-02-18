import { supabase } from '../supabase';

export const materielService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('materiels')
            .select('*, categories(code, libelle)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    create: async (materiel: any) => {
        // 1. Sanitize Payload
        // Remove empty strings for optional fields (creates DB errors on dates)
        const payload = { ...materiel };
        if (!payload.date_acquisition) delete payload.date_acquisition;
        if (payload.categorie_id) payload.categorie_id = parseInt(payload.categorie_id, 10);

        // 2. Get Category Code
        const { data: cat } = await supabase.from('categories').select('code').eq('id', payload.categorie_id).single();
        const codeCat = cat?.code || 'INC';

        // 3. Generate Number (Approximation for demo)
        const year = new Date().getFullYear();
        const prefix = `PSY-${year}-${codeCat}`;

        // Find last sequence
        const { data: last } = await supabase
            .from('materiels')
            .select('numero_inventaire')
            .ilike('numero_inventaire', `${prefix}-%`)
            .order('numero_inventaire', { ascending: false })
            .limit(1)
            .single();

        let sequence = 1;
        if (last) {
            const parts = last.numero_inventaire.split('-');
            const lastSeq = parseInt(parts[3]);
            if (!isNaN(lastSeq)) sequence = lastSeq + 1;
        }

        const numero_inventaire = `${prefix}-${sequence.toString().padStart(4, '0')}`;

        const { data, error } = await supabase
            .from('materiels')
            .insert([{ ...payload, numero_inventaire }])
            .select()
            .single();

        if (error) {
            console.error("Supabase Create Error:", error);
            throw error;
        }
        return data;
    },

    uploadPhoto: async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('materiel-photos')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from('materiel-photos').getPublicUrl(filePath);
        return data.publicUrl;
    },

    getBarcodeUrl: (code: string) => {
        // Using bwip-js locally or via a public API for simple img src
        // Since we removed the backend, we can use a public API or a client-side lib.
        // Let's use a robust public API for now to save setup time, or we can use the bwip-js client side.
        return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${code}&scale=3&includetext`;
    }
};

export const categorieService = {
    getAll: async () => {
        const { data, error } = await supabase.from('categories').select('*');
        if (error) throw error;
        return data;
    }
};

export const inventaireService = {
    create: async (inventaire: any) => {
        const { data, error } = await supabase
            .from('inventaires')
            .insert([inventaire])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    scan: async (scanData: { inventaire_id: number, code_barres: string, user_id: string }) => {
        // 1. Find materiel
        const { data: materiel, error: matError } = await supabase
            .from('materiels')
            .select('*')
            .eq('numero_inventaire', scanData.code_barres)
            .single();

        if (matError || !materiel) throw new Error('Matériel non trouvé');

        // 2. Insert line
        const { data: ligne, error: lineError } = await supabase
            .from('inventaire_lignes')
            .insert([{
                inventaire_id: scanData.inventaire_id,
                materiel_id: materiel.id,
                scanne_par: scanData.user_id,
                presence: true
            }])
            .select()
            .single();

        if (lineError) throw lineError;
        return { materiel, ligne };
    }
};
