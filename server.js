const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du pool PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dernier_metro',
  user: process.env.DB_USER || 'app',
  password: process.env.DB_PASSWORD || 'app',
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  allowExitOnIdle: false,
});

// Test de connexion au démarrage
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur de connexion à PostgreSQL:', err);
  } else {
    console.log('✅ Connecté à PostgreSQL à', res.rows[0].now);
  }
});

app.use(express.json());

// Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// --------------------- ROUTES ---------------------

app.get('/metro-lines', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM metro_lines');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erreur query:', err);
    res.status(500).json({ error: 'database error' });
  } finally {
    client.release();
  }
});

// POST /metro-lines pour créer une nouvelle ligne
app.post('/metro-lines', async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO metro_lines (name, color) VALUES ($1, $2) RETURNING *',
      [name, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /metro-lines/:id
app.get('/metro-lines/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM metro_lines WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /metro-lines/:id
app.delete('/metro-lines/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('DELETE FROM metro_lines WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --------------------- AUTRES ROUTES ---------------------
// Transfer, health, config, next-metro, pool-status etc. ici
// (comme dans ton code précédent)

// 404
app.use((req, res) => res.status(404).json({ error: 'not found' }));

// --------------------- LANCEMENT DU SERVEUR ---------------------
// On ne démarre le serveur que si on n'est pas en test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚇 Last Metro API sur http://localhost:${PORT}`);
  });
}

// --------------------- EXPORTS ---------------------
module.exports = { app, pool };
