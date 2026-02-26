-- AJOUT DU CHAMP ADRESSE IP AUX MATÉRIELS
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE public.materiels 
ADD COLUMN adresse_ip text;

-- Commentaire pour documentation
COMMENT ON COLUMN public.materiels.adresse_ip IS 'Adresse IP du matériel (pour matériel informatique)';
