const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Logger basique (pour voir les requêtes)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ENDPOINT 1 : Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'lastmetro-api',
    timestamp: new Date().toISOString()
  });
});

// ENDPOINT 2 : Calculer le prochain métro
app.get('/next-metro', (req, res) => {
  const station = req.query.station;

  // Validation
  if (!station) {
    return res.status(400).json({ error: 'missing station parameter' });
  }

  // Simulation : ajouter 5 minutes à l'heure actuelle
  const now = new Date();
  const next = new Date(now.getTime() + 5 * 60 * 1000);
  const nextTime = `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;

  res.status(200).json({
    station: station,
    line: 'M1',
    nextArrival: nextTime,
    headwayMin: 5
  });
});

// 404 pour toutes les autres routes
app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚇 Last Metro API démarrée sur http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});