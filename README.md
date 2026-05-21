# Friend Map 🗺️

Application web interactive de cartographie avec Node.js, TypeScript, Express, Prisma et Google Maps. Ajoutez, modifiez et visualisez des points d'intérêt sur une carte interactive.

## ✨ Fonctionnalités

- 🗺️ **Carte interactive** avec Google Maps
- 📍 **Gestion de points** : Ajout, modification et suppression
- 🎨 **Personnalisation** : Couleurs personnalisées pour chaque point
- 📅 **Dates et lieux** : Stockage d'adresses, coordonnées GPS et lieux-dits
- 🔍 **Navigation intuitive** : Cliquez sur un point dans la liste pour le centrer sur la carte
- 📱 **Design responsive** : Interface adaptée aux mobiles et tablettes

## 📋 Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn
- Clé API Google Maps (voir section Configuration)
- **Pas de base de données externe requise!** SQLite est intégré 🎉

## 🚀 Installation

### 1. Cloner le projet et installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Le fichier `.env` est déjà configuré avec SQLite (base de données locale). Vous avez juste besoin d'ajouter votre clé API Google Maps:

```env
DATABASE_URL="file:./dev.db"
PORT=3000
GOOGLE_MAPS_API_KEY="votre_clé_api_google_maps"
```

**Note** : SQLite crée automatiquement le fichier `dev.db` - aucun serveur de base de données n'est nécessaire!

### 3. Obtenir une clé API Google Maps

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API **Maps JavaScript API** et **Geocoding API**
4. Créez une clé API dans "Identifiants"
5. Copiez la clé et ajoutez-la dans votre fichier `.env`

La clé API est automatiquement chargée depuis le serveur, vous n'avez plus besoin de la mettre dans le HTML! 🎉

### 4. Configurer Prisma

Générer le client Prisma et créer les tables:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Alimenter la base de données (optionnel)

Pour ajouter des données de test (Paris : Tour Eiffel, Arc de Triomphe, Louvre):

```bash
npm run db:seed
```

## 🏃 Démarrage

### Mode développement

```bash
npm run dev
```

Ouvrez votre navigateur sur `http://localhost:3000`

### Mode production

```bash
npm run build
npm start
```

## 🎯 Utilisation

### Ajouter un point

1. Remplissez le formulaire dans la barre latérale :
   - **Nom** : Le nom du point (requis)
   - **Couleur** : Choisissez une couleur pour le marqueur (requis)
   - **Date** : Date associée au point (requis)
   - **Adresse** : Adresse complète (optionnel)
   - **Latitude/Longitude** : Coordonnées GPS (requis)
   - **Lieu-dit** : Nom du lieu (optionnel)
   - **Description** : Ajoutez des détails (optionnel)

2. **Astuce** : Cliquez n'importe où sur la carte pour remplir automatiquement les coordonnées GPS et l'adresse !

3. Cliquez sur "Ajouter" pour sauvegarder

### Modifier un point

- Cliquez sur le bouton "✏️ Modifier" d'un point dans la liste
- Modifiez les informations souhaitées
- Cliquez sur "💾 Enregistrer"

### Supprimer un point

- Cliquez sur le bouton "🗑️ Supprimer" d'un point dans la liste
- Confirmez la suppression

### Navigation sur la carte

- Cliquez sur un point dans la liste pour le centrer sur la carte
- Cliquez sur un marqueur pour afficher ses détails
- Utilisez les contrôles de la carte pour zoomer et vous déplacer

## 📚 API Endpoints

### Configuration

- `GET /api/config` - Récupère la configuration de l'application (clé API Google Maps)

**Réponse :**
```json
{
  "googleMapsApiKey": "AIzaSy..."
}
```

### Points de carte

- `GET /api/points` - Liste tous les points
- `GET /api/points/:id` - Récupère un point par ID
- `POST /api/points` - Crée un nouveau point
- `PUT /api/points/:id` - Met à jour un point
- `DELETE /api/points/:id` - Supprime un point

**Exemple de création de point :**

```json
POST /api/points
{
  "name": "Tour Eiffel",
  "color": "#FF5733",
  "date": "2024-01-15",
  "address": "5 Avenue Anatole France, 75007 Paris",
  "latitude": 48.8584,
  "longitude": 2.2945,
  "placeName": "Monument historique",
  "description": "Visite de la Tour Eiffel"
}
```

