import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import pointRoutes from './routes/points';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes API
app.use('/api/points', pointRoutes);

// Route pour obtenir la configuration (clé API)
app.get('/api/config', (_req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ''
  });
});

// Route principale - servir l'interface
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`🗺️  Carte interactive disponible sur http://localhost:${PORT}`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n👋 Arrêt du serveur...');
  process.exit(0);
});

export default app;
