-- AJOUT DES POLITIQUES DE MISE À JOUR ET SUPPRESSION (RLS)
-- À exécuter dans le SQL Editor de Supabase pour activer les nouveaux boutons

-- 1. Autoriser les ADMINS à modifier et supprimer le matériel
CREATE POLICY "Admins can update materiels" ON public.materiels 
FOR UPDATE TO authenticated 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Admins can delete materiels" ON public.materiels 
FOR DELETE TO authenticated 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );


-- 2. Autoriser les ADMINS à modifier et supprimer les campagnes
CREATE POLICY "Admins can update inventaires" ON public.inventaires 
FOR UPDATE TO authenticated 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Admins can delete inventaires" ON public.inventaires 
FOR DELETE TO authenticated 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );


-- 3. Autoriser la suppression des lignes d'inventaire (pour le nettoyage lors de la suppression d'une campagne)
CREATE POLICY "Admins can delete inventaire_lignes" ON public.inventaire_lignes 
FOR DELETE TO authenticated 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- OPTIONNEL : Restreindre l'insertion aux admins (sécurité renforcée)
-- DROP POLICY "Authenticated can insert materiels" ON public.materiels;
-- CREATE POLICY "Admins can insert materiels" ON public.materiels FOR INSERT WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- DROP POLICY "Authenticated can insert inventaires" ON public.inventaires;
-- CREATE POLICY "Admins can insert inventaires" ON public.inventaires FOR INSERT WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