## 🛠️ Scripts disponibles

- `npm run dev` - Démarre le serveur en mode développement avec rechargement automatique
- `npm run build` - Compile le TypeScript en JavaScript
- `npm start` - Démarre le serveur en mode production
- `npm run prisma:generate` - Génère le client Prisma
- `npm run prisma:migrate` - Crée et applique les migrations de base de données
- `npm run prisma:studio` - Ouvre Prisma Studio pour gérer la BDD visuellement
- `npm run db:push` - Synchronise le schéma Prisma avec la base de données
- `npm run db:seed` - Alimente la base de données avec des données de test

## 📁 Structure du projet

```
friend-map/
├── prisma/
│   ├── schema.prisma    # Schéma de la base de données
│   └── seed.ts          # Script de seeding
├── src/
│   ├── lib/
│   │   └── prisma.ts    # Configuration du client Prisma
│   ├── routes/
│   │   └── points.ts    # Routes API pour les points
│   └── index.ts         # Point d'entrée de l'application
├── public/
│   ├── index.html       # Interface web
│   ├── style.css        # Styles CSS
│   └── app.js           # Logique JavaScript
├── .env                 # Variables d'environnement
├── .env.example         # Exemple de variables d'environnement
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🗄️ Schéma de la base de données

**Base de données** : SQLite (fichier local `dev.db`)

```prisma
model MapPoint {
  id          String   @id @default(cuid())
  name        String
  color       String   // Code couleur hexadécimal
  date        DateTime
  address     String?  // Adresse exacte
  latitude    Float
  longitude   Float
  placeName   String?  // Lieu-dit
  description String?  // Description optionnelle
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Alternative PostgreSQL** : Pour utiliser PostgreSQL en production, modifiez `prisma/schema.prisma` :
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 🔧 Technologies utilisées

- **Node.js** - Runtime JavaScript
- **TypeScript** - Langage de programmation
- **Express** - Framework web
- **Prisma** - ORM pour la base de données
- **SQLite** - Base de données relationnelle locale (aucun serveur requis)
- **Google Maps API** - Cartographie interactive
- **tsx** - Exécution TypeScript en développement

## 🎨 Captures d'écran

L'interface comprend :
- Une barre latérale avec le formulaire et la liste des points
- Une carte interactive Google Maps occupant le reste de l'écran
- Des marqueurs colorés personnalisables sur la carte
- Des info-bulles détaillées au clic sur les marqueurs

## 🔐 Sécurité

✅ **Bonne pratique appliquée** : La clé API Google Maps est stockée uniquement dans le fichier `.env` et jamais exposée dans le code source HTML/JS côté client en dur. Elle est chargée dynamiquement par le serveur.

⚠️ **Important** : 
- Ne commitez jamais votre fichier `.env` dans Git (déjà dans `.gitignore`)
- Le fichier `.env.example` ne contient pas de vraies clés 

Pour la production :
1. Restreignez votre clé API dans Google Cloud Console
2. Limitez les domaines autorisés
3. Activez uniquement les APIs nécessaires
4. Surveillez votre utilisation

## 🐛 Dépannage

### La carte ne s'affiche pas
- Vérifiez que votre clé API Google Maps est valide
- Assurez-vous que l'API Maps JavaScript est activée
- Regardez la console du navigateur pour les erreurs

### Erreur de connexion à la base de données
- Vérifiez que PostgreSQL est démarré
- Contrôlez la chaîne de connexion dans `.env`
- Assurez-vous que la base de données existe

### Les points ne s'affichent pas
- Exécutez `npm run prisma:generate` après modification du schéma
- Vérifiez que les migrations sont appliquées

## 📝 Notes

- Le schéma Prisma utilise PostgreSQL par défaut
- Les migrations Prisma sont générées dans `prisma/migrations/` (ignoré par Git)
- Utilisez Prisma Studio (`npm run prisma:studio`) pour une interface graphique de gestion de la base de données
- L'API Google Maps nécessite une clé valide pour fonctionner

## 🤝 Contribution

N'hésitez pas à contribuer au projet en ouvrant des issues ou des pull requests!
