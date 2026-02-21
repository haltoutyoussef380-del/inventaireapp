-- 1. Ajouter la colonne full_name à la table profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Mettre à jour la fonction handle_new_user pour copier le nom depuis metadata
-- Note: on récupère full_name depuis raw_user_meta_data qui est rempli lors du signUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'agent'),
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Réparer les données existantes (facultatif mais recommandé)
-- Tente de récupérer les noms existants depuis auth.users vers profiles
UPDATE public.profiles p
SET full_name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE p.id = u.id AND p.full_name IS NULL;

-- 4. Ajouter une Clé Étrangère explicite pour faciliter les JOIN PostgREST
-- Supabase a besoin d'un lien direct entre inventaire_lignes et profiles pour le select agent:profiles
ALTER TABLE public.inventaire_lignes DROP CONSTRAINT IF EXISTS inventaire_lignes_scanne_par_fkey;
ALTER TABLE public.inventaire_lignes 
ADD CONSTRAINT inventaire_lignes_scanne_par_fkey 
FOREIGN KEY (scanne_par) REFERENCES public.profiles(id);
