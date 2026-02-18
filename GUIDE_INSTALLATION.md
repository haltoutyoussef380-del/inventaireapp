# Guide d'Installation - Application Inventaire Hospitalier (Supabase)

## Prérequis
- Node.js installé
- Compte Supabase (Cloud)

## Installation et Démarrage

Cette application est désormais une **Single Page Application (SPA)** connectée directement au cloud Supabase. Il n'y a plus de serveur backend local à lancer.

1. **Ouvrir le terminal** dans le dossier `frontend` :
   ```cmd
   cd frontend
   ```

2. **Installer les dépendances** (si ce n'est pas déjà fait) :
   ```cmd
   npm install
   ```

3. **Lancer l'application** :
   ```cmd
   npm run dev
   ```

4. **Accéder à l'application** :
   Ouvrez votre navigateur sur l'URL indiquée (ex: `http://localhost:5178` ou le port indiqué dans le terminal).

## Gestion des Rôles

- **Administrateur** : A accès à tout le menu (Dashboard, Matériels, Inventaire). Peut créer/modifier du matériel.
- **Agent** : N'a accès qu'à la page d'Inventaire pour scanner.

**Pour créer un compte :**
1. Utilisez l'écran de Login pour vous connecter (les comptes doivent être créés dans Supabase Auth au préalable ou inscription libre si activé).
2. Pour définir un **Admin**, allez dans la table `profiles` de Supabase et changez le rôle de `agent` à `admin` pour l'utilisateur concerné.
