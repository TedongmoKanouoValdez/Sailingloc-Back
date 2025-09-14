SailingLoc – Plateforme de Location de Bateaux
SailingLoc est une plateforme de location de bateaux qui permet aux utilisateurs de réserver facilement des bateaux en ligne, aux propriétaires de gérer leurs bateaux, et à l’administrateur de superviser l’ensemble via une interface intuitive.
Fonctionnalités principales

 Gestion des utilisateurs : inscription, connexion sécurisée (JWT), rôles (Client, Propriétaire, Admin)
 Gestion des bateaux : création, mise à jour, suppression et visualisation des bateaux disponibles
 Réservations : système de réservation simple et sécurisé
 Stockage des médias : gestion des photos de bateaux et photos de profil via Cloudinary
 Sécurité : API protégée par JWT + HTTPS
 Dashboard Admin : suivi des utilisateurs, réservations et revenus
Stack Technique
 Frontend : Next.js (hébergé sur Vercel)
 Backend : Node.js + Express
 Base de données : PostgreSQL avec Prisma
 Stockage médias : Cloudinary
 Authentification : JWT + Bcrypt pour le hachage des mots de passe

Installation et Démarrage
Cloner le projet
git clone https://github.com/ton-utilisateur/ Pandawan
cd Pandawan
Installer les dépendances (backend & frontend)

# Backend
cd Sailinloc-back npm install # Frontend cd Sailinloc-front npm install Configurer les variables d’environnement Créer un fichier .env dans sailinloc-back / : DATABASE_URL="postgresql://user:password@localhost:5432/sailingloc" JWT_SECRET="ton_secret_pour_jwt" CLOUDINARY_CLOUD_NAME="ton_nom_de_cloud" CLOUDINARY_API_KEY="ta_cle_api" CLOUDINARY_API_SECRET="ton_secret_api" Créer un fichier .env.local dans sailinloc-front / si nécessaire : NEXT_PUBLIC_API_URL="http://localhost:3000/api" Initialiser la base de données cd sailinloc-back npx prisma migrate dev --name init npx prisma db seed Lancer le projet en développement # Lancer le backend cd Sailinloc-back npm run dev
# Lancer le frontend cd ../ Sailinloc-front npm run dev

Le projet sera disponible sur :
Frontend → https://dsp-dev-o23-g1.vercel.app/
Tests
Lancer les tests unitaires
cd sailinloc-back
npm run test
Lancer les tests avec couverture
npx jest --coverage

Déploiement
Frontend : déployé automatiquement via Vercel à chaque git push sur la brancheprincipale
Backend : déployé sur OVH (VPS) avec PM2 et Nginx en reverse proxy
Sauvegardes : base PostgreSQL sauvegardée quotidiennement avec snapshots VPS

Scripts utiles
Backend
Commande
Description
npm run dev
Lancer le backend en mode développement
npm run build
Compiler le projet
npm run test
Lancer les tests unitaires

Frontend
Commande
Description
npm run dev
Lancer le frontend en développement
npm run build
Générer la version production
npm start
Lancer le frontend en production

Tests de charge avec Locust
Installer Locust
Si Locust n’est pas encore installé :
pip install locust
Lancer Locust
Depuis le dossier contenant ton fichier locustfile.py :
locust -f locustfile.py --host=http://localhost:3001