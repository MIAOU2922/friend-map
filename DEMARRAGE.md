# 🚀 Guide de démarrage rapide

## Configuration de la clé API Google Maps

### Étape 1 : Obtenir votre clé API

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez-en un existant
3. Dans le menu, allez dans "APIs et services" > "Bibliothèque"
4. Recherchez et activez les APIs suivantes :
   - **Maps JavaScript API**
   - **Geocoding API**
5. Allez dans "APIs et services" > "Identifiants"
6. Cliquez sur "Créer des identifiants" > "Clé API"
7. Copiez votre clé API

### Étape 2 : Configurer la clé dans le projet

**C'est simple** : Vous devez seulement ajouter la clé dans le fichier `.env` !

Dans le fichier `.env` (ligne 10) :
```env
GOOGLE_MAPS_API_KEY="VOTRE_CLE_API_ICI"
```

**C'est tout!** ✅ La clé API est automatiquement chargée par le serveur de manière sécurisée. Vous n'avez plus besoin de la mettre dans le code HTML!

### Étape 3 : Sécuriser votre clé API (recommandé pour la production)

1. Dans Google Cloud Console, allez dans "Identifiants"
2. Cliquez sur votre clé API
3. Sous "Restrictions relatives aux applications" :
   - Sélectionnez "Références HTTP (sites web)"
   - Ajoutez vos domaines autorisés (ex: `localhost:3000`, `votre-domaine.com`)
4. Sous "Restrictions relatives aux API" :
   - Sélectionnez "Restreindre la clé"
   - Cochez uniquement :
     - Maps JavaScript API
     - Geocoding API

## Installation et lancement

### 1. Installer les dépendances
```bash
npm install
```

### 2. Vérifier la configuration

Le projet utilise SQLite, une base de données locale qui ne nécessite aucun serveur! 🎉

Le fichier `.env` est déjà configuré :
```env
DATABASE_URL="file:./dev.db"
```

**Pas besoin d'installer PostgreSQL ou tout autre serveur de base de données!**

### 3. Initialiser la base de données
```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

### 4. Démarrer l'application
```bash
npm run dev
```

### 5. Ouvrir dans votre navigateur
```
http://localhost:3000
```

## Utilisation rapide

1. **Ajouter un point** :
   - Cliquez sur la carte pour obtenir les coordonnées automatiquement
   - Remplissez le formulaire (nom, couleur, date requis)
   - Cliquez sur "Ajouter"

2. **Voir les points** :
   - La liste apparaît dans la barre latérale
   - Les marqueurs s'affichent sur la carte avec la couleur choisie

3. **Modifier un point** :
   - Cliquez sur "✏️ Modifier" dans la liste
   - Modifiez les champs souhaités
   - Cliquez sur "💾 Enregistrer"

4. **Supprimer un point** :
   - Cliquez sur "🗑️ Supprimer"
   - Confirmez la suppression

5. **Naviguer sur la carte** :
   - Cliquez sur un point dans la liste pour centrer la carte dessus
   - Cliquez sur un marqueur pour voir ses détails

## Problèmes courants

### La carte n'apparaît pas
✅ Vérifiez que la clé API est bien configurée dans le fichier `.env`
✅ Vérifiez que les APIs sont activées dans Google Cloud Console
✅ Redémarrez le serveur après avoir modifié le `.env`
✅ Regardez la console du navigateur (F12) pour voir les erreurs

### Erreur de connexion à la base de données
✅ Le fichier `dev.db` est créé automatiquement par Prisma
✅ Si le problème persiste, supprimez `dev.db` et relancez `npm run prisma:migrate`

### Les points ne s'enregistrent pas
✅ Regardez les logs du serveur dans le terminal
✅ Vérifiez que Prisma est configuré : `npm run prisma:generate`
✅ Vérifiez que les migrations sont à jour : `npm run prisma:migrate`

## Support

Pour plus d'informations, consultez le [README.md](README.md) complet.
