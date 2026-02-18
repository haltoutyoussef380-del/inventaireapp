-- 1. Ajouter la colonne photo_url à la table materiels
ALTER TABLE public.materiels 
ADD COLUMN photo_url text;

-- 2. Créer le Bucket de Stockage "materiel-photos"
insert into storage.buckets (id, name, public) 
values ('materiel-photos', 'materiel-photos', true);

-- 3. Configurer les politiques de sécurité (RLS) pour le Stockage

-- Permettre l'accès public en lecture (pour voir les images)
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'materiel-photos' );

-- Permettre l'upload aux utilisateurs connectés (Agents/Admins)
create policy "Authenticated Upload" 
on storage.objects for insert 
with check ( bucket_id = 'materiel-photos' and auth.role() = 'authenticated' );

-- Permettre la suppression/modification (optionnel, pour Admin)
create policy "Admin Update" 
on storage.objects for update
using ( bucket_id = 'materiel-photos' and auth.role() = 'authenticated' );
